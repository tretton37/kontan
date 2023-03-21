import { Module } from '@nestjs/common';
import { RfidController } from './routes/rfid/rfid.controller';
import { SlackController } from './routes/slack/slack.controller';
import { UserService } from './services/UserService';
import { SlackService } from './routes/slack/slack.service';
import { OfficeService } from './services/OfficeService';
import { Admin } from './services/Admin';
import { SlackClient } from './services/SlackClient';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [RfidController, SlackController],
  providers: [UserService, SlackService, OfficeService, Admin, SlackClient],
})
export class AppModule {}
