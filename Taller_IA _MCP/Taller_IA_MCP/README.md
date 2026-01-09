# 🌍 Sistema de Gestión de Usuarios y Reseñas Turísticas con IA

Sistema de microservicios con integración de **Gemini 2.5 Flash** para gestionar usuarios y reseñas turísticas mediante conversación natural con IA.

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Arquitectura](#-arquitectura)
- [Tecnologías](#-tecnologías)
- [Modelo de IA](#-modelo-de-ia)
- [Microservicios](#-microservicios)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [API Endpoints](#-api-endpoints)
- [Características Principales](#-características-principales)

## 🎯 Descripción

Sistema que permite gestionar usuarios y reseñas turísticas mediante:
- **API REST** tradicional para operaciones CRUD
- **Interfaz conversacional con IA** utilizando **Gemini 2.5 Flash** de Google
- **Herramientas MCP (Model Context Protocol)** para que la IA ejecute acciones

El sistema implementa una arquitectura de microservicios con bases de datos independientes y comunicación HTTP directa.

## 🏗️ Arquitectura

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │ HTTP
       ▼
┌──────────────────────────┐
│   API Gateway (3002)     │
│  + Gemini 2.5 Flash      │
└──────┬─────────┬─────────┘
       │         │
       │         │ HTTP
       ▼         ▼
┌──────────┐  ┌─────────────┐
│ MCP      │  │ Microserv.  │
│ Server   │  │ Backend     │
│ (3001)   │  └──────┬──────┘
└────┬─────┘         │
     │               ├──────────────┬──────────────┐
     │ HTTP          │              │              │
     └───────────────┤              │              │
                     ▼              ▼              ▼
              ┌───────────┐  ┌───────────┐  ┌───────────┐
              │ms-usuario │  │ ms-resena │  │ SQLite    │
              │  (3003)   │  │  (3004)   │  │ Databases │
              └───────────┘  └───────────┘  └───────────┘
```

### Flujo de Comunicación

1. **Cliente** → Envía mensaje de texto al API Gateway
2. **API Gateway** → Procesa con Gemini 2.5 Flash
3. **Gemini** → Decide qué herramienta(s) usar
4. **API Gateway** → Ejecuta herramientas vía MCP Server
5. **MCP Server** → Llama a microservicios específicos
6. **Microservicios** → Ejecutan operaciones en bases de datos
7. **Respuesta** → Gemini genera respuesta natural al usuario

## 🛠️ Tecnologías

### Backend
- **NestJS** - Framework Node.js para microservicios
- **TypeScript** - Lenguaje tipado
- **Express** - Servidor HTTP para MCP
- **SQLite** (better-sqlite3) - Base de datos
- **TypeORM** - ORM para gestión de datos

### Inteligencia Artificial
- **Google Gemini 2.5 Flash** - Modelo de IA generativa
- **@google/generative-ai** - SDK oficial de Google
- **Function Calling** - Capacidad de ejecutar herramientas

### Protocolos y Estándares
- **MCP (Model Context Protocol)** - Protocolo para herramientas de IA
- **JSON-RPC 2.0** - Protocolo de comunicación MCP
- **REST API** - Endpoints HTTP estándar

## 🤖 Modelo de IA

### Gemini 2.5 Flash

**Modelo utilizado:** `gemini-2.5-flash`

#### Características del Modelo
- **Versión:** Gemini 2.5 Flash (última versión de Google)
- **Capacidades:**
  - Comprensión de lenguaje natural
  - Function Calling nativo
  - Procesamiento rápido y eficiente
  - Soporte para múltiples herramientas simultáneas

#### Configuración
```typescript
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  tools: [{ functionDeclarations }],
  systemInstruction: `Eres un asistente de un sistema de gestión 
                     de usuarios y reseñas turísticas...`
});
```

#### Function Calling
El modelo puede decidir automáticamente cuándo y cómo usar estas herramientas:
- `buscar_usuario` - Buscar usuarios por correo
- `validar_resena` - Validar datos de reseñas
- `crear_resena` - Crear nuevas reseñas

#### Ejemplos de Interacción

**Usuario:** "Busca el usuario test@gmail.com"
- Gemini ejecuta: `buscar_usuario({ correo: "test@gmail.com" })`
- Responde con información del usuario encontrado

**Usuario:** "Crea una reseña de Quito con 5 estrellas"
- Gemini ejecuta: `crear_resena({ destino: "Quito", calificacion: 5, ... })`
- Confirma la creación con lenguaje natural

## 📦 Microservicios

### 1. API Gateway (Puerto 3002)

**Responsabilidad:** Punto de entrada principal y procesamiento con IA

**Tecnologías:**
- NestJS
- @google/generative-ai
- dotenv

**Endpoints:**
- `POST /chat` - Enviar mensaje a Gemini
- `GET /chat/models` - Listar modelos disponibles

**Variables de Entorno:**
```env
GEMINI_API_KEY=tu_api_key_aqui
PORT=3002
```

**Características:**
- Integración directa con Gemini 2.5 Flash
- Conversión de herramientas MCP a formato Gemini
- Manejo de Function Calling
- Respuestas en lenguaje natural

### 2. MCP Server (Puerto 3001)

**Responsabilidad:** Servidor de herramientas siguiendo Model Context Protocol

**Tecnologías:**
- Express
- TypeScript
- JSON-RPC 2.0

**Endpoints:**
- `POST /mcp` - Ejecutar herramientas (JSON-RPC 2.0)
- `GET /tools` - Listar herramientas disponibles
- `GET /health` - Health check

**Herramientas Disponibles:**

#### 1. `buscar_usuario`
```typescript
{
  name: "buscar_usuario",
  description: "Busca usuarios por correo electrónico",
  parameters: {
    correo: string // Correo del usuario
  }
}
```

#### 2. `validar_resena`
```typescript
{
  name: "validar_resena",
  description: "Valida reglas de negocio de una reseña",
  parameters: {
    usuario_id: string,    // UUID del usuario
    calificacion: number,  // 1-5
    mensaje: string        // Contenido de la reseña
  }
}
```

#### 3. `crear_resena`
```typescript
{
  name: "crear_resena",
  description: "Crea una nueva reseña",
  parameters: {
    autor: string,
    destino: string,
    mensaje: string,
    calificacion: number,
    usuario_id: string
  }
}
```

### 3. ms-usuario (Puerto 3003)

**Responsabilidad:** Gestión de usuarios

**Base de Datos:** SQLite (`data/usuario.db`)

**Endpoints:**
- `POST /usuarios` - Crear usuario
- `GET /usuarios` - Listar usuarios
- `GET /usuarios/buscar?correo=email` - Buscar por correo

**Entidad Usuario:**
```typescript
{
  id: UUID
  nombre: string
  correo: string (único)
  contrasena: string
  tipo: string
  idiomaPreferido: string
  createdAt: Date
  updatedAt: Date
}
```

**Características:**
- Validación de correo único
- Búsqueda eficiente por correo
- TypeORM con SQLite

### 4. ms-resena (Puerto 3004)

**Responsabilidad:** Gestión de reseñas turísticas

**Base de Datos:** SQLite (`data/resena.db`)

**Endpoints:**
- `POST /resenas` - Crear reseña
- `GET /resenas` - Listar reseñas

**Entidad Reseña:**
```typescript
{
  id: UUID
  autor: string
  destino: string
  mensaje: string
  calificacion: number (1-5)
  usuario_id: string (UUID)
  createdAt: Date
  updatedAt: Date
}
```

**Validaciones:**
- Calificación entre 1 y 5
- Mensaje mínimo 10 caracteres
- UUID válido para usuario_id

## 📁 Estructura del Proyecto

```
Practica resiliencia - Servidores web/
├── README.md                    # Este archivo
├── RESUMEN.md                   # Resumen técnico detallado
├── DIAGRAMAS.md                 # Diagramas de arquitectura
│
├── apps/
│   ├── api-gateway/             # Gateway + Gemini 2.5 Flash
│   │   ├── src/
│   │   │   ├── main.ts          # Bootstrap del servidor
│   │   │   ├── app.module.ts
│   │   │   └── chat/
│   │   │       └── chat.controller.ts  # Controlador de IA
│   │   └── package.json
│   │
│   ├── mcp-server/              # Servidor de herramientas MCP
│   │   ├── src/
│   │   │   ├── server.ts        # Servidor Express JSON-RPC
│   │   │   └── tools/
│   │   │       ├── buscar-usuario.tool.ts
│   │   │       ├── validar-resena.tool.ts
│   │   │       ├── crear-resena.tool.ts
│   │   │       └── registry.ts
│   │   └── package.json
│   │
│   └── backend/
│       └── src/
│           ├── ms-usuario/       # Microservicio de usuarios
│           │   └── src/
│           │       ├── main.ts
│           │       ├── app.module.ts
│           │       └── usuario/
│           │           ├── usuario.controller.ts
│           │           ├── usuario.service.ts
│           │           └── usuario.entity.ts
│           │
│           └── ms-resena/        # Microservicio de reseñas
│               └── src/
│                   ├── main.ts
│                   ├── app.module.ts
│                   └── resena/
│                       ├── resena.controller.ts
│                       ├── resena.service.ts
│                       └── resena.entity.ts
│
└── data/                        # Bases de datos SQLite
    ├── usuario.db
    └── resena.db
```

## 🚀 Instalación

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- API Key de Google Gemini

### 1. Clonar el repositorio
```bash
cd "Practica resiliencia - Servidores web"
```

### 2. Configurar Variables de Entorno

Crear archivo `.env` en `apps/api-gateway/`:
```env
GEMINI_API_KEY=tu_api_key_de_google_gemini
PORT=3002
```

### 3. Instalar Dependencias

```bash
# API Gateway
cd apps/api-gateway
npm install

# MCP Server
cd ../mcp-server
npm install

# ms-usuario
cd ../backend/src/ms-usuario
npm install

# ms-resena
cd ../ms-resena
npm install
```

### 4. Iniciar Servicios

**Terminal 1 - ms-usuario:**
```bash
cd apps/backend/src/ms-usuario
npm run start:dev
```

**Terminal 2 - ms-resena:**
```bash
cd apps/backend/src/ms-resena
npm run start:dev
```

**Terminal 3 - MCP Server:**
```bash
cd apps/mcp-server
npm run dev
```

**Terminal 4 - API Gateway:**
```bash
cd apps/api-gateway
npm run start:dev
```

### 5. Verificar que todo funciona

```bash
# Health check del MCP Server
curl http://localhost:3001/health

# Listar herramientas disponibles
curl http://localhost:3001/tools
```

## 💬 Uso

### Interacción con IA (Recomendado)

```bash
# Enviar mensaje a Gemini
curl -X POST http://localhost:3002/chat \
  -H "Content-Type: application/json" \
  -d '{"mensaje": "Busca el usuario test@gmail.com"}'

# Crear una reseña con lenguaje natural
curl -X POST http://localhost:3002/chat \
  -H "Content-Type: application/json" \
  -d '{"mensaje": "Crea una reseña de Quito con 5 estrellas, 
       autor Juan Pérez, mensaje: Excelente ciudad"}'

# Validar una reseña
curl -X POST http://localhost:3002/chat \
  -H "Content-Type: application/json" \
  -d '{"mensaje": "Valida una reseña con calificación 6"}'
```

### API REST Directa

```bash
# Crear usuario
curl -X POST http://localhost:3003/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez",
    "correo": "juan@example.com",
    "contrasena": "123456",
    "tipo": "turista",
    "idiomaPreferido": "es"
  }'

# Buscar usuario
curl "http://localhost:3003/usuarios/buscar?correo=juan@example.com"

# Crear reseña
curl -X POST http://localhost:3004/resenas \
  -H "Content-Type: application/json" \
  -d '{
    "autor": "Juan Pérez",
    "destino": "Quito",
    "mensaje": "Ciudad hermosa con gran historia",
    "calificacion": 5,
    "usuario_id": "uuid-del-usuario"
  }'

# Listar reseñas
curl http://localhost:3004/resenas
```

## 📚 API Endpoints

### API Gateway (3002)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/chat` | Enviar mensaje a Gemini |
| GET | `/chat/models` | Listar modelos disponibles |

### MCP Server (3001)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/mcp` | Ejecutar herramienta (JSON-RPC 2.0) |
| GET | `/tools` | Listar herramientas disponibles |
| GET | `/health` | Health check |

### ms-usuario (3003)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/usuarios` | Crear usuario |
| GET | `/usuarios` | Listar todos los usuarios |
| GET | `/usuarios/buscar?correo=email` | Buscar por correo |

### ms-resena (3004)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/resenas` | Crear reseña |
| GET | `/resenas` | Listar todas las reseñas |

## ✨ Características Principales

### 1. Interfaz de IA Conversacional
- Interacción en lenguaje natural
- Gemini 2.5 Flash decide qué herramientas usar
- Respuestas contextuales y amigables

### 2. Function Calling Inteligente
- La IA ejecuta automáticamente las herramientas necesarias
- Puede usar múltiples herramientas en una conversación
- Manejo de errores con lenguaje natural

### 3. Arquitectura de Microservicios
- Servicios independientes y escalables
- Bases de datos aisladas
- Comunicación HTTP directa

### 4. Model Context Protocol (MCP)
- Estándar emergente para herramientas de IA
- JSON-RPC 2.0 para comunicación
- Herramientas reutilizables y extensibles

### 5. Validaciones de Negocio
- Validación de datos antes de persistir
- Reglas de negocio centralizadas
- Mensajes de error claros

### 6. Bases de Datos Independientes
- SQLite para cada microservicio
- TypeORM para gestión de datos
- Migraciones automáticas

## 🎓 Casos de Uso

### Ejemplo 1: Búsqueda de Usuario
```
Usuario: "Necesito buscar el usuario con correo maria@example.com"
Gemini: Ejecuta buscar_usuario({ correo: "maria@example.com" })
Respuesta: "Encontré al usuario María García, registrada como turista con idioma preferido español"
```

### Ejemplo 2: Validación de Reseña
```
Usuario: "Valida si puedo crear una reseña con calificación 6"
Gemini: Ejecuta validar_resena({ calificacion: 6, ... })
Respuesta: "La reseña no es válida. La calificación debe estar entre 1 y 5"
```

### Ejemplo 3: Creación de Reseña
```
Usuario: "Crea una reseña de Galápagos, 5 estrellas, autor Carlos López"
Gemini: 
  1. Ejecuta validar_resena() - Válido ✓
  2. Ejecuta crear_resena({ destino: "Galápagos", ... })
Respuesta: "He creado exitosamente tu reseña de Galápagos con 5 estrellas"
```

## 🔧 Tecnologías en Detalle

### Google Gemini 2.5 Flash
- Modelo más reciente de Google (2025)
- Optimizado para velocidad y eficiencia
- Soporte nativo para Function Calling
- API: `@google/generative-ai@^0.24.1`

### NestJS
- Framework progresivo de Node.js
- Arquitectura modular
- Decoradores TypeScript
- Inyección de dependencias

### TypeORM
- ORM para TypeScript/JavaScript
- Soporte para múltiples bases de datos
- Migraciones automáticas
- Entidades decoradas

### SQLite (better-sqlite3)
- Base de datos embebida
- Sin servidor externo
- Alto rendimiento
- Ideal para desarrollo

## 📈 Próximas Mejoras

- [ ] Autenticación JWT
- [ ] Rate limiting
- [ ] Logging centralizado
- [ ] Métricas y monitoreo
- [ ] Tests automatizados
- [ ] Docker Compose
- [ ] CI/CD Pipeline
- [ ] Documentación OpenAPI/Swagger
- [ ] Cache con Redis
- [ ] GraphQL API

## 👨‍💻 Desarrollo

### Comandos Útiles

```bash
# Desarrollo con hot-reload
npm run start:dev

# Build de producción
npm run build

# Tests
npm test

# Linting
npm run lint
```

### Debugging

1. El API Gateway muestra si Gemini API Key está configurada
2. MCP Server lista todas las herramientas al iniciar
3. Cada microservicio muestra su puerto al arrancar
4. Logs detallados en cada operación


---

