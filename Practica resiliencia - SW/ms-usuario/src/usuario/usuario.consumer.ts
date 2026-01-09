import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { UsuarioService } from './usuario.service';
import { IdempotencyGuard } from '../idempotency/idempotency.guard';

@Controller()
export class UsuarioConsumer {
  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly idempotencyGuard: IdempotencyGuard,
  ) {}

  // Listener para CREAR usuarios
  @EventPattern('usuario.create')
  async handleUsuarioCreate(
    @Payload() payload: { message_id: string; data: { nombre: string; correo: string; contrasena: string; tipo?: string; idiomaPreferido?: string } },
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      console.log('📥 usuario.create recibido');
      console.log(`   Message ID: ${payload.message_id}`);
      console.log(`   Nombre: ${payload.data.nombre}, Correo: ${payload.data.correo}`);
      
      // Aplicar idempotencia técnica
      await this.idempotencyGuard.run(payload.message_id, async () => {
        const result = await this.usuarioService.create(payload.data);
        
        if (result.isNew) {
          console.log(`✅ Usuario CREADO: ${result.usuario.id}`);
        } else {
          console.log(`⚠️ Usuario YA EXISTÍA: ${result.usuario.id} (idempotencia de negocio)`);
        }
      });
      
      channel.ack(originalMsg);
    } catch (error) {
      console.error('❌ Error creando usuario:', error.message);
      channel.ack(originalMsg);
    }
  }

  // Listener para cuando se crea una reseña (desde ms-resena)
  @EventPattern('resena.created')
  async handleResenaCreated(
    @Payload() payload: { message_id: string; data: { usuario_id: string; destino: string; calificacion: number } },
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      console.log('📥 resena.created recibido');
      console.log(`   Message ID: ${payload.message_id}`);
      console.log(`   Usuario ID: ${payload.data.usuario_id}`);
      console.log(`   Destino: ${payload.data.destino}, Calificación: ${payload.data.calificacion}★`);
      
      // Aplicar idempotencia para evitar procesar el mismo evento múltiples veces
      await this.idempotencyGuard.run(payload.message_id, async () => {
        const usuario = await this.usuarioService.findById(payload.data.usuario_id);
        
        if (usuario) {
          console.log(`✅ Usuario ${usuario.nombre} ha creado una reseña`);
        } else {
          console.log('⚠️ Usuario no encontrado');
        }
      });
      
      channel.ack(originalMsg);
    } catch (error) {
      console.error('❌ Error procesando reseña:', error.message);
      channel.ack(originalMsg);
    }
  }
}
