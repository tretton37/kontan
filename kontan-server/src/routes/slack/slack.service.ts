import { Injectable } from '@nestjs/common';
import { Admin } from '../../services/Admin';
import { UserService } from '../../services/UserService';
import { OfficeService } from '../../services/OfficeService';
import { SlackClient } from '../../services/SlackClient';
import { SlackEvent } from '../../types';
import {
  ACTIONS,
  BLOCK_IDS,
  homeScreen,
  newUserBlock,
  registerModal,
} from '../../blocks';

export interface Action {
  action_id: string;
  block_id: string;
  value: string;
  type: string;
  action_ts: string;
  selected_options: { value: string }[];
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

  async handleInteractive(payload: any) {
    if (payload.type === 'block_actions') {
      const { value, action_id, selected_options } = payload
        ?.actions?.[0] as Action;
      if (value === ACTIONS.REGISTER_BUTTON) {
        await this.web.views.open({
          user_id: payload.user.id,
          view: registerModal,
          trigger_id: payload.trigger_id,
        });
      }
      if (value === ACTIONS.REFRESH_BUTTON) {
        await this.showHomeScreen(payload.user.id);
      }
      if (action_id === ACTIONS.DAY_CHECKBOX) {
        const values = selected_options.map(({ value }) =>
          value.replace('weekdayCheckbox-', ''),
        );
        await this.officeService.setPlannedPresence(values, payload.user.id);
        await this.showHomeScreen(payload.user.id);
      }
    }

    if (payload.type === ACTIONS.SUBMIT) {
      const tag =
        payload.view.state.values[BLOCK_IDS.NFC_SERIAL][
          BLOCK_IDS.NFC_SERIAL + '-action'
        ]?.value;
      const { id, username, name } = payload.user;
      await this.userService.createUser({
        slackUserId: id,
        tag,
        username,
        name,
      });
      await this.showHomeScreen(id);
      return;
    }
  }

  async showHomeScreen(userId: string) {
    const [presentUsers, plannedPresence] = await Promise.all([
      this.officeService.whoIsInbound(),
      this.officeService.getPlannedPresence(),
    ]);

    await this.web.views.publish({
      user_id: userId,
      view: homeScreen({ presentUsers, plannedPresence, userId }),
    });
  }
}
