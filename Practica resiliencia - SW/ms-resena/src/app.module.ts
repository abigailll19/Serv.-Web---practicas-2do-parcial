import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ResenaController } from './resena/resena.controller';
import { ResenaService } from './resena/resena.service';
import { Resena } from './resena/resena.entity';
import { IdempotencyGuard } from './idempotency/idempotency.guard';
import { IdempotencyService } from './idempotency/idempotency.service';
import { Idempotency } from './idempotency/idempotency.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5436,
      username: 'pguser',
      password: 'pgpass',
      database: 'resena_db',
      entities: [Resena, Idempotency],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Resena, Idempotency]),
    ClientsModule.register([
      {
        name: 'USUARIO_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://guest:guest@localhost:5672'],
          queue: 'usuario_queue',
          queueOptions: { durable: true },
        },
      },
    ]),
  ],
  controllers: [AppController, ResenaController],
  providers: [AppService, ResenaService, IdempotencyGuard, IdempotencyService],
})
export class AppModule {}
