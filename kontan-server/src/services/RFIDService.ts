import { Injectable } from '@nestjs/common';
import { OfficeService } from './OfficeService';
import { UserService } from './UserService';

export type RFIDSubTopic = '/rfid/check';
export type RFIDPubTopic = '/rfid/inbound' | '/rfid/outbound' | '/rfid/unknown';
export type RFIDStatus = 'inbound' | 'outbound' | 'unknown';

const presenceMessages = {
  inbound: [
    'Good morning {username}!',
    'Hello {username}!',
    'Hello {username}, how are you?',
    'Hi {username}, nice to see you!',
    "Yo {username}, we're happy to see you!",
    'Top of the morning to you, {username}!',
    "Meh, it's just {username}...",
  ],
  outbound: [
    "Don't leave us, {username}!",
    'Have a nice evening {username}.',
    'Goodbye {username}, see you soon.',
    'See you soon, {username}.',
    'Noooo! Why {username}, whyyy!?',
  ],
  unknown: ['Hm', 'Not sure what to say'],
};

@Injectable()
export class RFIDService {
  constructor(
    private readonly userService: UserService,
    private readonly officeService: OfficeService,
  ) {}

  async CheckTag(tag: string): Promise<RFIDStatus> {
    if (!(await this.userService.tagExists(tag))) {
      return 'unknown';
    }
    const { status } = await this.officeService.checkUser(tag);
    return status.toLowerCase() as RFIDStatus;
  }

  GetPresenceMessage(status: RFIDStatus, username: string): string {
    const messages = presenceMessages[status];
    const messageIndex = Math.floor(Math.random() * messages.length);
    return messages[messageIndex].replace('{username}', username);
  }
}
