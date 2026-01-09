# Sistema de Gestión de Usuarios y Reseñas - Arquitectura de Microservicios

## Diagrama de Arquitectura

```mermaid
graph TB
    %% --- USUARIOS ---
    subgraph USERS ["👥 Usuarios"]
        U1["👤 Cliente HTTP"]
    end

    %% --- API GATEWAY ---
    subgraph GATEWAY ["🌐 ms-gateway :3000"]
        direction TB
        GW_USUARIO["UsuarioModule<br/>POST /usuarios"]
        GW_RESENA["ResenaModule<br/>POST /resenas"]
    end

    %% --- RABBITMQ ---
    subgraph RABBIT ["🐇 RabbitMQ :5672"]
        Q_USUARIO["📬 usuario_queue"]
        Q_RESENA["📬 resena_queue"]
        Q_WEBHOOK["📬 webhook_queue"]
        Q_DLQ["☠️ webhook_dlq<br/>(Dead Letter Queue)"]
    end

    %% --- MS RESENA ---
    subgraph MS_RESENA ["📝 ms-resena :3002"]
        direction TB
        RESENA_CTRL["ResenaController<br/>@EventPattern"]
        RESENA_SVC["ResenaService"]
        IDEMP_GUARD["IdempotencyGuard"]
        WH_CONSUMER["WebhookConsumer<br/>@EventPattern"]
        WH_PUBLISHER["WebhookPublisherService<br/>HMAC + Retry"]
    end

    %% --- MS USUARIO ---
    subgraph MS_USUARIO ["👤 ms-usuario :3001"]
        direction TB
        USU_CONSUMER["UsuarioConsumer<br/>@EventPattern"]
        USU_SVC["UsuarioService"]
        USU_CTRL["AppController<br/>GET /usuarios"]
    end

    %% --- SUPABASE EDGE FUNCTIONS ---
    subgraph SUPABASE ["☁️ Supabase Edge Functions"]
        direction TB
        EF_LOGGER["📊 webhook-event-logger<br/>Auditoría + Idempotencia"]
        EF_NOTIFIER["📱 webhook-external-notifier<br/>Telegram Bot"]
        SB_DB["💾 Supabase PostgreSQL<br/>webhook_events<br/>processed_webhooks"]
    end

    %% --- TELEGRAM ---
    subgraph TELEGRAM ["💬 Telegram"]
        TG_BOT["🤖 Bot Notificaciones"]
    end

    %% --- INFRAESTRUCTURA ---
    subgraph INFRA ["🏗️ Infraestructura"]
        REDIS["⚡ Redis :6379<br/>Cache Idempotencia"]
        DB_RESENA["💾 PostgreSQL :5433<br/>resena_db<br/>• resenas<br/>• idempotency_keys<br/>• webhook_subscriptions<br/>• webhook_events<br/>• webhook_deliveries"]
        DB_USUARIO["💾 PostgreSQL :5434<br/>usuario_db<br/>• usuarios"]
    end

    %% --- FLUJOS PRINCIPALES ---

    %% Usuario al Gateway
    U1 -->|"HTTP"| GATEWAY

    %% Gateway a RabbitMQ
    GW_USUARIO -->|"emit('usuario.create')"| Q_USUARIO
    GW_RESENA -->|"emit('resena.request')"| Q_RESENA

    %% RabbitMQ a Microservicios
    Q_RESENA -.->|"consume"| RESENA_CTRL
    Q_USUARIO -.->|"consume"| USU_CONSUMER

    %% Flujo interno MS Resena
    RESENA_CTRL --> IDEMP_GUARD
    IDEMP_GUARD -->|"SETNX"| REDIS
    IDEMP_GUARD --> RESENA_SVC
    RESENA_SVC -->|"INSERT"| DB_RESENA

    %% Flujo de Webhooks
    RESENA_SVC -->|"emit('webhook.publish')"| Q_WEBHOOK
    Q_WEBHOOK -.->|"consume"| WH_CONSUMER
    WH_CONSUMER --> WH_PUBLISHER
    WH_PUBLISHER -->|"INSERT webhook_events<br/>SELECT webhook_subscriptions<br/>INSERT webhook_deliveries"| DB_RESENA
    WH_PUBLISHER -->|"POST + HMAC-SHA256<br/>6 reintentos"| EF_LOGGER
    WH_PUBLISHER -->|"POST + HMAC-SHA256<br/>6 reintentos"| EF_NOTIFIER
    WH_PUBLISHER -.->|"Después de 6 fallos"| Q_DLQ

    %% Edge Functions
    EF_LOGGER -->|"Valida HMAC<br/>Guarda evento"| SB_DB
    EF_NOTIFIER -->|"Valida HMAC<br/>Verifica idempotencia"| SB_DB
    EF_NOTIFIER -->|"Envía mensaje"| TG_BOT

    %% Flujo interno MS Usuario
    USU_CONSUMER --> USU_SVC
    USU_SVC -->|"CRUD"| DB_USUARIO

    %% Usuario consulta usuarios
    U1 -->|"GET /usuarios"| USU_CTRL
    USU_CTRL --> USU_SVC

    %% --- ESTILOS ---
    classDef gateway fill:#e67e22,stroke:#d35400,stroke-width:2px,color:#fff
    classDef microservice fill:#3498db,stroke:#2980b9,stroke-width:2px,color:#fff
    classDef queue fill:#e74c3c,stroke:#c0392b,stroke-width:2px,color:#fff
    classDef db fill:#27ae60,stroke:#229954,stroke-width:2px,color:#fff
    classDef cache fill:#9b59b6,stroke:#8e44ad,stroke-width:2px,color:#fff
    classDef serverless fill:#16a085,stroke:#138d75,stroke-width:2px,color:#fff
    classDef external fill:#f39c12,stroke:#e67e22,stroke-width:2px,color:#fff

    class GATEWAY gateway
    class MS_RESENA,MS_USUARIO microservice
    class Q_USUARIO,Q_RESENA,Q_WEBHOOK,Q_DLQ queue
    class DB_RESENA,DB_USUARIO,SB_DB db
    class REDIS cache
    class SUPABASE,EF_LOGGER,EF_NOTIFIER serverless
    class TELEGRAM,TG_BOT external
```

