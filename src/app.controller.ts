import { Controller, Get, Render } from '@nestjs/common';
import { AppService } from './app.service';
import { isPublic } from 'decorator/auth.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @isPublic()
  @Get()
  @Render('index')
  root() {
    return { message: 'Hello world!' };
  }
}
