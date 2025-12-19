# Guía de Instalación y Configuración

## 📋 Prerequisitos

- Node.js 18+
- Docker y Docker Compose
- PostgreSQL Client (opcional, para acceso directo a BD)
- Supabase CLI: `npm install -g supabase`

## 🚀 Instalación Paso a Paso

### 1. Levantar infraestructura

```bash
cd practica-serverless
docker-compose up -d
```

Esto iniciará:

- RabbitMQ (puertos 5672, 15672)
- PostgreSQL Usuario (puerto 5434)
- PostgreSQL Reseña (puerto 5433)
- Redis (puerto 6379)

### 2. Inicializar base de datos de reseñas

```bash
# Conectar a PostgreSQL
docker exec -it practica-serverless-postgres_resena-1 psql -U pguser -d resena_db

# En el prompt de PostgreSQL, ejecutar:
\i /path/to/supabase/setup.sql
# O copiar y pegar el contenido del archivo setup.sql

# Verificar tablas creadas:
\dt

# Salir:
\q
```

### 3. Instalar dependencias de microservicios

```bash
# Gateway
cd ms-gateway
npm install

# Usuario
cd ../ms-usuario
npm install

# Reseña
cd ../ms-resena
npm install
cd ..
```

### 4. Configurar Supabase (Opcional pero recomendado)

#### Opción A: Supabase Cloud

```bash
# Login
supabase login

# Crear proyecto en https://app.supabase.com

# Link proyecto
cd supabase
supabase link --project-ref TU_PROJECT_ID

# Deploy funciones
supabase functions deploy webhook-event-logger
supabase functions deploy webhook-external-notifier

# Configurar secrets
supabase secrets set WEBHOOK_SECRET=9f3c1a4e8b7d6a21c5f0e4a99d1b2c88e6a7d3f9a1c2b4e8f7a6d5c4b3a2
supabase secrets set TELEGRAM_BOT_TOKEN=tu-token-aqui
supabase secrets set TELEGRAM_CHAT_ID=tu-chat-id-aqui

# Ejecutar setup.sql en Supabase SQL Editor
# Copiar contenido de supabase/setup.sql
# Reemplazar lsckojdsitlkqzbugdfe con tu PROJECT_ID real
```

#### Opción B: Supabase Local

```bash
cd supabase
supabase start

# Servir funciones en desarrollo
# Terminal 1:
supabase functions serve webhook-event-logger

# Terminal 2:
supabase functions serve webhook-external-notifier
```

### 5. Configurar ms-resena .env

```bash
cd ms-resena

# Editar .env
WEBHOOK_SECRET=9f3c1a4e8b7d6a21c5f0e4a99d1b2c88e6a7d3f9a1c2b4e8f7a6d5c4b3a2
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9peW1jaGJva3Zoam9nZHdycm1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTIyMzUsImV4cCI6MjA4MTQyODIzNX0.Rphgc_nmA69F1hiI0BdXURqK8wYXUgNUPYLVTU0l76k
```

### 6. Actualizar URLs de webhooks

Editar `supabase/setup.sql` líneas de INSERT:

```sql
-- Reemplazar lsckojdsitlkqzbugdfe con tu PROJECT_ID
INSERT INTO webhook_subscriptions (url, event_type, secret) VALUES
('https://TU_PROJECT_ID.supabase.co/functions/v1/webhook-event-logger', ...),
...
```

## ▶️ Ejecución

### Desarrollo - 3 Terminales

```bash
# Terminal 1 - Gateway
cd ms-gateway
npm run start:dev

# Terminal 2 - Usuario
cd ms-usuario
npm run start:dev

# Terminal 3 - Reseña
cd ms-resena
npm run start:dev
```

### Producción

```bash
# Cada microservicio
npm run build
npm run start:prod
```

## 🧪 Testing

### Test 1: Crear usuario

