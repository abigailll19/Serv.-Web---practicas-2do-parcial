# Ejemplos de Requests HTTP

## 📋 Colección de pruebas para el sistema

### 1. Health Checks

```bash
# Gateway
curl http://localhost:3000/health

# Usuario
curl http://localhost:3001/health

# Reseña
curl http://localhost:3002/health
```

---

## 👤 USUARIOS

### Crear usuario estándar

```bash
curl -X POST http://localhost:3000/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez",
    "correo": "juan@example.com",
    "tipo": "estándar",
    "idioma_preferido": "es"
  }'
```

### Crear usuario premium

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

### Crear usuario con idioma inglés

```bash
curl -X POST http://localhost:3000/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "John Smith",
    "correo": "john@example.com",
    "tipo": "premium",
    "idioma_preferido": "en"
  }'
```

### Listar todos los usuarios

```bash
curl http://localhost:3001/usuarios
```

---

## ⭐ RESEÑAS

### Crear reseña con calificación excelente (5 estrellas)

```bash
curl -X POST http://localhost:3000/resenas \
  -H "Content-Type: application/json" \
  -d '{
    "usuario_id": 1,
    "destino": "Hotel Paradise Resort",
    "mensaje": "Experiencia increíble. El personal fue muy amable, las instalaciones impecables y la comida deliciosa. Sin duda volveré.",
    "calificacion": 5
  }'
```

**Resultado:** Dispara evento `resena.created` → Webhook → Telegram

---

### Crear reseña buena (4 estrellas)

```bash
curl -X POST http://localhost:3000/resenas \
  -H "Content-Type: application/json" \
  -d '{
    "usuario_id": 1,
    "destino": "Restaurante La Bella Italia",
    "mensaje": "Muy buena comida italiana, ambiente agradable. Solo mejoraría el tiempo de espera.",
    "calificacion": 4
  }'
```

**Resultado:** Dispara evento `resena.created` → Webhook → Telegram

---

### Crear reseña regular (3 estrellas)

```bash
curl -X POST http://localhost:3000/resenas \
  -H "Content-Type: application/json" \
  -d '{
    "usuario_id": 2,
    "destino": "Café Central",
    "mensaje": "Servicio correcto, nada excepcional. Precio acorde a la calidad.",
    "calificacion": 3
  }'
```

**Resultado:** Dispara evento `resena.created` → Webhook → Telegram

---

### Crear reseña mala (2 estrellas) ⚠️

```bash
curl -X POST http://localhost:3000/resenas \
  -H "Content-Type: application/json" \
  -d '{
    "usuario_id": 2,
    "destino": "Hotel Decepción",
    "mensaje": "Habitaciones sucias, personal poco profesional. No cumplió las expectativas de las fotos.",
    "calificacion": 2
  }'
```

**Resultado:** ⚠️ Dispara evento `resena.low_rating` → **ALERTA** en Telegram

---

### Crear reseña pésima (1 estrella) 🚨

```bash
curl -X POST http://localhost:3000/resenas \
  -H "Content-Type: application/json" \
  -d '{
    "usuario_id": 3,
    "destino": "Restaurante El Desastre",
    "mensaje": "La peor experiencia de mi vida. Comida en mal estado, servicio horrible, ambiente deplorable. No recomiendo bajo ninguna circunstancia.",
    "calificacion": 1
  }'
```

**Resultado:** 🚨 Dispara evento `resena.low_rating` → **ALERTA CRÍTICA** en Telegram

---

### Listar todas las reseñas

```bash
curl http://localhost:3002/resenas
```

---

## 🧪 PRUEBAS DE IDEMPOTENCIA

### Enviar mismo mensaje dos veces (debe procesar solo una vez)

```bash
# Primera vez - debe procesar
curl -X POST http://localhost:3000/resenas \
  -H "Content-Type: application/json" \
  -d '{
    "usuario_id": 1,
    "destino": "Hotel Test",
    "mensaje": "Prueba de idempotencia",
    "calificacion": 5
  }'

# Esperar 1 segundo y enviar de nuevo
sleep 1

curl -X POST http://localhost:3000/resenas \
  -H "Content-Type: application/json" \
  -d '{
    "usuario_id": 1,
    "destino": "Hotel Test",
    "mensaje": "Prueba de idempotencia",
    "calificacion": 5
  }'
```

