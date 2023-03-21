import { validateSlackRequest } from '../../validateSlackRequest';
import { SlackEvent } from '../../types';
import { Response } from 'express';
import { Controller, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { SlackService } from './slack.service';

@Controller('slack')
export class SlackController {
  constructor(private readonly service: SlackService) {}

  @Post('/event')
  async event(
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<string | void> {
    if (!validateSlackRequest(request)) {
      response
        .status(HttpStatus.BAD_REQUEST)
        .send('Error: Signature mismatch security error');
      return;
    }

    const body = await request.json();

    const { challenge, event } = body satisfies {
      challenge: string;
      event: SlackEvent;
    };

    if (challenge) {
      // If slack pings this endpoint to verify it's valid
      return challenge;
    }

    if (event) {
      await this.service.handleEvent(event);
    }
  }

  @Post('/interactive')
  async interactive(
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<string | void> {
    if (!validateSlackRequest(request)) {
      response
        .status(HttpStatus.BAD_REQUEST)
        .send('Error: Signature mismatch security error');
      return;
    }

    const body = await request.json();

    const payload = JSON.parse(body.payload);

    await this.service.handleInteractive(payload);

    response.status(200).send('OK');
  }
}
