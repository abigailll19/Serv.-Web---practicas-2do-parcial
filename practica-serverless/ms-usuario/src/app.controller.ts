import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { UsuarioService } from './usuario/usuario.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly usuarioService: UsuarioService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('usuarios')
  async getAllUsuarios() {
    return this.usuarioService.findAll();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'ms-usuario',
      timestamp: new Date().toISOString(),
    };
  }
}
