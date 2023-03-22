import { Inject, Injectable } from '@nestjs/common';
import {
  onPublish,
  Packet,
  Payload,
  PigeonService,
  PubPacket,
} from 'pigeon-mqtt-nest';
import { MQTTPublishPacket, PubTopic, SubTopic } from '../types';
import { RFIDPubTopic, RFIDService } from './RFIDService';

@Injectable()
export class MessageBroker {
  constructor(
    @Inject(PigeonService) private readonly pigeonService: PigeonService,
    private readonly RFIDService: RFIDService,
  ) {}

  @onPublish()
  async OnPublish(@Packet() packet: PubPacket, @Payload() payload: string) {
    let pubPacket: PubPacket;
    switch (packet?.topic as SubTopic) {
      case '/rfid/check':
        pubPacket = await this.RfidCheck(payload.replace(':', ''));
        break;
      default:
    }

    if (pubPacket) {
      await this.pigeonService.publish(pubPacket);
    }
  }

  async RfidCheck(tag: string): Promise<MQTTPublishPacket<RFIDPubTopic>> {
    const topic = await this.RFIDService.CheckTag(tag);
    return new PubPacketBuilder({
      topic,
      payload: tag,
    });
  }
}

class PubPacketBuilder<T extends PubTopic> implements MQTTPublishPacket<T> {
  cmd: 'publish';
  qos: 0 | 1 | 2;
  payload: string | Buffer;
  topic: T;
  dup = false;
  retain = false;
  constructor(props: Partial<MQTTPublishPacket<T>>) {
    this.qos = 0;
    this.topic = props.topic;
    this.payload = props.payload ?? '';
  }
}
