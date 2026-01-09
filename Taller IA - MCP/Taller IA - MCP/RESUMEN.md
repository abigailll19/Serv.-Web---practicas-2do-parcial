# Resumen del Proyecto - Práctica Resiliencia Usuario-Reseña

## 📊 Resumen Ejecutivo

Este proyecto implementa una arquitectura de microservicios para gestionar **usuarios** y **reseñas** basado en las entidades del proyecto Django "Manta Travel - Guía Turístico". La implementación utiliza NestJS, RabbitMQ, PostgreSQL y patrones de resiliencia para garantizar procesamiento confiable de mensajes.

## 🎯 Objetivos Cumplidos

✅ **Migración de entidades Django a TypeScript/NestJS**
- Usuario: Nombre, correo, contraseña, tipo, idioma preferido
- Reseña: Autor, destino, mensaje, calificación, usuario_id

✅ **Arquitectura de Microservicios**
- 3 microservicios independientes (gateway, usuario, reseña)
- Comunicación asíncrona vía RabbitMQ
- Base de datos independiente por servicio

✅ **Patrones de Resiliencia**
- Idempotencia en procesamiento de mensajes
- ACK manual para garantizar procesamiento
- Colas duraderas en RabbitMQ
- Verificación de duplicados a nivel de negocio

## 🏗️ Arquitectura Implementada

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │ HTTP
       ▼
┌─────────────────┐
│   ms-gateway    │ (Puerto 3000)
│  API Gateway    │
└────────┬────────┘
         │ RabbitMQ Events
         ├────────────────┬────────────────┐
         ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ ms-usuario   │  │  ms-resena   │  │  RabbitMQ    │
│ (Puerto 3003)│  │ (Puerto 3004)│  │ (Puerto 5672)│
└──────┬───────┘  └──────┬───────┘  └──────────────┘
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ usuario_db   │  │  resena_db   │
│ (Puerto 5435)│  │ (Puerto 5436)│
└──────────────┘  └──────────────┘
```

## 📦 Componentes del Sistema

### 1. ms-gateway (API Gateway)
**Responsabilidad:** Recibir peticiones HTTP y distribuirlas a los microservicios

**Endpoints:**
- `POST /usuarios` → Envía evento `usuario.create` a RabbitMQ
- `POST /resenas` → Envía evento `resena.request` a RabbitMQ

**Características:**
- Genera UUID único para cada mensaje (idempotencia)
- No tiene base de datos propia
- Solo envía eventos, no espera respuestas síncronas

### 2. ms-usuario
**Responsabilidad:** Gestionar usuarios del sistema

**Base de Datos:** `usuario_db` (PostgreSQL Puerto 5435)

**Eventos que consume:**
- `usuario.create`: Crea nuevos usuarios

**Eventos que emite:**
- Ninguno (futuro: podría emitir `usuario.created`)

**Entidad:**
```typescript
Usuario {
  id: UUID
  nombre: string
  correo: string (único)
  contrasena: string
  tipo: string
  idiomaPreferido: string
}
```

**Características:**
- Verifica duplicados por correo electrónico
- Idempotencia a nivel de negocio
- Escucha notificaciones de reseñas creadas

### 3. ms-resena
**Responsabilidad:** Gestionar reseñas con patrón de idempotencia

**Base de Datos:** `resena_db` (PostgreSQL Puerto 5436)

**Eventos que consume:**
- `resena.request`: Crea nuevas reseñas

**Eventos que emite:**
- `resena.created`: Notifica a ms-usuario de nueva reseña

**Entidades:**
```typescript
Resena {
  id: UUID
  autor: string
  destino: string
  mensaje: string
  calificacion: number
  fecha: timestamp
  usuario_id: UUID
}

Idempotency {
  message_id: UUID (PK)
  consumer: string
  processed_at: timestamp
}
```

**Características:**
- **Idempotencia:** Tabla dedicada para rastrear mensajes procesados
- **IdempotencyGuard:** Verifica message_id antes de procesar
- **ACK Manual:** Solo confirma mensajes después de procesamiento exitoso

## 🔄 Flujos de Negocio

### Flujo 1: Creación de Usuario

```
1. Cliente → POST /usuarios (ms-gateway)
2. ms-gateway → genera UUID y emite evento usuario.create
3. RabbitMQ → enruta a usuario_queue
4. ms-usuario → consume evento
5. ms-usuario → verifica si correo existe
6. ms-usuario → crea usuario en BD (si no existe)
7. ms-usuario → envía ACK a RabbitMQ
```

### Flujo 2: Creación de Reseña

```
1. Cliente → POST /resenas (ms-gateway)
2. ms-gateway → genera UUID y emite evento resena.request
3. RabbitMQ → enruta a resena_queue
4. ms-resena → consume evento
5. ms-resena → verifica idempotencia (message_id)
6. ms-resena → crea reseña en BD
7. ms-resena → emite evento resena.created
8. ms-resena → envía ACK a RabbitMQ
9. RabbitMQ → enruta resena.created a usuario_queue
10. ms-usuario → consume y registra la reseña
```

## 🛡️ Patrones de Resiliencia Detallados

### 1. Idempotencia con Tabla Dedicada

**Implementación en ms-resena:**

```typescript
// Antes de procesar mensaje
const canProcess = await idempotencyService.tryRegister(message_id);

