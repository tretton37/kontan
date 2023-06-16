import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OfficeService } from './OfficeService';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(private readonly officeService: OfficeService) {}
  @Cron('0 0 * * *')
  async handleCron() {
    await this.officeService.resetInbound();
    await this.officeService.incrementDays();
  }
}
