import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ResenaController } from './resena/resena.controller';
import { ResenaService } from './resena/resena.service';
import { Resena } from './resena/resena.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: '../../data/resena.db',
      entities: [Resena],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Resena]),
  ],
  controllers: [AppController, ResenaController],
  providers: [AppService, ResenaService],
})
export class AppModule {}
