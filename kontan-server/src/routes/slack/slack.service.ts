import { Injectable } from '@nestjs/common';
import { Admin } from '../../services/Admin';
import { UserService } from '../../services/UserService';
import { OfficeService } from '../../services/OfficeService';
import { SlackClient } from '../../services/SlackClient';
import { SlackEvent } from '../../types';
import {
  ACTIONS,
  BLOCK_IDS,
  MODALS,
  homeScreen,
  newUserBlock,
  registerModal,
  settingsModal,
} from '../../blocks';
import * as crypto from 'crypto';

export interface Action {
  action_id: string;
  block_id: string;
  value: string;
  type: string;
  action_ts: string;
  selected_options: { value: string }[];
  selected_option: { value: string };
}

@Injectable()
export class SlackService {
  constructor(
    private readonly admin: Admin,
    private readonly userService: UserService,
    private readonly officeService: OfficeService,
    private readonly web: SlackClient,
  ) {}

  async handleEvent(event: SlackEvent) {
    if (event.type === 'app_home_opened') {
      const firstTimeUser = !(await this.userService.userExists(event.user));
      if (firstTimeUser) {
        await this.web.views.publish({
          user_id: event.user,
          view: {
            ...newUserBlock,
          },
        });
      } else {
        await this.showHomeScreen(event.user);
      }
    }
  }

  async scheduleBotHomeMessage(
    user: string,
    text: string,
    inMinutesFromNow = 1,
  ) {
    await this.web.chat.scheduleMessage({
      channel: user,
      text,
      post_at: Math.ceil(Date.now() / 1000) + inMinutesFromNow * 60,
    });
  }

  async sendBotHomeMessage(user: string, text: string) {
    await this.web.chat.postMessage({ channel: user, text });
  }

  async handleInteractive(payload: any) {
    if (payload.type === 'block_actions') {
      const { value, action_id, selected_options, selected_option } = payload
        ?.actions?.[0] as Action;
      if (value === ACTIONS.REGISTER_BUTTON) {
        const offices = await this.officeService.getOffices();
        await this.web.views.open({
          user_id: payload.user.id,
          view: registerModal(offices),
          trigger_id: payload.trigger_id,
        });
      }
      if (value === ACTIONS.SETTINGS_BUTTON) {
        const user = await this.userService.getUser(payload.user.id);
        if (user.tag === 'NO_TAG') {
          user.tag = '';
        }
        await this.web.views.open({
          user_id: payload.user.id,
          view: settingsModal(user),
          trigger_id: payload.trigger_id,
        });
      }
      if (value === ACTIONS.CHECKIN_BUTTON) {
        const user = await this.userService.getUser(payload.user.id);
        await this.officeService.checkUser(payload.user.id, user.office);
        await this.showHomeScreen(payload.user.id);
      }
      if (value === ACTIONS.REFRESH_BUTTON) {
        await this.showHomeScreen(payload.user.id);
      }
      if (action_id === ACTIONS.DAY_CHECKBOX) {
        const values = selected_options.map(({ value }) =>
          value.replace('weekdayCheckbox-', ''),
        );
        const user = await this.userService.getUser(payload.user.id);
        await this.officeService.setPlannedPresence(values, user);
        await this.showHomeScreen(payload.user.id);
      }
      if (action_id === ACTIONS.OFFICE_SELECT) {
        const user = await this.userService.getUser(payload.user.id);
        user.office = selected_option.value;
        await this.userService.updateUser(payload.user.id, user);
        await this.showHomeScreen(payload.user.id);
      }
    }

    if (payload.type === ACTIONS.SUBMIT) {
      if (payload.view.callback_id === MODALS.REGISTER) {
        const homeOffice =
          payload.view.state.values[BLOCK_IDS.HOME_OFFICE][
            BLOCK_IDS.HOME_OFFICE + '-action'
          ].selected_option.value;
        const tag =
          payload.view.state.values[BLOCK_IDS.NFC_SERIAL][
            BLOCK_IDS.NFC_SERIAL + '-action'
          ].value?.toLowerCase() ?? 'NO_TAG';
        const { id, username, name } = payload.user;
        await this.userService.createUser({
          slackUserId: id,
          tag,
          username,
          name,
          office: homeOffice,
          compactMode: false,
        });
        await this.showHomeScreen(id);
        return;
      }
      if (payload.view.callback_id === MODALS.SETTINGS) {
        const tag =
          payload.view.state.values[BLOCK_IDS.NFC_SERIAL][
            BLOCK_IDS.NFC_SERIAL + '-action'
          ].value?.toLowerCase() ?? 'NO_TAG';
        const compactMode =
          payload.view.state.values[BLOCK_IDS.COMPACT_MODE][
            BLOCK_IDS.COMPACT_MODE + '-action'
          ].selected_options[0]?.value ?? 'false';
        const id = payload.user.id;
        const user = await this.userService.getUser(id);
        user.tag = tag;
        user.compactMode = JSON.parse(compactMode);
        await this.userService.updateUser(id, user);
        await this.showHomeScreen(id);
        return;
      }
    }
  }

  async showHomeScreen(userId: string) {
    const user = await this.userService.getUser(userId);
    const offices = await this.officeService.getOffices();
    if (!user.office) {
      user.office = offices[0].id;
    }

    const [presentUsers, plannedPresence] = await Promise.all([
      this.officeService.whoIsInbound(user.office),
      this.officeService.getPlannedPresence(user.office),
    ]);

    await this.web.views.publish({
      user_id: userId,
      view: homeScreen({
        presentUsers,
        plannedPresence,
        user,
        offices,
      }),
    });
  }

  validateSlackRequest(
    request: Request,
    requestBody: Buffer,
    headers: Headers,
  ) {
    const slackAppSigningSecret = process.env.SLACK_SIGNING_SECRET as string;
    const timestamp = Number(headers['x-slack-request-timestamp']);

    // verify that the timestamp does not differ from local time by more than
    // five minutes
    if (
      !timestamp ||
      Math.abs(Math.floor(new Date().getTime() / 1000) - timestamp) > 60 * 5
    ) {
      console.log('NO TIMESTAMP OR LOCAL TIME DIFF > 5 MIN');
      return false;
    }

    // compute the basestring
    const baseStr = `v0:${timestamp}:${requestBody}`;

    // extract the received signature from the request headers
    const receivedSignature = headers['x-slack-signature'] as string;

    // compute the signature using the basestring
    // and hashing it using the signing secret
    // which can be stored as a environment variable
    const expectedSignature = `v0=${crypto
      .createHmac('sha256', slackAppSigningSecret)
      .update(baseStr, 'utf8')
      .digest('hex')}`;

    // match the two signatures
    if (
      crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(receivedSignature),
      )
    ) {
      return true;
    }

    console.log('WEBHOOK SIGNATURE MISMATCH');
    return false;
  }
}
