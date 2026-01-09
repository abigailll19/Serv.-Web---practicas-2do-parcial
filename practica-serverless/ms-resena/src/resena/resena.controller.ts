import { Controller, Inject } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext, ClientProxy } from '@nestjs/microservices';
import { v4 as uuidv4 } from 'uuid';
import { IdempotencyGuard } from '../idempotency/idempotency.guard';
import { ResenaService } from './resena.service';
import { ResenaCreatedEvent } from '../events/resena-created.event';

@Controller('resenas')
export class ResenaController {
  constructor(
    private readonly idempotencyGuard: IdempotencyGuard,
    private readonly resenaService: ResenaService,
    @Inject('WEBHOOK_PUBLISHER') private readonly webhookClient: ClientProxy,
  ) {}

  @EventPattern('resena.request')
  async handle(@Payload() payload: any, @Ctx() context: RmqContext) {
    console.log('📥 Procesando resena.request...');
    console.log('   Message ID:', payload.message_id);

    const channel = context.getChannelRef();
    const msg = context.getMessage();

    await this.idempotencyGuard.run(payload.message_id, async () => {
      // 1. Crear reseña en BD
      const resena = await this.resenaService.createResena(payload.data);

      console.log('✅ Reseña creada:', resena.id);

      // 2. Determinar tipo de evento según calificación
      const eventType = payload.data.calificacion <= 2 ? 'resena.low_rating' : 'resena.created';

      // 3. Crear y emitir evento webhook
      const webhookEvent: ResenaCreatedEvent = {
        event_id: uuidv4(),
        event_type: eventType,
        timestamp: new Date().toISOString(),
        idempotency_key: payload.message_id,
        payload: {
          resena_id: resena.id,
          usuario_id: resena.usuario_id,
          destino: resena.destino,
          mensaje: resena.mensaje,
          calificacion: resena.calificacion,
          created_at: resena.created_at.toISOString(),
        },
      };

      this.webhookClient.emit('webhook.publish', webhookEvent);

      console.log(`📤 Evento webhook emitido: ${eventType} - ${webhookEvent.event_id}`);
    });

    channel.ack(msg);
  }
}
