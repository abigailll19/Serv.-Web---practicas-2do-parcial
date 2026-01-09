# 🔄 Comparación: practicaweb-resiliencia vs practica-serverless

## 📊 Tabla Comparativa Detallada

| Aspecto                 | practicaweb-resiliencia | practica-serverless               |
| ----------------------- | ----------------------- | --------------------------------- |
| **Dominio de Negocio**  | Adopción de animales    | Usuarios y reseñas                |
| **Entidad Principal 1** | Animal                  | Usuario                           |
| **Entidad Principal 2** | Adoption                | Reseña                            |
| **ms-gateway**          | ✅ Puerto 3000          | ✅ Puerto 3000                    |
| **ms-1 (lectura)**      | ms-animal :3001         | ms-usuario :3001                  |
| **ms-2 (escritura)**    | ms-adoption :3002       | ms-resena :3002                   |
| **RabbitMQ**            | ✅ 5672/15672           | ✅ 5672/15672                     |
| **Redis**               | ✅ 6379                 | ✅ 6379                           |
| **PostgreSQL 1**        | animal_db :5434         | usuario_db :5434                  |
| **PostgreSQL 2**        | adoption_db :5433       | resena_db :5433                   |
| **Idempotencia**        | ✅ Redis SETNX          | ✅ Redis SETNX                    |
| **Webhooks**            | ✅ HMAC + Reintentos    | ✅ HMAC + Reintentos              |
| **DLQ**                 | ✅ webhook_dlq          | ✅ webhook_dlq                    |
| **Edge Functions**      | 2 (logger, notifier)    | 2 (logger, notifier)              |
| **Eventos Webhook**     | adoption.completed      | resena.created, resena.low_rating |
| **Notificaciones**      | Telegram (adopciones)   | Telegram (reseñas bajas)          |

---

## 🎯 Mapeo de Componentes

### Microservicios

| practicaweb-resiliencia | →   | practica-serverless |
| ----------------------- | --- | ------------------- |
| ms-gateway              | →   | ms-gateway          |
| ms-animal               | →   | ms-usuario          |
| ms-adoption             | →   | ms-resena           |

### Entidades

| practicaweb-resiliencia | →   | practica-serverless        |
| ----------------------- | --- | -------------------------- |
| Animal                  | →   | Usuario                    |
| ├─ id (UUID)            | →   | ├─ id (UUID)               |
| ├─ name                 | →   | ├─ nombre                  |
| ├─ species              | →   | ├─ correo (único)          |
| └─ available            | →   | ├─ tipo (estándar/premium) |
|                         |     | ├─ idioma_preferido        |
|                         |     | └─ activo                  |
| Adoption                | →   | Reseña                     |
| ├─ id (UUID)            | →   | ├─ id (UUID)               |
| ├─ animal_id            | →   | ├─ usuario_id              |
| ├─ adopter_name         | →   | ├─ destino                 |
| └─ status               | →   | ├─ mensaje                 |
|                         |     | ├─ calificacion (1-5)      |
|                         |     | └─ status                  |

### Eventos

| practicaweb-resiliencia | →   | practica-serverless       |
| ----------------------- | --- | ------------------------- |
| animal.create           | →   | usuario.create            |
| adoption.request        | →   | resena.request            |
| adoption.completed      | →   | resena.created            |
|                         |     | resena.low_rating (nuevo) |

### Colas RabbitMQ

| practicaweb-resiliencia | →   | practica-serverless |
| ----------------------- | --- | ------------------- |
| animal_queue            | →   | usuario_queue       |
| adoption_queue          | →   | resena_queue        |
| webhook_queue           | →   | webhook_queue       |
| webhook_dlq             | →   | webhook_dlq         |

---

## 🏗️ Arquitectura Compartida

Ambos proyectos comparten la **misma arquitectura base**:

```
Cliente HTTP
    ↓
API Gateway (ms-gateway)
    ↓
RabbitMQ (Colas de mensajes)
    ↓
Microservicios (ms-1, ms-2)
    ↓
PostgreSQL + Redis
    ↓
Webhooks Publisher
    ↓
Supabase Edge Functions
    ↓
Telegram Bot
```

### Componentes Idénticos

1. **Patrón de Comunicación**

   - API Gateway → RabbitMQ → Microservicios
   - Asíncrono y desacoplado

