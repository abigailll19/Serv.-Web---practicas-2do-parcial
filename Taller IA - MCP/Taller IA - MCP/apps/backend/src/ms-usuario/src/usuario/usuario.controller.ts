import { Controller, Get, Post, Body, Query, NotFoundException } from '@nestjs/common';
import { UsuarioService } from './usuario.service';

@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Post()
  async crear(@Body() body: { nombre: string; correo: string; contrasena: string; tipo?: string; idiomaPreferido?: string }) {
    const result = await this.usuarioService.create(body);
    
    if (result.isNew) {
      return { 
        message: 'Usuario creado exitosamente',
        usuario: result.usuario 
      };
    } else {
      return { 
        message: 'Usuario ya existía (idempotencia)',
        usuario: result.usuario 
      };
    }
  }

  @Get('buscar')
  async buscarPorCorreo(@Query('correo') correo: string) {
    if (!correo) {
      throw new NotFoundException('El parámetro correo es requerido');
    }

    const usuario = await this.usuarioService.findByCorreo(correo);
    
    if (!usuario) {
      throw new NotFoundException(`Usuario con correo ${correo} no encontrado`);
    }

    return usuario;
  }

  @Get()
  async findAll() {
    return this.usuarioService.findAll();
  }
}
