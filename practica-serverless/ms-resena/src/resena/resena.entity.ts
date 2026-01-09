import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('resenas')
export class Resena {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  usuario_id: number;

  @Column()
  destino: string;

  @Column()
  mensaje: string;

  @Column()
  calificacion: number;

  @Column({ default: 'PENDING' })
  status: string;

  @CreateDateColumn()
  created_at: Date;
}
