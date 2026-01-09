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
      const resena = this.repo.create({
        autor: data.autor,
        destino: data.destino,
        mensaje: data.mensaje,
        calificacion: data.calificacion,
        usuario_id: data.usuario_id,
      });
      return await this.repo.save(resena);
    }

    async findAll(): Promise<Resena[]> {
      return this.repo.find();
    }
}
