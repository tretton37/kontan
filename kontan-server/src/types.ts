export type SlackEventType =
  | 'member_joined_channel'
  | 'app_home_opened'
  | 'message';

export interface SlackEvent {
  type?: SlackEventType;
  subtype?: string;
  channel?: string;
  channel_type?: string;
  team?: string;
  bot_id?: string;
  inviter?: string;
  user?: string;
}
