import { Controller, Post, Get, Body } from '@nestjs/common';
import { ResenaService } from './resena.service';

@Controller('resenas')
export class ResenaController {
  constructor(
    private readonly resenaService: ResenaService,
  ) {}

  @Post()
  async createResena(@Body() body: { autor: string; destino: string; mensaje: string; calificacion: number; usuario_id: string }) {
    const resena = await this.resenaService.createResena(body);
    return { 
      message: 'Reseña creada exitosamente',
      resena 
    };
  }

  @Get()
  async findAll() {
    return this.resenaService.findAll();
  }
}
