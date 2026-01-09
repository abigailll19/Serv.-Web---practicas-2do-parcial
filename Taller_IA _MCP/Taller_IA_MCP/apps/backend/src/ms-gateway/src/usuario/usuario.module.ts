import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UsuarioController } from './usuario.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'USUARIO_PUBLISHER',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://guest:guest@localhost:5672'],
          queue: 'usuario_queue',
          queueOptions: { durable: true },
        },
      },
    ]),
  ],
  controllers: [UsuarioController],
})
export class UsuarioModule {}
