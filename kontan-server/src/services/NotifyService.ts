import { Injectable } from '@nestjs/common';
import { SlackService } from '../routes/slack/slack.service';
import { OfficeService } from './OfficeService';

export type Event = 'FIKA' | 'LUNCH' | 'BREAKFAST';

const eventMessageMap: Record<Event, string> = {
  FIKA: "It's FIKA TIME :cake:",
  LUNCH: 'LUNCH in the kitchen RIGHT NOW! :rice:',
  BREAKFAST: 'Breakfast time folks! :bread:',
};

@Injectable()
export class NotifyService {
  constructor(
    private readonly slackService: SlackService,
    private readonly officeService: OfficeService,
  ) {}

  async handleEvent(event: Event) {
    const inbound = await this.officeService.whoIsInbound('Helsingborg');
    await Promise.all(
      inbound.map(async (user) => {
        if (user.status === 'INBOUND') {
          await this.slackService.sendBotHomeMessage(
            user.slackUserId,
            eventMessageMap[event],
          );
        }
      }),
    );
  }
}
