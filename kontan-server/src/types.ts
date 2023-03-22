import { PubPacket } from 'pigeon-mqtt-nest';
import { RFIDPubTopic, RFIDSubTopic } from './services/RFIDService';

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
export type PubTopic = string | RFIDPubTopic;
export type SubTopic = string | RFIDSubTopic;
export interface MQTTPublishPacket<T extends PubTopic> extends PubPacket {
  topic: T;
}