**Resultado esperado:**

- Primera petición: ✅ Procesada
- Segunda petición: ✅ Procesada (generará un nuevo message_id)

**Nota:** La idempotencia se basa en `message_id` único generado por el gateway, no en el contenido.

---

## 🔍 CONSULTAS DE VERIFICACIÓN

### Verificar en Redis (idempotencia)

```bash
docker exec -it practica-serverless-redis-1 redis-cli KEYS "idempotency:*"
```

### Verificar suscripciones de webhooks

```bash
docker exec -it practica-serverless-postgres_resena-1 psql -U pguser -d resena_db -c "SELECT * FROM webhook_subscriptions WHERE active = true;"
```

### Verificar eventos de webhooks

```bash
docker exec -it practica-serverless-postgres_resena-1 psql -U pguser -d resena_db -c "SELECT event_id, event_type, created_at FROM webhook_events ORDER BY created_at DESC LIMIT 10;"
```

### Verificar entregas de webhooks

```bash
docker exec -it practica-serverless-postgres_resena-1 psql -U pguser -d resena_db -c "SELECT event_id, attempt_number, status, created_at FROM webhook_deliveries ORDER BY created_at DESC LIMIT 10;"
```

### Verificar entregas fallidas

```bash
docker exec -it practica-serverless-postgres_resena-1 psql -U pguser -d resena_db -c "SELECT event_id, attempt_number, status, error_message FROM webhook_deliveries WHERE status = 'failed' ORDER BY created_at DESC;"
```

---

## 📊 ESCENARIOS DE PRUEBA COMPLETOS

### Escenario 1: Usuario nuevo con reseña positiva

```bash
# 1. Crear usuario
curl -X POST http://localhost:3000/usuarios \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Ana López","correo":"ana@example.com","tipo":"premium","idioma_preferido":"es"}'

# 2. Esperar 2 segundos
sleep 2

# 3. Verificar usuario creado
curl http://localhost:3001/usuarios

# 4. Crear reseña positiva (cambiar usuario_id según el creado)
curl -X POST http://localhost:3000/resenas \
  -H "Content-Type: application/json" \
  -d '{"usuario_id":1,"destino":"Spa Relajante","mensaje":"Increíble experiencia de relajación","calificacion":5}'

# 5. Verificar reseña
curl http://localhost:3002/resenas
```

### Escenario 2: Múltiples reseñas de diferentes calificaciones

```bash
# Crear 5 reseñas con diferentes calificaciones
for i in 5 4 3 2 1; do
  curl -X POST http://localhost:3000/resenas \
    -H "Content-Type: application/json" \
    -d "{\"usuario_id\":1,\"destino\":\"Lugar Test $i\",\"mensaje\":\"Calificación $i estrellas\",\"calificacion\":$i}"
  echo ""
  sleep 1
done

# Verificar todas las reseñas
curl http://localhost:3002/resenas
```

---

## 🎯 POSTMAN / INSOMNIA

Importa esta colección en tu cliente REST preferido:

**Base URL:** `http://localhost:3000`

### Endpoints:

1. `POST /usuarios` - Crear usuario
2. `POST /resenas` - Crear reseña
3. `GET http://localhost:3001/usuarios` - Listar usuarios
4. `GET http://localhost:3002/resenas` - Listar reseñas

---

## 📱 VERIFICAR TELEGRAM

Si configuraste el bot de Telegram, deberías recibir notificaciones para:

- ✅ Reseñas con calificación ≥ 3: Notificación normal
- ⚠️ Reseñas con calificación ≤ 2: **Alerta con prioridad**

Formato del mensaje:

```
🎉 Nueva Reseña Creada

🏨 Destino: Hotel Paradise
⭐ Calificación: ⭐⭐⭐⭐⭐ (5/5)
👤 Usuario ID: 1
💬 Mensaje: Excelente servicio...
📅 Fecha: 15/12/2025 10:30:00
🆔 Reseña ID: uuid-aqui
```
