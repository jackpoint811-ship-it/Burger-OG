-- Migration 0015: Chekeo Indexes & Audit Log
-- Optimización de consultas para Chekeo v2 y auditoría de eventos de órdenes.

PRAGMA foreign_keys = ON;

-- Índices de alto rendimiento para filtrado rápido por estado de pago y entorno
CREATE INDEX IF NOT EXISTS idx_orders_v2_payment_status ON orders_v2(payment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_v2_source_created ON orders_v2(source, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_v2_phone ON orders_v2(customer_phone);

-- Tabla de Auditoría de Operaciones en Chekeo v2
CREATE TABLE IF NOT EXISTS orders_v2_audit_logs (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT 'admin',
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders_v2(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_orders_v2_audit_order ON orders_v2_audit_logs(order_id, created_at DESC);
