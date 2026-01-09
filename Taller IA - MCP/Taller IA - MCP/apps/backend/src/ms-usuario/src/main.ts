import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Servidor REST puro - Sin RabbitMQ
  await app.listen(process.env.PORT ?? 3003);
  console.log('ms-usuario running on port 3003');
  console.log('👂 Listening to usuario_queue...');
}
bootstrap();