## 🏗️ Arquitectura

Sistema de microservicios con arquitectura orientada a eventos que gestiona usuarios y reseñas con capacidades de webhooks serverless.

### Componentes

1. **ms-gateway** (Puerto 3000)

   - API Gateway que recibe peticiones HTTP
   - Publica eventos a RabbitMQ
   - Endpoints: `/usuarios`, `/resenas`

2. **ms-usuario** (Puerto 3001)

   - Gestiona operaciones de usuarios
   - Consume eventos de `usuario_queue`
   - Base de datos: `usuario_db`

3. **ms-resena** (Puerto 3002)

   - Gestiona operaciones de reseñas
   - Implementa idempotencia con Redis
   - Publica webhooks a Supabase Edge Functions
   - Base de datos: `resena_db`

4. **RabbitMQ** (Puerto 5672/15672)

   - Mensajería asíncrona
   - Dead Letter Queue para reintentos fallidos

5. **Redis** (Puerto 6379)

   - Cache para idempotencia

6. **Supabase Edge Functions**
   - `webhook-event-logger`: Auditoría
   - `webhook-external-notifier`: Notificaciones Telegram

## 🚀 Instalación

### Prerequisitos

- Node.js 18+
- Docker y Docker Compose
- Supabase CLI

### 1. Levantar infraestructura

```bash
docker-compose up -d
```

### 2. Inicializar bases de datos

```bash
# Conectar a PostgreSQL de reseñas
docker exec -it practica-serverless-postgres_resena-1 psql -U pguser -d resena_db

# Ejecutar schema SQL (ver supabase/setup.sql)
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
```

### 4. Configurar Supabase

```bash
cd supabase
supabase functions deploy webhook-event-logger
supabase functions deploy webhook-external-notifier
```

## ▶️ Ejecución

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

## 📡 API Endpoints

### Usuarios

```bash
# Crear usuario
POST http://localhost:3000/usuarios
{
  "nombre": "Juan Pérez",
  "correo": "juan@example.com",
  "tipo": "premium",
  "idioma_preferido": "es"
}

# Listar usuarios
GET http://localhost:3001/usuarios
```

### Reseñas

```bash
# Crear reseña
POST http://localhost:3000/resenas
{
  "usuario_id": 1,
  "destino": "Hotel Paradise",
  "mensaje": "Excelente servicio",
  "calificacion": 5
}

# Eventos generados:
# - resena.created
# - resena.low_rating (si calificación ≤ 2)
```

## 🔐 Seguridad

- Firma HMAC-SHA256 en todos los webhooks
- Validación de timestamps (máx. 5 minutos)
- Idempotencia con Redis

## 🔄 Resiliencia

- 6 reintentos con backoff exponencial
- Dead Letter Queue para eventos fallidos
- Duplicación evitada con idempotency keys

## 📊 Monitoreo

- RabbitMQ Management: http://localhost:15672 (guest/guest)
- PostgreSQL logs: `docker-compose logs -f`
- Redis: `docker exec -it practica-serverless-redis-1 redis-cli`

## 🧪 Testing

```bash
# Crear usuario
curl -X POST http://localhost:3000/usuarios \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test","correo":"test@mail.com"}'

# Crear reseña con calificación baja (dispara webhook)
curl -X POST http://localhost:3000/resenas \
  -H "Content-Type: application/json" \
  -d '{"usuario_id":1,"destino":"Hotel","mensaje":"Malo","calificacion":1}'
```

## 📝 Entidades

### Usuario

- `id`: UUID
- `nombre`: string
- `correo`: string (único)
- `tipo`: string ('estándar' | 'premium')
- `idioma_preferido`: string
- `activo`: boolean

### Reseña

- `id`: UUID
- `usuario_id`: número
- `destino`: string
- `mensaje`: string
- `calificacion`: número (1-5)
- `status`: string ('PENDING' | 'PROCESSED')
