# Práctica Resiliencia - Usuario y Reseña

Proyecto de microservicios con NestJS que implementa patrones de resiliencia para la gestión de usuarios y reseñas, basado en las entidades del proyecto Django.

## 🏗️ Arquitectura

Este proyecto implementa una arquitectura de microservicios con comunicación asíncrona:

- **ms-gateway** (Puerto 3000): API Gateway para recibir peticiones HTTP y enviarlas a los microservicios vía RabbitMQ
- **ms-usuario** (Puerto 3003): Microservicio para gestionar usuarios
- **ms-resena** (Puerto 3004): Microservicio para gestionar reseñas con patrón de idempotencia
- **RabbitMQ**: Sistema de mensajería asíncrona para comunicación entre microservicios
- **PostgreSQL**: Base de datos independiente para cada microservicio (usuario_db y resena_db)
- **Redis**: Cache y gestión de estados

## 📋 Requisitos

- Node.js 18+
- Docker y Docker Compose
- npm o yarn

## 🚀 Instalación

### 1. Levantar la infraestructura (RabbitMQ, PostgreSQL, Redis)

```bash
docker-compose up -d
```

Verificar que los contenedores estén corriendo:
```bash
docker-compose ps
```

Acceder a RabbitMQ Management Console:
- URL: http://localhost:15672
- Usuario: guest
- Contraseña: guest

### 2. Instalar dependencias de cada microservicio

**ms-usuario:**
```bash
cd ms-usuario
npm install
```

**ms-resena:**
```bash
cd ms-resena
npm install
```

**ms-gateway:**
```bash
cd ms-gateway
npm install
```

## ▶️ Ejecución

Abrir 3 terminales diferentes y ejecutar cada microservicio:

**Terminal 1 - Gateway:**
```bash
cd ms-gateway
npm run start:dev
```

**Terminal 2 - Usuario:**
```bash
cd ms-usuario
npm run start:dev
```

**Terminal 3 - Reseña:**
```bash
cd ms-resena
npm run start:dev
```

## 🔌 Endpoints API

### ms-gateway (Puerto 3000)

#### Crear Usuario
```http
POST http://localhost:3000/usuarios
Content-Type: application/json

{
  "nombre": "Juan Pérez",
  "correo": "juan@example.com",
  "contrasena": "password123",
  "tipo": "turista",
  "idiomaPreferido": "es"
}
```

#### Crear Reseña
```http
POST http://localhost:3000/resenas
Content-Type: application/json

{
  "autor": "Juan Pérez",
  "destino": "Playa de Manta",
  "mensaje": "Excelente lugar para visitar!",
  "calificacion": 5,
  "usuario_id": "UUID-del-usuario"
}
```

## 📡 Eventos RabbitMQ

El sistema utiliza los siguientes eventos para comunicación asíncrona entre microservicios:

### Eventos de Usuario
- **`usuario.create`**: El gateway envía este evento para crear un nuevo usuario
  - Cola: `usuario_queue`
  - Consumidor: ms-usuario

### Eventos de Reseña
- **`resena.request`**: El gateway envía este evento para crear una nueva reseña
  - Cola: `resena_queue`
  - Consumidor: ms-resena (con idempotencia)
  
- **`resena.created`**: ms-resena notifica a ms-usuario cuando se crea una reseña
  - Cola: `usuario_queue`
  - Consumidor: ms-usuario

## 🛡️ Patrones de Resiliencia Implementados

### ✅ Idempotencia
- Implementado en **ms-resena** mediante tabla `idempotency`
- Evita procesamiento duplicado de mensajes con el mismo `message_id`
- Cada mensaje lleva un UUID único generado por el gateway

### ✅ Confirmación Manual (ACK)
- Todos los consumidores usan `noAck: false`
- Los mensajes solo se eliminan de la cola tras procesamiento exitoso
- Si un microservicio falla, el mensaje permanece en la cola

### ✅ Colas Duraderas
- Todas las colas tienen `durable: true`
- Los mensajes persisten en disco incluso si RabbitMQ se reinicia

### ✅ Verificación de Duplicados
- ms-usuario verifica correos únicos antes de crear usuarios
- Retorna el usuario existente si ya existe (idempotencia a nivel de negocio)

### ✅ Separación de Bases de Datos
- Cada microservicio tiene su propia base de datos PostgreSQL
- No hay dependencias directas entre bases de datos
- Comunicación solo a través de eventos

