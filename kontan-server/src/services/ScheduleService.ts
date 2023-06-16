import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OfficeService } from './OfficeService';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(private readonly officeService: OfficeService) {}
  @Cron('*/10 * * * *')
  async handleCron() {
    this.logger.log('ScheduleService executed');
    await this.officeService.resetInbound();
    await this.officeService.incrementDays();
  }
}
