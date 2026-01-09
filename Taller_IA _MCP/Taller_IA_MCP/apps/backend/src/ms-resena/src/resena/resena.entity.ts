import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('resena')
export class Resena {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  autor: string;

  @Column()
  destino: string;

  @Column()
  mensaje: string;

  @Column({ default: 5 })
  calificacion: number;

  @CreateDateColumn({ type: 'datetime' })
  fecha: Date;

  @Column()
  usuario_id: string;
}
