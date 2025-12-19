# ms-usuario

Microservicio de gestión de usuarios.

## Puerto
3001

## Base de datos
- PostgreSQL: puerto 5434
- Database: `usuario_db`

## Endpoints

### GET /usuarios
Lista todos los usuarios.

### GET /health
Health check del servicio.

## Cola RabbitMQ
- Escucha: `usuario_queue`
- Eventos: `usuario.create`

## Instalación

```bash
npm install
npm run start:dev
```

## Entidad Usuario

```typescript
{
  id: string (UUID)
  nombre: string
  correo: string (único)
  tipo: string ('estándar' | 'premium')
  idioma_preferido: string (default: 'es')
  activo: boolean (default: true)
  created_at: Date
  updated_at: Date
}
```
