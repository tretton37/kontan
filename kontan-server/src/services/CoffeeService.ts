import { Injectable } from '@nestjs/common';
import { SlackService } from '../routes/slack/slack.service';
import { OfficeService } from './OfficeService';

@Injectable()
export class CoffeeService {
  constructor(
    private readonly client: SlackService,
    private readonly office: OfficeService,
  ) {}

  private brew_message(cups: number) {
    return (
      cups +
      ` freshly brewed cup${
        cups === 1 ? '' : 's'
      } of :coffee: now available in the kitchen!`
    );
  }

  async handleBrewEvent(cups: number) {
    const inbound = await this.office.whoIsInbound('Helsingborg');
    await Promise.all(
      inbound.map(async (user) => {
        if (user.status === 'INBOUND') {
          await this.client.scheduleBotHomeMessage(
            user.slackUserId,
            this.brew_message(cups),
            5,
          );
        }
      }),
    );
  }
}
