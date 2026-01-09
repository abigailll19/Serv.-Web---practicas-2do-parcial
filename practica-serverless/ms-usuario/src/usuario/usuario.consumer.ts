import { Controller } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { UsuarioService } from './usuario.service';

@Controller()
export class UsuarioConsumer {
  constructor(private readonly usuarioService: UsuarioService) {}

  @EventPattern('usuario.create')
  async handleUsuarioCreate(@Payload() data: any, @Ctx() context: RmqContext) {
    console.log('📥 Evento recibido: usuario.create');
    console.log('   Message ID:', data.message_id);
    console.log('   Data:', data.data);

    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      const usuario = await this.usuarioService.create(data.data);
      console.log('✅ Usuario creado:', usuario.id);
      
      channel.ack(originalMsg);
    } catch (error) {
      console.error('❌ Error al crear usuario:', error.message);
      channel.nack(originalMsg, false, true);
    }
  }
}