## 🗄️ Estructura de Base de Datos

### usuario_db (Puerto 5435)
```sql
CREATE TABLE usuario (
  id UUID PRIMARY KEY,
  nombre VARCHAR(255),
  correo VARCHAR(255) UNIQUE,
  contrasena VARCHAR(255),
  tipo VARCHAR(50) DEFAULT 'turista',
  idiomaPreferido VARCHAR(10) DEFAULT 'es'
);
```

### resena_db (Puerto 5436)
```sql
CREATE TABLE resena (
  id UUID PRIMARY KEY,
  autor VARCHAR(200),
  destino VARCHAR(300),
  mensaje TEXT,
  calificacion INTEGER DEFAULT 5,
  fecha TIMESTAMPTZ DEFAULT NOW(),
  usuario_id UUID
);

CREATE TABLE idempotency (
  message_id UUID PRIMARY KEY,
  consumer VARCHAR(255),
  processed_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🧪 Pruebas de Resiliencia

### Probar Idempotencia
1. Enviar el mismo mensaje 2 veces con el mismo `message_id`
2. Verificar que solo se crea una reseña
3. En logs verás: `[IDEMP] Mensaje duplicado ignorado: {message_id}`

### Probar Recuperación ante Fallos
1. Enviar una solicitud de creación de reseña
2. Apagar ms-resena antes de que procese
3. Los mensajes quedan en la cola
4. Al reiniciar ms-resena, procesa los mensajes pendientes

### Probar Comunicación Asíncrona
1. Crear un usuario
2. Observar logs de ms-usuario confirmando la creación
3. Crear una reseña para ese usuario
4. Observar cómo ms-resena procesa y notifica a ms-usuario

## 📝 Logs del Sistema

Los microservicios emiten logs descriptivos con emojis para facilitar el seguimiento:

- 📥 Mensaje recibido
- ✅ Operación exitosa
- ⚠️ Advertencia (idempotencia aplicada, duplicado, etc.)
- ❌ Error

## 🛑 Detener el Sistema

```bash
# Detener microservicios: Ctrl+C en cada terminal

# Detener infraestructura
docker-compose down

# Detener y eliminar volúmenes (limpia las bases de datos)
docker-compose down -v
```

## 📦 Estructura del Proyecto

```
Practica resiliencia - Servidores web/
├── docker-compose.yml
├── README.md
├── ms-gateway/
│   ├── src/
│   │   ├── app.controller.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── package.json
├── ms-usuario/
│   ├── src/
│   │   ├── usuario/
│   │   │   ├── usuario.entity.ts
│   │   │   ├── usuario.service.ts
│   │   │   └── usuario.consumer.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── package.json
└── ms-resena/
    ├── src/
    │   ├── resena/
    │   │   ├── resena.entity.ts
    │   │   ├── resena.service.ts
    │   │   └── resena.controller.ts
    │   ├── idempotency/
    │   │   ├── idempotency.entity.ts
    │   │   ├── idempotency.service.ts
    │   │   └── idempotency.guard.ts
    │   ├── app.module.ts
    │   └── main.ts
    └── package.json
```

## 🔍 Solución de Problemas

### RabbitMQ no conecta
- Verificar que Docker esté corriendo: `docker ps`
- Verificar logs: `docker-compose logs rabbitmq`
- Puerto 5672 debe estar libre

### PostgreSQL no conecta
- Verificar puertos 5435 y 5436 estén libres
- Revisar credenciales en app.module.ts de cada microservicio

### Módulos no encontrados
- Ejecutar `npm install` en cada microservicio
- Verificar versión de Node.js: `node --version` (debe ser 18+)

## 📚 Conceptos Implementados

Este proyecto demuestra:

1. **Microservicios**: Arquitectura distribuida con servicios independientes
2. **Event-Driven Architecture**: Comunicación basada en eventos
3. **Message Queue**: RabbitMQ para mensajería asíncrona
4. **Idempotencia**: Procesamiento seguro de mensajes duplicados
5. **Database per Service**: Cada microservicio con su BD independiente
6. **API Gateway**: Punto de entrada único para clientes externos
7. **TypeORM**: ORM para Node.js con TypeScript
8. **NestJS**: Framework Node.js con arquitectura modular

## 👥 Basado en

Entidades Usuario y Reseña del proyecto Django "Manta Travel - Guía Turístico"
