import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { UsuarioService } from './usuario.service';

@Controller()
export class UsuarioConsumer {
  constructor(private readonly usuarioService: UsuarioService) {}

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
      
      // Crear con verificación de idempotencia
      const result = await this.usuarioService.create(payload.data);
      
      if (result.isNew) {
        console.log(`✅ Usuario CREADO: ${result.usuario.id}`);
      } else {
        console.log(`⚠️ Usuario YA EXISTÍA: ${result.usuario.id} (idempotencia aplicada)`);
      }
      
      channel.ack(originalMsg);
    } catch (error) {
      console.error('❌ Error creando usuario:', error.message);
      channel.ack(originalMsg);
    }
  }

  // Listener para cuando se crea una reseña (desde ms-resena)
  @EventPattern('resena.created')
  async handleResenaCreated(
    @Payload() data: { usuario_id: string; destino: string; calificacion: number },
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      console.log('📥 resena.created recibido');
      console.log(`   Usuario ID: ${data.usuario_id}`);
      console.log(`   Destino: ${data.destino}, Calificación: ${data.calificacion}★`);
      
      const usuario = await this.usuarioService.findById(data.usuario_id);
      
      if (usuario) {
        console.log(`✅ Usuario ${usuario.nombre} ha creado una reseña`);
      } else {
        console.log('⚠️ Usuario no encontrado');
      }
      
      channel.ack(originalMsg);
    } catch (error) {
      console.error('❌ Error procesando reseña:', error.message);
      channel.ack(originalMsg);
    }
  }
}
