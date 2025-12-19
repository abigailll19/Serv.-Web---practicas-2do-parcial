import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ResenaController } from './resena.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'RESENA_PUBLISHER',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://guest:guest@localhost:5672'],
          queue: 'resena_queue',
          queueOptions: { durable: true },
        },
      },
    ]),
  ],
  controllers: [ResenaController],
})
export class ResenaModule {}
