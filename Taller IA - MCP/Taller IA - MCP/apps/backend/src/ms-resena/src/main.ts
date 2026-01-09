import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Servidor REST puro - Sin RabbitMQ
  await app.listen(process.env.PORT ?? 3004);
  console.log('ms-resena running on port 3004');
  console.log('👂 Listening to resena_queue...');
}
bootstrap();
