# ms-gateway

API Gateway para sistema de microservicios de usuarios y reseñas.

## Puerto
3000

## Endpoints

### POST /usuarios
Envía solicitud de creación de usuario a RabbitMQ.

```json
{
  "nombre": "Juan Pérez",
  "correo": "juan@example.com",
  "tipo": "premium",
  "idioma_preferido": "es"
}
```

### POST /resenas
Envía solicitud de creación de reseña a RabbitMQ.

```json
{
  "usuario_id": 1,
  "destino": "Hotel Paradise",
  "mensaje": "Excelente servicio",
  "calificacion": 5
}
```

### GET /health
Health check del servicio.

## Instalación

```bash
npm install
npm run start:dev
```
