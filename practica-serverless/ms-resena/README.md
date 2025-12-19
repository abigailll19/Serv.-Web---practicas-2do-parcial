# ms-resena

Microservicio de gestión de reseñas con webhooks serverless.

## Puerto
3002

## Base de datos
- PostgreSQL: puerto 5433
- Database: `resena_db`

## Características

- ✅ Idempotencia con Redis
- ✅ Webhooks con reintentos exponenciales
- ✅ HMAC-SHA256 para seguridad
- ✅ Dead Letter Queue (DLQ)
- ✅ Integración con Supabase Edge Functions

## Endpoints

### GET /resenas
Lista todas las reseñas.

### GET /health
Health check del servicio.

## Colas RabbitMQ
- Escucha: `resena_queue`, `webhook_queue`
- Eventos: `resena.request`, `webhook.publish`

## Eventos de Webhook

### resena.created
Se dispara al crear una reseña con calificación ≥ 3.

### resena.low_rating
Se dispara al crear una reseña con calificación ≤ 2.

## Instalación

```bash
npm install

# Configurar variables de entorno
# Editar .env con tu WEBHOOK_SECRET

npm run start:dev
```

## Entidad Reseña

```typescript
{
  id: string (UUID)
  usuario_id: number
  destino: string
  mensaje: string
  calificacion: number (1-5)
  status: string ('PENDING' | 'PROCESSED')
  created_at: Date
}
```

## Sistema de Webhooks

1. **Guardar evento** en `webhook_events`
2. **Buscar suscriptores** activos
3. **Enviar POST** con HMAC-SHA256
4. **Reintentos** con backoff exponencial (6 intentos)
5. **DLQ** si falla después de 6 intentos
