import { Repository } from 'typeorm';
import { Resena } from './resena.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ResenaService {
  constructor(
    @InjectRepository(Resena)
    private readonly repo: Repository<Resena>,
  ) {}

  async createResena(data: any): Promise<Resena> {
    const resena = this.repo.create({
      usuario_id: data.usuario_id,
      destino: data.destino,
      mensaje: data.mensaje,
      calificacion: data.calificacion,
    });
    return await this.repo.save(resena);
  }

  async findAll(): Promise<Resena[]> {
    return await this.repo.find({
      order: { created_at: 'DESC' },
    });
  }
}
