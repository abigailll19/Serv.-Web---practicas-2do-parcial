import { Controller, Inject, Get } from '@nestjs/common';
import {
  EventPattern,
  Payload,
  Ctx,
  RmqContext,
  ClientProxy,
} from '@nestjs/microservices';
import { IdempotencyGuard } from '../idempotency/idempotency.guard';
import { ResenaService } from './resena.service';

@Controller('resenas')
export class ResenaController {
  constructor(
    private readonly idempotencyGuard: IdempotencyGuard,
    private readonly resenaService: ResenaService,
    @Inject('USUARIO_SERVICE') private readonly client: ClientProxy,
  ) {}

  @Get()
  async getAllResenas() {
    return await this.resenaService.findAll();
  }

  @EventPattern('resena.request')
  async handle(@Payload() payload: any, @Ctx() context: RmqContext) {
    console.log('📥 Procesando resena.request...');
    console.log(`   Message ID: ${payload.message_id}`);
    
    const channel = context.getChannelRef();
    const msg = context.getMessage();

    await this.idempotencyGuard.run(payload.message_id, async () => {
      const result = await this.resenaService.createResena(payload.data);
      
      // Solo emitir evento si la reseña es nueva
      if (result.isNew) {
        this.client.emit('resena.created', {
          message_id: payload.message_id,
          data: payload.data
        });
        console.log('✅ Reseña CREADA y evento emitido a ms-usuario');
      } else {
        console.log('⚠️ Reseña duplicada - evento NO emitido (idempotencia de negocio)');
      }
    });

    channel.ack(msg);
  }
}
