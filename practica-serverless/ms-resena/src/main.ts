import { NestFactory } from "@nestjs/core";
import {
  MicroserviceOptions,
  Transport,
} from "@nestjs/microservices";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar como microservicio RabbitMQ para resena_queue
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: ["amqp://guest:guest@localhost:5672"],
      queue: "resena_queue",
      queueOptions: {
        durable: true,
      },
      noAck: false, // Habilitar ACK manual
    },
  });

  // Configurar como microservicio RabbitMQ para webhook_queue
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: ["amqp://guest:guest@localhost:5672"],
      queue: "webhook_queue",
      queueOptions: {
        durable: true,
      },
      noAck: false, // Habilitar ACK manual
    },
  });

  await app.startAllMicroservices();
  await app.listen(3002);

  console.log(
    "📝 ms-resena corriendo en puerto 3002"
  );
  console.log(
    "📬 Escuchando colas: resena_queue, webhook_queue"
  );
}
bootstrap();
