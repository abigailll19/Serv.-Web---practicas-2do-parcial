import { Controller, Post, Body, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { v4 as uuidv4 } from 'uuid';

@Controller('resenas')
export class ResenaController {
  constructor(
    @Inject('RESENA_PUBLISHER') private readonly resenaClient: ClientProxy,
  ) {}

  @Post()
  async createResena(@Body() body: { autor: string; destino: string; mensaje: string; calificacion: number; usuario_id: string }) {
    const message_id = uuidv4();

    this.resenaClient.emit('resena.request', {
      message_id,
      data: body,
    });

    console.log(`📤 PUBLISHED resena.request - message_id: ${message_id}`);

    return { message: 'Resena request sent', message_id };
  }
}
