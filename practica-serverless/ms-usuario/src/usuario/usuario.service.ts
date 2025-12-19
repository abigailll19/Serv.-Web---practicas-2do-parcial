import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './usuario.entity';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private readonly repo: Repository<Usuario>,
  ) {}

  async create(data: any): Promise<Usuario> {
    const usuario = this.repo.create({
      nombre: data.nombre,
      correo: data.correo,
      tipo: data.tipo || 'estándar',
      idioma_preferido: data.idioma_preferido || 'es',
    });
    return await this.repo.save(usuario);
  }

  async findAll(): Promise<Usuario[]> {
    return await this.repo.find({
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Usuario> {
    return await this.repo.findOne({ where: { id } });
  }
}
