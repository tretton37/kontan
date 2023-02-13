import {app} from "firebase-admin";
import {WebClient} from "@slack/web-api";
import App = app.App;


export interface User {
    tag: string;
    name: string;
    username: string;
    slackUserId: string;
}

export class UserService {
  admin: App;
  web: WebClient;

  constructor(admin: App) {
    this.admin = admin;
    this.web = new WebClient(process.env.SLACK_TOKEN);
  }

  async createUser({tag, slackUserId}: User) {
    const {user} = await this.web.users.info({user: slackUserId});
    const ref = this.admin.firestore().collection("users").doc(slackUserId);
    await ref.set({
      username: user?.profile?.display_name,
      name: user?.real_name,
      tag,
      slackUserId,
    });
  }

  async userExists(slackUserId: string) {
    const ref = this.admin
        .firestore()
        .collection("users")
        .doc(slackUserId);
    const snapshot = await ref.get();
    return snapshot.exists;
  }
}
