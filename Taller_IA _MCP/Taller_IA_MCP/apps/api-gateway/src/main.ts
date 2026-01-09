import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Habilitar CORS
  
  const PORT = process.env.PORT || 3002;
  await app.listen(PORT);
  
  console.log('🤖 API Gateway + Gemini corriendo en puerto', PORT);
  console.log('   POST http://localhost:' + PORT + '/chat - Enviar mensaje a Gemini');
  console.log('   Gemini API Key:', process.env.GEMINI_API_KEY ? '✅ Configurada' : '❌ NO configurada');
}
bootstrap();
