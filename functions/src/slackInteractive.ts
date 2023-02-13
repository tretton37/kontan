import type {Request, Response} from "firebase-functions";
import {ACTIONS, BLOCK_IDS, registerModal} from "./blocks";
import * as slack from "@slack/web-api";
import {app} from "firebase-admin";
import {UserService} from "./services/UserService";
import {showHomeScreen} from "./slackEvent";
import {OfficeService} from "./services/OfficeService";
import {validateSlackRequest} from "./validateSlackRequest";
/* eslint-disable camelcase */

interface Action {
  action_id: string;
  block_id: string;
  value: string;
  type: string;
  action_ts: string;
  selected_options: { value: string}[]
}
export default async (request: Request, response: Response, admin: app.App) => {
  console.log("test");
  if (!validateSlackRequest(request)) {
    return response.status(400)
        .send("Error: Signature mismatch security error");
  }

  const service = new UserService(admin);
  const officeService = new OfficeService(admin);
  const web = new slack.WebClient(process.env.SLACK_TOKEN);
  const payload = JSON.parse(request.body.payload);
  if (payload.type === "block_actions") {
    const {value, action_id, selected_options} = payload?.actions
        ?.[0] as Action;
    if (value === ACTIONS.REGISTER_BUTTON) {
      await web
          .views
          .open({
            user_id: payload.user.id,
            view: registerModal,
            trigger_id: payload.trigger_id,
          });
    }
    if (value === ACTIONS.REFRESH_BUTTON) {
      await showHomeScreen(web, payload.user.id, admin);
    }
    if (action_id === ACTIONS.DAY_CHECKBOX) {
      // console.log(selected_options);
      const values = selected_options
          .map(({value}) => value.replace("weekdayCheckbox-", ""));
      await officeService.setPlannedPresence(values, payload.user.id);
      await showHomeScreen(web, payload.user.id, admin);
    }
  }

  if (payload.type === ACTIONS.SUBMIT) {
    const tag = payload
        .view
        .state
        .values[BLOCK_IDS.NFC_SERIAL][BLOCK_IDS.NFC_SERIAL + "-action"]?.value;
    const {id, username, name} = payload.user;
    await service.createUser({slackUserId: id, tag, username, name});
    response.status(200).send();
    await showHomeScreen(web, id, admin);
    return;
  }

  return response.status(200).send("OK");
};
