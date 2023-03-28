import { SlackEvent } from '../../types';
import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { SlackService } from './slack.service';
import { Response } from 'express';
@Controller('slack')
export class SlackController {
  constructor(private readonly service: SlackService) {}

  @Post('/event')
  async event(
    @Body()
    body: {
      challenge: string;
      event: SlackEvent;
    },
    @Res() response: Response,
  ): Promise<string | void> {
    /*if (!this.service.validateSlackRequest(request)) {
      response
        .status(HttpStatus.BAD_REQUEST)
        .send('Error: Signature mismatch security error');
      return;
    }*/

    const { challenge, event } = body;

    if (challenge) {
      response.send(challenge);
      return challenge;
    }

    if (event) {
      await this.service.handleEvent(event);
    }

    response.send();
  }

  @Post('/interactive')
  async interactive(
    @Body() body: any,
    @Res() response: Response,
  ): Promise<string | void> {
    /*if (!this.service.validateSlackRequest(request)) {
      response
        .status(HttpStatus.BAD_REQUEST)
        .send('Error: Signature mismatch security error');
      return;
    }*/

    const payload = JSON.parse(body.payload);

    await this.service.handleInteractive(payload);
    response.send();
  }
}
