import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ unique: true })
  correo: string;

  @Column()
  contrasena: string;

  @Column({ default: 'turista' })
  tipo: string;

  @Column({ default: 'es' })
  idiomaPreferido: string;
}
