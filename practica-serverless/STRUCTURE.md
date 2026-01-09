# Estructura del Proyecto practica-serverless

```
practica-serverless/
│
├── 📄 README.md                    # Documentación principal con diagrama
├── 📄 INSTALLATION.md              # Guía de instalación paso a paso
├── 🐳 docker-compose.yml           # Infraestructura (RabbitMQ, PostgreSQL, Redis)
│
├── 🌐 ms-gateway/                  # API Gateway (Puerto 3000)
│   ├── src/
│   │   ├── main.ts                 # Entrada principal
│   │   ├── app.module.ts
│   │   ├── usuario/
│   │   │   ├── usuario.module.ts
│   │   │   └── usuario.controller.ts    # POST /usuarios
│   │   └── resena/
│   │       ├── resena.module.ts
│   │       └── resena.controller.ts     # POST /resenas
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── 👤 ms-usuario/                  # Microservicio Usuarios (Puerto 3001)
│   ├── src/
│   │   ├── main.ts                 # Entrada + RabbitMQ consumer
│   │   ├── app.module.ts           # TypeORM + PostgreSQL:5434
│   │   ├── app.controller.ts       # GET /usuarios
│   │   └── usuario/
│   │       ├── usuario.entity.ts   # Entity Usuario
│   │       ├── usuario.service.ts
│   │       └── usuario.consumer.ts # @EventPattern('usuario.create')
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── 📝 ms-resena/                   # Microservicio Reseñas (Puerto 3002)
│   ├── src/
│   │   ├── main.ts                 # Entrada + 2 RabbitMQ consumers
│   │   ├── app.module.ts           # TypeORM + PostgreSQL:5433 + Redis
│   │   ├── app.controller.ts       # GET /resenas
│   │   ├── resena/
│   │   │   ├── resena.entity.ts    # Entity Reseña
│   │   │   ├── resena.service.ts
│   │   │   └── resena.controller.ts # @EventPattern('resena.request')
│   │   ├── idempotency/
│   │   │   └── idempotency.guard.ts # Control de duplicados
│   │   ├── redis/
│   │   │   └── redis.service.ts     # Cliente Redis (SETNX)
│   │   ├── webhook/
│   │   │   ├── webhook.module.ts
│   │   │   ├── webhook.consumer.ts  # @EventPattern('webhook.publish')
│   │   │   ├── webhook.publisher.service.ts  # HMAC + Reintentos + DLQ
│   │   │   └── entities/
│   │   │       ├── webhook-subscription.entity.ts
│   │   │       ├── webhook-delivery.entity.ts
│   │   │       └── webhook-event.entity.ts
│   │   └── events/
│   │       ├── resena-created.event.ts
│   │       └── webhook-event.interface.ts
│   ├── .env                        # WEBHOOK_SECRET
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
└── ☁️ supabase/                    # Supabase Edge Functions
    ├── setup.sql                   # Schema + Suscripciones
    ├── config.toml
    ├── README.md
    └── functions/
        ├── import_map.json
        ├── webhook-event-logger/   # Auditoría
        │   ├── index.ts            # Valida HMAC + Guarda en BD
        │   └── deno.json
        └── webhook-external-notifier/  # Notificaciones
            ├── index.ts            # Valida HMAC + Telegram Bot
            └── deno.json
```

## 🔄 Flujo de Datos

### Flujo de creación de usuario:

```
Cliente HTTP
    ↓ POST /usuarios
ms-gateway
    ↓ emit('usuario.create') → usuario_queue
ms-usuario
    ↓ consume mensaje
PostgreSQL (usuario_db)
```

### Flujo de creación de reseña con webhooks:

```
Cliente HTTP
    ↓ POST /resenas
ms-gateway
    ↓ emit('resena.request') → resena_queue
ms-resena (ResenaController)
    ↓ IdempotencyGuard (Redis SETNX)
    ↓ Guardar en PostgreSQL (resena_db)
    ↓ emit('webhook.publish') → webhook_queue
ms-resena (WebhookConsumer)
    ↓ WebhookPublisherService
    ├─→ Guardar en webhook_events
    ├─→ Buscar webhook_subscriptions activas
    └─→ Para cada suscripción:
        ├─→ POST HTTP + HMAC-SHA256
        │   ├── Header: X-Signature
        │   ├── Header: X-Timestamp
        │   └── Header: X-Event-Id
        ├─→ Guardar en webhook_deliveries
        └─→ Si falla:
            ├─→ Reintentar con backoff (hasta 6 veces)
            └─→ Si 6 fallos → webhook_dlq

Supabase Edge Function (webhook-event-logger)
    ├─→ Validar HMAC
    ├─→ Validar timestamp
    ├─→ Verificar duplicados
    └─→ Guardar en webhook_events

Supabase Edge Function (webhook-external-notifier)
    ├─→ Validar HMAC
    ├─→ Verificar processed_webhooks
    ├─→ Construir mensaje
    ├─→ Enviar a Telegram Bot
    └─→ Marcar como procesado
```

## 🎯 Puntos Clave

### Entidades de Negocio

- **Usuario**: Adaptado de webhook-serverless
- **Reseña**: Adaptado de webhook-serverless

### Arquitectura

- **Microservicios**: De practicaweb-resiliencia
- **RabbitMQ**: De practicaweb-resiliencia
- **Redis**: De practicaweb-resiliencia
- **Webhooks**: De practicaweb-resiliencia
- **Supabase**: De ambos proyectos

### Eventos

- `usuario.create` → Crea usuario en BD
- `resena.request` → Crea reseña + dispara webhook
- `resena.created` → Calificación ≥ 3
- `resena.low_rating` → Calificación ≤ 2

## 📊 Bases de Datos

### usuario_db (Puerto 5434)

```sql
usuarios (
  id UUID PRIMARY KEY,
  nombre TEXT,
  correo TEXT UNIQUE,
  tipo TEXT,
  idioma_preferido TEXT,
  activo BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### resena_db (Puerto 5433)

```sql
resenas (
  id UUID PRIMARY KEY,
  usuario_id INTEGER,
  destino TEXT,
  mensaje TEXT,
  calificacion INTEGER,
  status TEXT,
  created_at TIMESTAMPTZ
)

webhook_subscriptions (...)
webhook_events (...)
webhook_deliveries (...)
```

### Supabase PostgreSQL

```sql
webhook_events (...)
processed_webhooks (...)
```

## 🔐 Seguridad

- **HMAC-SHA256**: Firma todos los webhooks
- **Timestamp validation**: Máximo 5 minutos
- **Idempotencia**: Redis + processed_webhooks
- **Reintentos**: Backoff exponencial
- **DLQ**: Para eventos no entregables

## 🚀 Puertos

| Servicio            | Puerto | Descripción          |
| ------------------- | ------ | -------------------- |
| ms-gateway          | 3000   | API Gateway HTTP     |
| ms-usuario          | 3001   | Microservicio + HTTP |
| ms-resena           | 3002   | Microservicio + HTTP |
| RabbitMQ            | 5672   | AMQP                 |
| RabbitMQ Management | 15672  | Web UI               |
| PostgreSQL Usuario  | 5434   | Base de datos        |
| PostgreSQL Reseña   | 5433   | Base de datos        |
| Redis               | 6379   | Cache                |
