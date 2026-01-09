import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ResenaService } from './resena/resena.service';
import { ResenaController } from './resena/resena.controller';
import { Resena } from './resena/resena.entity';
import { IdempotencyGuard } from './idempotency/idempotency.guard';
import { RedisService } from './redis/redis.service';
import { WebhookModule } from './webhook/webhook.module';
import { WebhookSubscription } from './webhook/entities/webhook-subscription.entity';
import { WebhookDelivery } from './webhook/entities/webhook-delivery.entity';
import { WebhookEventEntity } from './webhook/entities/webhook-event.entity';

@Module({
  imports: [
    // Cargar variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5433,
      username: 'pguser',
      password: 'pgpass',
      database: 'resena_db',
      entities: [Resena, WebhookSubscription, WebhookDelivery, WebhookEventEntity],
      synchronize: false,
      logging: true,
    }),

    // Entidades para repositorios
    TypeOrmModule.forFeature([Resena]),

    // Clientes RabbitMQ
    ClientsModule.register([
      {
        name: 'WEBHOOK_PUBLISHER',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://guest:guest@localhost:5672'],
          queue: 'webhook_queue',
          queueOptions: { durable: true },
        },
      },
    ]),

    // Módulo de webhooks
    WebhookModule,
  ],
  controllers: [AppController, ResenaController],
  providers: [AppService, ResenaService, IdempotencyGuard, RedisService],
})
export class AppModule {}
