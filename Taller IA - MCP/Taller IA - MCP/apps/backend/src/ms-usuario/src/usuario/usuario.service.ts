import { Repository } from "typeorm";
import { Usuario } from "./usuario.entity";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class UsuarioService {
    constructor(
      @InjectRepository(Usuario)
      private readonly repo: Repository<Usuario>
    ) {}

    async create(data: { nombre: string; correo: string; contrasena: string; tipo?: string; idiomaPreferido?: string }): Promise<{ usuario: Usuario; isNew: boolean }> {
      const existingUsuario = await this.repo.findOne({
        where: { correo: data.correo },
      });

      if (existingUsuario) {
        return { usuario: existingUsuario, isNew: false };
      }

      // Si no existe, crear nuevo
      const usuario = this.repo.create(data);
      const savedUsuario = await this.repo.save(usuario);
      return { usuario: savedUsuario, isNew: true };
    }

    async findAll(): Promise<Usuario[]> {
      return this.repo.find();
    }

    async findById(usuarioId: string): Promise<Usuario> {
      return this.repo.findOneBy({ id: usuarioId });
    }

    async findByCorreo(correo: string): Promise<Usuario | null> {
      return this.repo.findOne({ where: { correo } });
    }
}
