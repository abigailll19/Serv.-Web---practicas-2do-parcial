import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ResenaService } from './resena/resena.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly resenaService: ResenaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('resenas')
  async getAllResenas() {
    return this.resenaService.findAll();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'ms-resena',
      timestamp: new Date().toISOString(),
    };
  }
}
