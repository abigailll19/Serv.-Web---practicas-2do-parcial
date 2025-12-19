import { NestFactory } from "@nestjs/core";
import {
  MicroserviceOptions,
  Transport,
} from "@nestjs/microservices";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar como microservicio RabbitMQ
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: ["amqp://guest:guest@localhost:5672"],
      queue: "usuario_queue",
      queueOptions: {
        durable: true,
      },
      noAck: false, // Habilitar ACK manual
    },
  });

  await app.startAllMicroservices();
  await app.listen(3001);

  console.log(
    "👤 ms-usuario corriendo en puerto 3001"
  );
  console.log(
    "📬 Escuchando cola: usuario_queue"
  );
}
bootstrap();
