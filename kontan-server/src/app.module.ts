import { Module } from '@nestjs/common';
import { SlackController } from './routes/slack/slack.controller';
import { UserService } from './services/UserService';
import { SlackService } from './routes/slack/slack.service';
import { OfficeService } from './services/OfficeService';
import { Admin } from './services/Admin';
import { SlackClient } from './services/SlackClient';
import { ConfigModule } from '@nestjs/config';
import { PigeonModule, PigeonModuleOptions } from 'pigeon-mqtt-nest';
import { MessageBroker } from './services/MessageBroker';
import { RFIDService } from './services/RFIDService';

const pigeonModuleOptions = {
  port: 1883, // Port MQTT TCP Server
  id: 'kontan-mqtt',
  concurrency: 100,
  queueLimit: 42,
  maxClientsIdLength: 23,
  connectTimeout: 30000,
  heartbeatInterval: 60000,
} satisfies PigeonModuleOptions;

@Module({
  imports: [ConfigModule.forRoot(), PigeonModule.forRoot(pigeonModuleOptions)],
  controllers: [SlackController],
  providers: [
    UserService,
    SlackService,
    OfficeService,
    Admin,
    SlackClient,
    MessageBroker,
    RFIDService,
  ],
})
export class AppModule {}
