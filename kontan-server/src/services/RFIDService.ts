import { Injectable } from '@nestjs/common';
import { OfficeService } from './OfficeService';
import { UserService } from './UserService';

export type RFIDSubTopic = '/rfid/check';
export type RFIDPubTopic = '/rfid/inbound' | '/rfid/outbound' | '/rfid/unknown';
@Injectable()
export class RFIDService {
  constructor(
    private readonly userService: UserService,
    private readonly officeService: OfficeService,
  ) {}

  async CheckTag(tag: string): Promise<RFIDPubTopic> {
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
