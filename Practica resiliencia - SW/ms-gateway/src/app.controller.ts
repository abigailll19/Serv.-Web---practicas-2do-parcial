import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('info')
  getInfo() {
    return {
      message: 'Para ver los datos, consulta directamente:',
      endpoints: {
        usuarios: 'http://localhost:3003/usuarios (ms-usuario)',
        resenas: 'http://localhost:3004/resenas (ms-resena)'
      }
    };
  }
}
