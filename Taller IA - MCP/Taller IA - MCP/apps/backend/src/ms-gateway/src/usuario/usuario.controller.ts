import { Controller, Post, Body, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { v4 as uuidv4 } from 'uuid';

@Controller('usuarios')
export class UsuarioController {
  constructor(
    @Inject('USUARIO_PUBLISHER') private readonly usuarioClient: ClientProxy,
  ) {}

  @Post()
  async createUsuario(@Body() body: { nombre: string; correo: string; contrasena: string; tipo?: string; idiomaPreferido?: string }) {
    const message_id = uuidv4();

    this.usuarioClient.emit('usuario.create', {
      message_id,
      data: body,
    });

    console.log(`👤 PUBLISHED usuario.create - message_id: ${message_id}`);

    return { message: 'Usuario creation request sent', message_id };
  }
}
