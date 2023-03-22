import { Inject, Injectable } from '@nestjs/common';
import {
  onPublish,
  Packet,
  Payload,
  PigeonService,
  PubPacket,
} from 'pigeon-mqtt-nest';
import { UserService } from './UserService';
import { OfficeService } from './OfficeService';

type SubTopic = '/rfid/check';
type PubTopic = '/rfid/inbound' | '/rfid/outbound' | '/rfid/unknown';
@Injectable()
export class MessageBroker {
  constructor(
    @Inject(PigeonService) private readonly pigeonService: PigeonService,
    private readonly userService: UserService,
    private readonly officeService: OfficeService,
  ) {}

  @onPublish()
  async OnPublish(@Packet() packet: PubPacket, @Payload() payload: string) {
    if (packet.topic.startsWith('$')) {
      return;
    }
    let topic: PubTopic;
    switch (packet.topic as SubTopic) {
      case '/rfid/check':
        topic = await this.RfidCheck(payload);
        break;
      default:
    }
    if (topic) {
      await this.pigeonService.publish({
        topic,
        qos: 0,
        cmd: 'publish',
        payload: '',
        dup: false,
        retain: false,
      });
    }
  }

  async RfidCheck(tag: string): Promise<PubTopic> {
    if (!(await this.userService.tagExists(tag))) {
      return '/rfid/unknown';
    }
    const { status } = await this.officeService.checkUser(tag);
    if (status === 'OUTBOUND') {
      return '/rfid/outbound';
    } else if (status === 'INBOUND') {
      return '/rfid/inbound';
    }
  }
}
