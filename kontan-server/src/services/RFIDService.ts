import { Injectable } from '@nestjs/common';
import { OfficeService } from './OfficeService';
import { UserService } from './UserService';

export type RFIDSubTopic = '/rfid/check';
export type RFIDPubTopic = '/rfid/inbound' | '/rfid/outbound' | '/rfid/unknown';
export type RFIDStatus = 'inbound' | 'outbound' | 'unknown';
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
}
