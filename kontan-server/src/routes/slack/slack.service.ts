import { Injectable } from '@nestjs/common';
import { Admin } from '../../services/Admin';
import { UserService } from '../../services/UserService';
import {
  OfficeService,
  ParkingSpacePresenceDto,
} from '../../services/OfficeService';
import { SlackClient } from '../../services/SlackClient';
import { SlackEvent } from '../../types';
import {
  ACTIONS,
  BLOCK_IDS,
  MODALS,
  homeScreen,
  newUserBlock,
  registerModal,
  parkingModal,
  settingsModal,
  statusMessageModal,
  statusMessageTodayModal,
  MISC_OPTIONS_TO_KEYS,
} from '../../blocks';
import * as crypto from 'crypto';
import { weekdayKeyBuilder } from '../../utils';

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
      if (value === ACTIONS.PARKING_MODAL) {
        const user = await this.userService.getUser(payload.user.id);
        const plannedParking = await this.officeService.getPlannedParking(
          user.office,
        );
        const pDto: ParkingSpacePresenceDto[] = await Promise.all(
          Object.values(plannedParking)
            .map(async (p) => {
              if (!p?.slackUserId) {
                return null;
              }
              return {
                ...p,
                user: await this.userService.getUser(p.slackUserId),
              };
            })
            .filter(Boolean),
        );
        await this.web.views.open({
          user_id: payload.user.id,
          view: parkingModal({ plannedParking: pDto, user }),
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
      if (value === ACTIONS.STATUS_MESSAGE_BUTTON) {
        const user = await this.userService.getUser(payload.user.id);
        if (user.tag === 'NO_TAG') {
          user.tag = '';
        }
        const plannedPresence = await this.officeService.getPlannedPresence(
          user.office,
        );
        const filtered = plannedPresence.filter((p) =>
          p.users.some((u) => u.slackUserId === user.slackUserId),
        );

        await this.web.views.open({
          user_id: payload.user.id,
          view: statusMessageModal(user.slackUserId, filtered),
          trigger_id: payload.trigger_id,
        });
      }
      if (value === ACTIONS.CHECKIN_BUTTON) {
        const user = await this.userService.getUser(payload.user.id);
        const res = await this.officeService.checkUser(
          payload.user.id,
          user.office,
        );
        if (res.status === 'INBOUND' && !user.blockStatusMessagePrompt) {
          await this.showAddTodayStatusModal(
            payload.user.id,
            payload.trigger_id,
          );
        } else {
          await this.showHomeScreen(payload.user.id);
        }
      }
      if (value === ACTIONS.REFRESH_BUTTON) {
        await this.showHomeScreen(payload.user.id);
      }
      if (action_id === ACTIONS.PARKING_CHECKBOX) {
        const user = await this.userService.getUser(payload.user.id);
        const values = selected_options.map(({ value }) =>
          value.replace('weekdayCheckbox-', ''),
        );
        const alreadyPlannedParkingForUser =
          await this.officeService.getPlannedParkingForUser(user);
        const set = new Set(alreadyPlannedParkingForUser ?? []);
        for (let i = 0; i < values.length; i++) {
          if (set.has(values[i])) {
            continue;
          }
          await this.officeService.setPlannedParking(user, values[i]);
        }

        await Promise.all(
          alreadyPlannedParkingForUser.map(async (v) => {
            if (!values.includes(v.dayKey)) {
              await this.officeService.deletePlannedParking(user, v.dayKey);
            }
          }),
        );

        const plannedParking = await this.officeService.getPlannedParking(
          user.office,
        );
        const pDto: ParkingSpacePresenceDto[] = await Promise.all(
          Object.values(plannedParking)
            .map(async (p) => {
              if (!p?.slackUserId) {
                return null;
              }
              return {
                ...p,
                user: await this.userService.getUser(p.slackUserId),
              };
            })
            .filter(Boolean),
        );

        await this.web.views.update({
          user_id: payload.user.id,
          view_id: payload.view.id,
          view: parkingModal({ plannedParking: pDto, user }),
          trigger_id: payload.trigger_id,
        });
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

    // Refresh home screen if user dismissed adding a status for today
    if (
      payload.type === 'view_closed' &&
      payload.view.callback_id === MODALS.STATUS_MESSAGE_TODAY
    ) {
      await this.showHomeScreen(payload.user.id);
      return;
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
          blockStatusMessagePrompt: false,
        });
        await this.showHomeScreen(id);
        return;
      }
      if (payload.view.callback_id === MODALS.STATUS_MESSAGE) {
        const user = await this.userService.getUser(payload.user.id);
        const dayKey =
          payload.view.state.values[BLOCK_IDS.STATUS_MESSAGE_DAY][
            BLOCK_IDS.STATUS_MESSAGE_DAY + '-action'
          ].selected_option.value;

        const statusMessage =
          payload.view.state.values[BLOCK_IDS.STATUS_MESSAGE_MESSAGE][
            BLOCK_IDS.STATUS_MESSAGE_MESSAGE + '-action'
          ].value;
        if (dayKey && statusMessage) {
          await this.officeService.setStatusMessage(
            user,
            dayKey,
            statusMessage,
          );
        }
        await this.showHomeScreen(user.slackUserId);
      }
      if (payload.view.callback_id === MODALS.STATUS_MESSAGE_TODAY) {
        const user = await this.userService.getUser(payload.user.id);
        const statusMessage =
          payload.view.state.values[BLOCK_IDS.STATUS_MESSAGE_TODAY_MESSAGE][
            BLOCK_IDS.STATUS_MESSAGE_TODAY_MESSAGE + '-action'
          ].value;

        if (statusMessage) {
          await this.officeService.setStatusMessage(
            user,
            weekdayKeyBuilder(Date.now()),
            statusMessage,
          );
        }
        await this.showHomeScreen(user.slackUserId);
      }
      if (payload.view.callback_id === MODALS.SETTINGS) {
        const tag =
          payload.view.state.values[BLOCK_IDS.NFC_SERIAL][
            BLOCK_IDS.NFC_SERIAL + '-action'
          ].value?.toLowerCase() ?? 'NO_TAG';
        const id = payload.user.id;
        const user = await this.userService.getUser(id);
        user.tag = tag;
        const miscOptions = payload.view.state.values[BLOCK_IDS.MISC][
          BLOCK_IDS.MISC + '-action'
        ].selected_options.reduce((acc, curr) => {
          const key = MISC_OPTIONS_TO_KEYS[curr.value];
          if (key) {
            return { ...acc, [key]: true };
          }
          return { ...acc };
        }, {});

        // Default values
        const userOptions = {
          compactMode: false,
          blockStatusMessagePrompt: false,
          ...miscOptions,
        };

        await this.userService.updateUser(id, { ...user, ...userOptions });
        await this.showHomeScreen(id);
        return;
      }
    }
  }

  async showAddTodayStatusModal(userId: string, triggerId) {
    const user = await this.userService.getUser(userId);
    const hasStatus = await this.officeService.userHasStatusMessageForDay(
      userId,
      weekdayKeyBuilder(Date.now()),
      user.office,
    );

    if (!hasStatus) {
      await this.web.views.open({
        user_id: userId,
        view: statusMessageTodayModal(),
        trigger_id: triggerId,
      });
    } else {
      return false;
    }
  }

  async showHomeScreen(userId: string) {
    const user = await this.userService.getUser(userId);
    const offices = await this.officeService.getOffices();
    const statusMessages = await this.officeService.getStatusMessagesForOffice(
      user.office,
    );
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
        statusMessages,
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
