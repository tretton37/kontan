import { SlackEvent } from '../../types';
import {
  Body,
  Controller,
  HttpStatus,
  Post,
  Req,
  Res,
  Headers,
  RawBodyRequest,
} from '@nestjs/common';
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
    } & Body,
    @Headers() headers,
    @Req() request: RawBodyRequest<Request>,
    @Res() response: Response,
  ): Promise<string | void> {
    const { challenge, event } = body;

    if (challenge) {
      response.send(challenge);
      return challenge;
    }
    if (!this.service.validateSlackRequest(request, request.rawBody, headers)) {
      response
        .status(HttpStatus.BAD_REQUEST)
        .send('Error: Signature mismatch security error');
      return;
    }

    if (event) {
      await this.service.handleEvent(event);
    }

    response.send();
  }

  @Post('/interactive')
  async interactive(
    @Body() body: any,
    @Headers() headers,
    @Req() request: RawBodyRequest<Request>,
    @Res() response: Response,
  ): Promise<string | void> {
    if (!this.service.validateSlackRequest(request, request.rawBody, headers)) {
      response
        .status(HttpStatus.BAD_REQUEST)
        .send('Error: Signature mismatch security error');
      return;
    }

    const payload = JSON.parse(body.payload);

    await this.service.handleInteractive(payload);
    response.send();
  }
}
