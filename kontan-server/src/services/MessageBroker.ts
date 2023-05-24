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
import { CoffeeService } from './CoffeeService';
import { UserService } from './UserService';
import { Event, NotifyService } from './NotifyService';

@Injectable()
export class MessageBroker {
  constructor(
    @Inject(PigeonService) private readonly pigeonService: PigeonService,
    private readonly RFIDService: RFIDService,
    private readonly coffeeService: CoffeeService,
    private readonly userService: UserService,
    private readonly notifyService: NotifyService,
  ) {}

  @onPublish()
  async OnPublish(@Packet() packet: PubPacket, @Payload() payload: string) {
    let pubPackets: PubPacket[];
    switch (packet?.topic as SubTopic) {
      case '/rfid/check':
        pubPackets = await this.RfidCheck(payload.replace(':', ''));
        break;
      case '/coffee/brew':
        await this.Brew(Number(payload));
        break;
      case '/eventnotify': {
        await this.EventNotify(payload);
        break;
      }
      default:
    }

    if (!!pubPackets?.length) {
      await this.PublishPackets(pubPackets);
    }
  }

  async EventNotify(payload: string) {
    await this.notifyService.handleEvent(payload as Event);
  }

  async RfidCheck(
    tag: string,
  ): Promise<MQTTPublishPacket<RFIDPubTopic | string>[]> {
    const status = await this.RFIDService.CheckTag(tag);
    const user = await this.userService.getUserByTag(tag);
    return [
      new PubPacketBuilder({
        topic: `/rfid/${status}`,
        payload: tag,
      }),
      new PubPacketBuilder({
        topic: '/ttv',
        payload: this.RFIDService.GetPresenceMessage(
          status,
          user?.name ?? 'whats-your-face',
        ),
      }),
    ];
  }

  async Brew(cups: number): Promise<void> {
    await this.coffeeService.handleBrewEvent(cups);
  }

  async PublishPackets<T extends PubTopic>(
    packets: Array<MQTTPublishPacket<T>>,
  ) {
    await Promise.all(
      packets.map(async (packet) => await this.pigeonService.publish(packet)),
    );
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