```bash
curl -X POST http://localhost:3000/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "María García",
    "correo": "maria@example.com",
    "tipo": "premium",
    "idioma_preferido": "es"
  }'
```

**Resultado esperado:**

- ✅ Mensaje en ms-gateway
- ✅ Mensaje procesado en ms-usuario
- ✅ Usuario guardado en PostgreSQL

### Test 2: Crear reseña con buena calificación

```bash
curl -X POST http://localhost:3000/resenas \
  -H "Content-Type: application/json" \
  -d '{
    "usuario_id": 1,
    "destino": "Hotel Paradise",
    "mensaje": "Servicio excelente, muy recomendable",
    "calificacion": 5
  }'
```

**Resultado esperado:**

- ✅ Evento `resena.created`
- ✅ Webhook enviado a Supabase
- ✅ Notificación a Telegram (si está configurado)

### Test 3: Crear reseña con baja calificación

```bash
curl -X POST http://localhost:3000/resenas \
  -H "Content-Type: application/json" \
  -d '{
    "usuario_id": 1,
    "destino": "Hotel Malo",
    "mensaje": "Pésimo servicio, no lo recomiendo",
    "calificacion": 1
  }'
```

**Resultado esperado:**

- ✅ Evento `resena.low_rating`
- ✅ Webhook enviado a Supabase
- ✅ **Alerta** enviada a Telegram

### Test 4: Consultar datos

```bash
# Listar usuarios
curl http://localhost:3001/usuarios

# Listar reseñas
curl http://localhost:3002/resenas

# Health checks
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
```

## 🔍 Monitoreo

### RabbitMQ Management

```
http://localhost:15672
Usuario: guest
Contraseña: guest
```

### PostgreSQL

```bash
# Base de datos de usuarios
docker exec -it practica-serverless-postgres_usuario-1 psql -U pguser -d usuario_db

# Base de datos de reseñas
docker exec -it practica-serverless-postgres_resena-1 psql -U pguser -d resena_db
```

### Redis

```bash
# Conectar a Redis
docker exec -it practica-serverless-redis-1 redis-cli

# Ver claves de idempotencia
KEYS idempotency:*

# Ver valor de una clave
GET idempotency:tu-message-id
```

### Logs

```bash
# Docker logs
docker-compose logs -f

# Logs de microservicio específico
cd ms-resena
npm run start:dev  # Los logs aparecen en la terminal
```

## 🐛 Troubleshooting

### Error: Cannot connect to RabbitMQ

```bash
# Verificar que RabbitMQ esté corriendo
docker ps | grep rabbitmq

# Reiniciar RabbitMQ
docker-compose restart rabbitmq
```

### Error: Cannot connect to PostgreSQL

```bash
# Verificar contenedores
docker ps | grep postgres

# Ver logs
docker logs practica-serverless-postgres_resena-1
```

### Error: Redis connection failed

```bash
# Verificar Redis
docker ps | grep redis

# Reiniciar Redis
docker-compose restart redis
```

### Webhook no llega a Supabase

```bash
# Verificar suscripciones en PostgreSQL
docker exec -it practica-serverless-postgres_resena-1 psql -U pguser -d resena_db
SELECT * FROM webhook_subscriptions WHERE active = true;

# Verificar eventos
SELECT * FROM webhook_events ORDER BY created_at DESC LIMIT 10;

# Verificar deliveries fallidos
SELECT * FROM webhook_deliveries WHERE status = 'failed' ORDER BY created_at DESC;
```

## 🔄 Resetear todo

```bash
# Detener todo
docker-compose down -v

# Limpiar node_modules (opcional)
rm -rf ms-gateway/node_modules
rm -rf ms-usuario/node_modules
rm -rf ms-resena/node_modules

# Volver a empezar desde el paso 1
```

## 📚 Recursos Adicionales

- [Documentación de NestJS](https://docs.nestjs.com)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/tutorials)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Redis Commands](https://redis.io/commands)
