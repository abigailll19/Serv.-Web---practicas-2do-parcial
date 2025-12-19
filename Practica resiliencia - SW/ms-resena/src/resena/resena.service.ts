import { Repository } from "typeorm";
import { Resena } from "./resena.entity";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class ResenaService {
    constructor(
      @InjectRepository(Resena)
      private readonly repo: Repository<Resena>
    ) {}

    async createResena(data) {
      // Verificar si ya existe una reseña idéntica del mismo usuario al mismo destino
      const existing = await this.repo.findOne({
        where: {
          usuario_id: data.usuario_id,
          destino: data.destino,
          autor: data.autor,
          mensaje: data.mensaje,
          calificacion: data.calificacion
        }
      });

      if (existing) {
        console.log(`⚠️ Reseña duplicada detectada (idempotencia de negocio): ${existing.id}`);
        return { resena: existing, isNew: false };
      }

      const resena = this.repo.create({
        autor: data.autor,
        destino: data.destino,
        mensaje: data.mensaje,
        calificacion: data.calificacion,
        usuario_id: data.usuario_id,
      });
      const saved = await this.repo.save(resena);
      return { resena: saved, isNew: true };
    }

    async findAll(): Promise<Resena[]> {
      return this.repo.find();
    }
}
