import { Injectable } from '@nestjs/common';
import { Admin } from './Admin';
import { SlackClient } from './SlackClient';

export interface User {
  tag: string;
  name: string;
  username: string;
  slackUserId: string;
  office: string;
  compactMode: boolean;
}
@Injectable()
export class UserService {
  constructor(
    private readonly admin: Admin,
    private readonly web: SlackClient,
  ) {}
  async createUser({ tag, slackUserId, office, compactMode }: User) {
    if (await this.userExists(slackUserId)) {
      return;
    }
    const { user } = await this.web.users.info({ user: slackUserId });
    const ref = this.admin.db().collection('users').doc(slackUserId);
    await ref.set({
      username: user?.profile?.display_name,
      name: user?.real_name,
      tag,
      slackUserId,
      office,
      compactMode,
    });
  }

  async userExists(slackUserId: string) {
    const ref = this.admin.db().collection('users').doc(slackUserId);
    const snapshot = await ref.get();
    return snapshot.exists;
  }

  async getUser(slackUserId: string) {
    const ref = await this.admin
      .db()
      .collection('users')
      .doc(slackUserId)
      .get();
    return ref.data() as User;
  }

  async tagExists(tagId: string) {
    const ref = this.admin.db().collection('users').where('tag', 'in', [tagId]);
    const snapshot = await ref.get();
    return !snapshot.empty;
  }

  async getUserByTag(tagId: string) {
    const ref = this.admin.db().collection('users').where('tag', 'in', [tagId]);
    const snapshot = await ref.get();
    if (!snapshot.empty) {
      const data = await snapshot.docs?.[0].data();
      return data as User;
    }
    return undefined;
  }

  async updateUser(
    slackUserId: string,
    { tag, office, compactMode = false }: User,
  ) {
    const ref = this.admin.db().collection('users').doc(slackUserId);
    await ref.update({
      office,
      tag,
      compactMode,
    });
  }
}
