# MCP Server - Model Context Protocol

Servidor MCP que expone 3 tools mediante JSON-RPC 2.0 para interactuar con el sistema de microservicios.

## 🔧 Tools Disponibles

### 1. **buscar_usuario** (Tool de Búsqueda)
Busca usuarios por correo electrónico en la entidad principal (Usuario - Maestro).

**Entrada:**
```json
{
  "correo": "usuario@example.com"
}
```

**Salida:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nombre": "Juan Pérez",
    "correo": "usuario@example.com",
    "tipo": "turista"
  }
}
```

### 2. **validar_resena** (Tool de Validación)
Valida reglas de negocio antes de crear una reseña (Entidad Movimiento).

**Reglas validadas:**
- Calificación entre 1 y 5
- Mensaje no vacío y mínimo 10 caracteres
- Usuario existe en el sistema

**Entrada:**
```json
{
  "usuario_id": "uuid-del-usuario",
  "calificacion": 5,
  "mensaje": "Excelente destino turístico"
}
```

**Salida:**
```json
{
  "valido": true,
  "mensaje": "La reseña cumple con todas las reglas de negocio"
}
```

### 3. **crear_resena** (Tool de Acción Transaccional)
Ejecuta la operación transaccional de crear una nueva reseña.

**Entrada:**
```json
{
  "autor": "Juan Pérez",
  "destino": "Playa de Manta",
  "mensaje": "Hermoso lugar con excelente clima",
  "calificacion": 5,
  "usuario_id": "uuid-del-usuario"
}
```

**Salida:**
```json
{
  "success": true,
  "data": {
    "message": "Resena request sent",
    "message_id": "uuid-del-mensaje"
  },
  "mensaje": "Reseña creada exitosamente. La operación fue enviada a través de RabbitMQ."
}
```

## 🚀 Instalación y Ejecución

### 1. Instalar dependencias
```bash
cd mcp-server
npm install
```

### 2. Ejecutar en modo desarrollo
```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3001`

## 📡 Endpoints

### POST /mcp
Endpoint principal para invocar tools mediante JSON-RPC 2.0.

**Ejemplo de request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "buscar_usuario",
  "params": {
    "correo": "juan@example.com"
  }
}
```

**Ejemplo de response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "success": true,
    "data": { ... }
  }
}
```

### GET /tools
Lista todos los tools disponibles con sus esquemas.

### GET /health
Health check del servidor.

## 🧪 Pruebas

### Usando cURL

**1. Buscar usuario:**
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "buscar_usuario",
    "params": {
      "correo": "juan@example.com"
    }
  }'
```

**2. Validar reseña:**
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "validar_resena",
    "params": {
      "usuario_id": "uuid-aqui",
      "calificacion": 5,
      "mensaje": "Excelente lugar para visitar"
    }
  }'
```

**3. Crear reseña:**
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "crear_resena",
    "params": {
      "autor": "Juan Pérez",
      "destino": "Playa de Manta",
      "mensaje": "Hermoso lugar con excelente clima",
      "calificacion": 5,
      "usuario_id": "uuid-aqui"
    }
  }'
```

**4. Listar tools disponibles:**
```bash
curl http://localhost:3001/tools
```

## 📋 Requisitos

El MCP Server requiere que estén corriendo:
- **ms-gateway** en puerto 3000
- **ms-usuario** en puerto 3003
- **ms-resena** en puerto 3004
- **RabbitMQ** y **PostgreSQL** (via docker-compose)

## 🏗️ Arquitectura

```
MCP Server (Puerto 3001)
  ├── Tool 1: buscar_usuario → ms-usuario:3003
  ├── Tool 2: validar_resena → ms-usuario:3003 (verificación)
  └── Tool 3: crear_resena → ms-gateway:3000 → RabbitMQ → ms-resena:3004
```

## 🔍 JSON-RPC 2.0

El servidor implementa el estándar JSON-RPC 2.0:
- Códigos de error estándar
- Validación de requests
- Respuestas estructuradas

### Códigos de Error
- `-32600`: Invalid Request
- `-32601`: Method not found
- `-32603`: Internal error
