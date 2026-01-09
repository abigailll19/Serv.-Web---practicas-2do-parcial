import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Gateway de Usuarios y Reseñas - Arquitectura Microservicios';
  }
}
