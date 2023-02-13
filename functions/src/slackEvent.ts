import type {Request, Response} from "firebase-functions";
import type {SlackEvent} from "./types";
import * as slack from "@slack/web-api";
import {newUserBlock, homeScreen} from "./blocks";
import {app} from "firebase-admin";
import {UserService} from "./services/UserService";
import {OfficeService} from "./services/OfficeService";
import {validateSlackRequest} from "./validateSlackRequest";

export default async (request: Request, response: Response, admin: app.App) => {
  if (!validateSlackRequest(request)) {
    return response.status(400)
        .send("Error: Signature mismatch security error");
  }

  const {challenge, event} =
        request.body satisfies {
            challenge: string,
            event: SlackEvent
        };

  if (challenge) {
    // If slack pings this endpoint to verify it's valid
    response.send({challenge});
  }

  if (event) {
    await handleEvent(event, admin);
  }

  return response.status(200).send("OK");
};

const handleEvent = async (event: SlackEvent, admin: app.App) => {
  const web = new slack.WebClient(process.env.SLACK_TOKEN);
  const service = new UserService(admin);
  if (event.type === "app_home_opened") {
    const firstTimeUser = !(await service.userExists(event.user!));
    if (firstTimeUser) {
      await web.views.publish({
        user_id: event.user!,
        view: {
          ...newUserBlock,
        },
      });
    } else {
      await showHomeScreen(web, event.user!, admin);
    }
  }
};

export const showHomeScreen = async (
    web: slack.WebClient, userId: string, admin: app.App
) => {
  const officeService = new OfficeService(admin);
  const [presentUsers, plannedPresence] = await Promise.all([
    officeService.whoIsInbound(), officeService.getPlannedPresence(),
  ]);

  await web
      .views
      .publish({
        user_id: userId,
        view: homeScreen({presentUsers, plannedPresence, userId}),
      });
};