2. **Sistema de Webhooks**

   - HMAC-SHA256 para firma
   - 6 reintentos con backoff exponencial
   - Dead Letter Queue (DLQ)
   - Tablas: webhook_subscriptions, webhook_events, webhook_deliveries

3. **Idempotencia**

   - Redis SETNX
   - TTL de 24 horas
   - IdempotencyGuard en microservicios

4. **Supabase Edge Functions**

   - webhook-event-logger: Auditoría
   - webhook-external-notifier: Notificaciones Telegram

5. **Docker Compose**
   - RabbitMQ
   - PostgreSQL (2 instancias)
   - Redis

---

## 🆕 Diferencias Clave

### 1. Lógica de Negocio

**practicaweb-resiliencia:**

- Foco en adopciones de animales
- Un evento webhook: `adoption.completed`
- Notificación: Cuando se completa una adopción

**practica-serverless:**

- Foco en reseñas de usuarios
- Dos eventos webhook: `resena.created`, `resena.low_rating`
- Notificación: Todas las reseñas, **alerta prioritaria** para calificaciones ≤ 2

### 2. Entidades Adicionales

**practica-serverless** tiene:

- Campo `calificacion` (1-5) en Reseña
- Campo `tipo` (estándar/premium) en Usuario
- Campo `idioma_preferido` en Usuario
- Lógica condicional para disparar diferentes eventos según calificación

### 3. Eventos Webhook

**practicaweb-resiliencia:**

```typescript
event_type: "adoption.completed";
payload: {
  adoption_id,
    animal_id,
    adopter_name,
    adopted_at;
}
```

**practica-serverless:**

```typescript
// Si calificacion >= 3
event_type: "resena.created";
payload: {
  resena_id,
    usuario_id,
    destino,
    mensaje,
    calificacion,
    created_at;
}

// Si calificacion <= 2
event_type: "resena.low_rating";
payload: {
  /* mismo payload */
}
```

---

## 💡 Por Qué Esta Combinación

### De practicaweb-resiliencia tomamos:

✅ Arquitectura de microservicios robusta  
✅ Sistema de webhooks avanzado  
✅ Resiliencia (reintentos, DLQ, idempotencia)  
✅ RabbitMQ para mensajería  
✅ Redis para cache  
✅ Docker Compose completo

### De webhook-serverless tomamos:

✅ Entidades de negocio (Usuario, Reseña)  
✅ Lógica de calificaciones  
✅ Tipos de usuario (estándar/premium)  
✅ Idioma preferido

### Resultado:

🎯 **Sistema empresarial robusto** con entidades de negocio del dominio de reseñas

---

## 📈 Ventajas de practica-serverless

1. **Escalabilidad**: Arquitectura de microservicios
2. **Resiliencia**: Reintentos automáticos, DLQ
3. **Consistencia**: Idempotencia garantizada
4. **Seguridad**: HMAC-SHA256 en webhooks
5. **Monitoreo**: Auditoría completa de eventos
6. **Alertas**: Sistema de notificaciones inteligente
7. **Flexibilidad**: Fácil agregar nuevos microservicios
8. **Testeable**: Cada microservicio es independiente

---

## 🎓 Aprendizajes

### practicaweb-resiliencia enseña:

- Arquitectura de microservicios
- Patrones de resiliencia
- Webhooks empresariales
- Idempotencia distribuida

### webhook-serverless enseña:

- Serverless con Supabase
- Simplidad en el diseño
- Edge Functions
- Modelo de datos de reseñas

### practica-serverless combina:

- Lo mejor de ambos mundos
- Arquitectura profesional
- Entidades de negocio prácticas
- Sistema de producción completo

---

## 🚀 Casos de Uso

### Usa practicaweb-resiliencia si:

- Trabajas con adopciones de animales
- Quieres aprender la arquitectura base
- Necesitas un ejemplo de referencia

### Usa practica-serverless si:

- Trabajas con sistemas de reseñas
- Necesitas alertas por calificaciones bajas
- Quieres un sistema de producción adaptable
- Aprendes mejor con ejemplos familiares (hoteles, restaurantes)

---

## 📚 Siguiente Paso

1. ✅ **Entender** ambas arquitecturas
2. ✅ **Comparar** las diferencias
3. ✅ **Implementar** practica-serverless
4. 🎯 **Adaptar** a tu propio dominio de negocio

### Ideas para adaptar:

- E-commerce: Productos → Pedidos
- Educación: Estudiantes → Calificaciones
- Salud: Pacientes → Citas
- Finanzas: Cuentas → Transacciones
