import { WebClient } from '@slack/web-api';
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.DEFAULT })
export class SlackClient extends WebClient {
  constructor() {
    super(process.env.SLACK_TOKEN);
  }
}
