-- ============================================
-- SCRIPT DE INICIALIZACIÓN - BASE DE DATOS RESEÑA
-- ============================================

-- 1. TABLA PRINCIPAL DE RESEÑAS
CREATE TABLE IF NOT EXISTS resenas (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL,
  destino TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  calificacion INTEGER NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA DE IDEMPOTENCIA
CREATE TABLE IF NOT EXISTS idempotency_keys (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  response_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLAS DE WEBHOOKS
CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  event_type TEXT NOT NULL,
  secret TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  attempt_number INTEGER DEFAULT 1,
  status TEXT CHECK (status IN ('pending', 'delivered', 'failed')),
  response_status INTEGER,
  error_message TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS processed_webhooks (
  event_id TEXT NOT NULL,
  processor TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (event_id, processor)
);

-- 4. CREAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_resenas_usuario ON resenas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_resenas_calificacion ON resenas(calificacion);
CREATE INDEX IF NOT EXISTS idx_resenas_created ON resenas(created_at);
CREATE INDEX IF NOT EXISTS idx_idempotency_key ON idempotency_keys(key);
CREATE INDEX IF NOT EXISTS idx_subscriptions_event_type ON webhook_subscriptions(event_type);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON webhook_subscriptions(active);
CREATE INDEX IF NOT EXISTS idx_events_event_id ON webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created ON webhook_events(created_at);
CREATE INDEX IF NOT EXISTS idx_deliveries_subscription ON webhook_deliveries(subscription_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_event ON webhook_deliveries(event_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_processed_at ON processed_webhooks(processed_at);

-- 5. REGISTRAR SUSCRIPCIONES DE WEBHOOKS (OPCIONAL)
-- Reemplaza "lsckojdsitlkqzbugdfe" con tu Project ID de Supabase si lo usas
INSERT INTO webhook_subscriptions (url, event_type, secret) VALUES
('https://lsckojdsitlkqzbugdfe.supabase.co/functions/v1/webhook-event-logger', 'resena.created', 'mi-super-secreto-compartido-12345'),
('https://lsckojdsitlkqzbugdfe.supabase.co/functions/v1/webhook-event-logger', 'resena.low_rating', 'mi-super-secreto-compartido-12345'),
('https://lsckojdsitlkqzbugdfe.supabase.co/functions/v1/webhook-external-notifier', 'resena.created', 'mi-super-secreto-compartido-12345'),
('https://lsckojdsitlkqzbugdfe.supabase.co/functions/v1/webhook-external-notifier', 'resena.low_rating', 'mi-super-secreto-compartido-12345')
ON CONFLICT DO NOTHING;

-- 6. VERIFICAR TABLAS CREADAS
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
