import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { User, UserService } from '../../services/UserService';
import { Response } from 'express';
import { OfficeService } from '../../services/OfficeService';

@Controller('rfid')
export class RfidController {
  constructor(
    private readonly userService: UserService,
    private readonly officeService: OfficeService,
  ) {}

  @Post('/check')
  async check(
    @Body('tag') tag: User['tag'],
    @Res() res: Response,
  ): Promise<void> {
    if (!(await this.userService.tagExists(tag))) {
      res.status(HttpStatus.NOT_FOUND).send("User doesn't exist");
      return;
    }
    const { status } = await this.officeService.checkUser(tag);
    if (status === 'OUTBOUND') {
      res.status(HttpStatus.CONFLICT).send('User checked out');
    } else if (status === 'INBOUND') {
      res.status(HttpStatus.CREATED).send('User checked in');
    }
  }
}
