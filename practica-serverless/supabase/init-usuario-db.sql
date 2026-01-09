-- ============================================
-- SCRIPT DE INICIALIZACIÓN - BASE DE DATOS USUARIO
-- ============================================

-- 1. TABLA DE USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  correo TEXT UNIQUE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('estándar', 'premium')),
  idioma_preferido TEXT DEFAULT 'es',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_usuarios_correo ON usuarios(correo);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios(tipo);
CREATE INDEX IF NOT EXISTS idx_usuarios_created ON usuarios(created_at);

-- 3. VERIFICAR TABLAS CREADAS
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
