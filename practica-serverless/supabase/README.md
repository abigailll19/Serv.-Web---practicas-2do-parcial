# Supabase Edge Functions

Sistema de webhooks serverless para el procesamiento de eventos.

## Funciones

### webhook-event-logger

**Propósito:** Auditoría de eventos

**Características:**

- Valida firma HMAC-SHA256
- Verifica timestamp (max 5 min)
- Guarda eventos en BD
- Previene duplicados

**URL:** `https://[PROJECT_ID].supabase.co/functions/v1/webhook-event-logger`

### webhook-external-notifier

**Propósito:** Notificaciones a Telegram

**Características:**

- Valida firma HMAC-SHA256
- Idempotencia con `processed_webhooks`
- Envía notificaciones a Telegram
- Formatos específicos por evento

**URL:** `https://[PROJECT_ID].supabase.co/functions/v1/webhook-external-notifier`

## Configuración

### Variables de entorno (Supabase Secrets)

```bash
# Ambas funciones
WEBHOOK_SECRET=9f3c1a4e8b7d6a21c5f0e4a99d1b2c88e6a7d3f9a1c2b4e8f7a6d5c4b3a2

# Solo webhook-external-notifier
TELEGRAM_BOT_TOKEN=tu-token-de-bot
TELEGRAM_CHAT_ID=tu-chat-id
```

## Deployment

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link proyecto
supabase link --project-ref [PROJECT_ID]

# Deploy ambas funciones
supabase functions deploy webhook-event-logger
supabase functions deploy webhook-external-notifier

# Configurar secrets
supabase secrets set WEBHOOK_SECRET=9f3c1a4e8b7d6a21c5f0e4a99d1b2c88e6a7d3f9a1c2b4e8f7a6d5c4b3a2
supabase secrets set TELEGRAM_BOT_TOKEN=tu-token
supabase secrets set TELEGRAM_CHAT_ID=tu-chat-id
```

## Testing Local

```bash
# Iniciar Supabase local
supabase start

# Servir funciones
supabase functions serve webhook-event-logger
supabase functions serve webhook-external-notifier
```

## Formato de eventos

### resena.created

```json
{
  "event_id": "uuid",
  "event_type": "resena.created",
  "timestamp": "2025-12-15T10:30:00Z",
  "payload": {
    "resena_id": "uuid",
    "usuario_id": 1,
    "destino": "Hotel Paradise",
    "mensaje": "Excelente",
    "calificacion": 5,
    "created_at": "2025-12-15T10:30:00Z"
  }
}
```

### resena.low_rating

```json
{
  "event_id": "uuid",
  "event_type": "resena.low_rating",
  "timestamp": "2025-12-15T10:30:00Z",
  "payload": {
    "resena_id": "uuid",
    "usuario_id": 1,
    "destino": "Hotel Malo",
    "mensaje": "Pésimo servicio",
    "calificacion": 1,
    "created_at": "2025-12-15T10:30:00Z"
  }
}
```