if (!canProcess) {
  console.log('Mensaje duplicado ignorado');
  return; // No procesar
}

// Procesar mensaje solo si es nuevo
await createResena(data);
```

**Beneficios:**
- Evita duplicados incluso si el mensaje se reenvía
- Funciona en clústeres (varios consumidores)
- Rastrea cuándo se procesó cada mensaje

### 2. ACK Manual (No Auto-ACK)

**Configuración:**
```typescript
{
  noAck: false, // ACK manual activado
}
```

**Implementación:**
```typescript
// Solo ACK después de procesamiento exitoso
await procesarMensaje(payload);
channel.ack(msg); // Confirmar procesamiento
```

**Beneficios:**
- Mensajes no se pierden si el servicio falla
- RabbitMQ reenvía mensajes no confirmados
- Mayor confiabilidad en procesamiento

### 3. Colas Duraderas

**Configuración:**
```typescript
{
  queueOptions: { 
    durable: true // Cola persiste en disco
  }
}
```

**Beneficios:**
- Mensajes sobreviven reinicios de RabbitMQ
- No se pierden datos durante mantenimiento
- Mayor disponibilidad del sistema

### 4. Verificación de Duplicados de Negocio

**Implementación en ms-usuario:**
```typescript
// Verificar si usuario ya existe por correo
const existing = await repo.findOne({ where: { correo } });
if (existing) {
  return { usuario: existing, isNew: false };
}
```

**Beneficios:**
- Idempotencia a nivel de lógica de negocio
- Compatible con reglas del dominio
- No depende solo de infraestructura

## 📈 Ventajas de la Arquitectura

### Escalabilidad
- Cada microservicio escala independientemente
- Agregar más consumidores es trivial
- RabbitMQ distribuye carga automáticamente

### Mantenibilidad
- Código separado por contexto de negocio
- Cambios en usuario no afectan reseña
- Tests unitarios por microservicio

### Resiliencia
- Fallos en un servicio no afectan otros
- Mensajes no se pierden
- Reintentos automáticos

### Observabilidad
- Logs descriptivos con emojis
- Rastreo de message_id en toda la cadena
- Facilita debugging

## 🧪 Casos de Prueba Sugeridos

### Prueba 1: Creación Normal
1. Crear usuario
2. Verificar en logs que se procesó
3. Crear reseña con ese usuario_id
4. Verificar que ambos servicios procesaron correctamente

### Prueba 2: Idempotencia
1. Modificar gateway para usar mismo message_id
2. Enviar reseña 2 veces
3. Verificar que solo se crea una reseña
4. Verificar log: "[IDEMP] Mensaje duplicado ignorado"

### Prueba 3: Resiliencia ante Fallos
1. Enviar solicitud de reseña
2. Apagar ms-resena inmediatamente
3. Mensaje queda en cola
4. Iniciar ms-resena
5. Verificar que procesa el mensaje pendiente

### Prueba 4: Verificación de Duplicados
1. Crear usuario con correo específico
2. Intentar crear otro usuario con mismo correo
3. Verificar que retorna el existente
4. Verificar log: "Usuario YA EXISTÍA (idempotencia aplicada)"

## 📚 Tecnologías Utilizadas

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Node.js | 18+ | Runtime JavaScript |
| NestJS | 11.x | Framework backend |
| TypeScript | 5.7 | Lenguaje tipado |
| TypeORM | 0.3.x | ORM para PostgreSQL |
| PostgreSQL | 17 | Base de datos |
| RabbitMQ | 3.11 | Message broker |
| Docker | Latest | Contenedores |
| Redis | 7 | Cache (futuro uso) |

## 🔮 Mejoras Futuras

### Corto Plazo
- [ ] Agregar validaciones con class-validator
- [ ] Implementar manejo de errores global
- [ ] Agregar logs estructurados (Winston)
- [ ] Implementar health checks

### Mediano Plazo
- [ ] Agregar autenticación JWT
- [ ] Implementar circuit breaker
- [ ] Agregar rate limiting
- [ ] Implementar cache con Redis

### Largo Plazo
- [ ] Agregar tracing distribuido (OpenTelemetry)
- [ ] Implementar CQRS
- [ ] Agregar Event Sourcing
- [ ] Dashboard de monitoreo

## 📞 Soporte

Para problemas o dudas:
1. Revisar logs de cada microservicio
2. Verificar estado de RabbitMQ en http://localhost:15672
3. Consultar INSTALLATION.md para troubleshooting
4. Revisar docker-compose logs

## 📄 Licencia

Proyecto académico - Universidad [Nombre]
Curso: Servidores Web / Sistemas Distribuidos

---

**Creado:** Diciembre 2024
**Basado en:** Entidades Usuario y Reseña del proyecto "Manta Travel - Guía Turístico"
