-- =====================================================
-- MIGRATIONS PARA INTEGRAÇÃO HOTMART
-- =====================================================
-- Este arquivo contém exemplos das migrations necessárias
-- para a integração com a Hotmart
-- Execute usando: npx sequelize-cli db:migrate
-- =====================================================

-- Migration 1: Atualizar tabela Users
-- Arquivo: YYYYMMDDHHMMSS-update-users-for-hotmart.js

CREATE TABLE IF NOT EXISTS "Users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "name" VARCHAR(255) NOT NULL,
  "password" VARCHAR(255) NOT NULL,
  "userType" VARCHAR(20) NOT NULL DEFAULT 'comum' CHECK ("userType" IN ('comum', 'premium')),
  "isActive" BOOLEAN DEFAULT true,
  "emailVerified" BOOLEAN DEFAULT false,
  "lastLoginAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para Users
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "Users" ("email");
CREATE INDEX IF NOT EXISTS "users_user_type_idx" ON "Users" ("userType");
CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "Users" ("createdAt");

-- Migration 2: Criar tabela Subscriptions
-- Arquivo: YYYYMMDDHHMMSS-create-subscriptions.js

CREATE TABLE IF NOT EXISTS "Subscriptions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "status" VARCHAR(20) NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'canceled', 'expired', 'pending')),
  "paymentMethod" VARCHAR(20) NOT NULL CHECK ("paymentMethod" IN ('credit_card', 'pix', 'boleto', 'paypal', 'other')),
  "hotmartSubscriptionId" VARCHAR(255),
  "currentPeriodStart" TIMESTAMP WITH TIME ZONE,
  "currentPeriodEnd" TIMESTAMP WITH TIME ZONE,
  "lastPaymentDate" TIMESTAMP WITH TIME ZONE,
  "nextBillingDate" TIMESTAMP WITH TIME ZONE,
  "isRecurring" BOOLEAN DEFAULT false,
  "canceledAt" TIMESTAMP WITH TIME ZONE,
  "cancelReason" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para Subscriptions
CREATE INDEX IF NOT EXISTS "subscriptions_user_id_idx" ON "Subscriptions" ("userId");
CREATE INDEX IF NOT EXISTS "subscriptions_status_idx" ON "Subscriptions" ("status");
CREATE INDEX IF NOT EXISTS "subscriptions_hotmart_id_idx" ON "Subscriptions" ("hotmartSubscriptionId");
CREATE INDEX IF NOT EXISTS "subscriptions_payment_method_idx" ON "Subscriptions" ("paymentMethod");
CREATE INDEX IF NOT EXISTS "subscriptions_period_idx" ON "Subscriptions" ("currentPeriodStart", "currentPeriodEnd");
CREATE INDEX IF NOT EXISTS "subscriptions_next_billing_idx" ON "Subscriptions" ("nextBillingDate");
CREATE INDEX IF NOT EXISTS "subscriptions_active_period_idx" ON "Subscriptions" ("userId", "status", "currentPeriodStart", "currentPeriodEnd");

-- Migration 3: Criar tabela PaymentTransactions
-- Arquivo: YYYYMMDDHHMMSS-create-payment-transactions.js

CREATE TABLE IF NOT EXISTS "PaymentTransactions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "subscriptionId" UUID REFERENCES "Subscriptions"("id") ON DELETE SET NULL,
  "hotmartTransactionId" VARCHAR(255) NOT NULL,
  "status" VARCHAR(20) NOT NULL CHECK ("status" IN ('pending', 'approved', 'canceled', 'refunded', 'chargeback', 'failed')),
  "paymentMethod" VARCHAR(20) NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
  "installments" INTEGER DEFAULT 1,
  "approvedAt" TIMESTAMP WITH TIME ZONE,
  "processedAt" TIMESTAMP WITH TIME ZONE,
  "refundedAt" TIMESTAMP WITH TIME ZONE,
  "refundAmount" DECIMAL(10,2),
  "gatewayResponse" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para PaymentTransactions
CREATE UNIQUE INDEX IF NOT EXISTS "payment_transactions_hotmart_id_idx" ON "PaymentTransactions" ("hotmartTransactionId");
CREATE INDEX IF NOT EXISTS "payment_transactions_user_id_idx" ON "PaymentTransactions" ("userId");
CREATE INDEX IF NOT EXISTS "payment_transactions_subscription_id_idx" ON "PaymentTransactions" ("subscriptionId");
CREATE INDEX IF NOT EXISTS "payment_transactions_status_idx" ON "PaymentTransactions" ("status");
CREATE INDEX IF NOT EXISTS "payment_transactions_payment_method_idx" ON "PaymentTransactions" ("paymentMethod");
CREATE INDEX IF NOT EXISTS "payment_transactions_approved_at_idx" ON "PaymentTransactions" ("approvedAt");
CREATE INDEX IF NOT EXISTS "payment_transactions_amount_idx" ON "PaymentTransactions" ("amount");
CREATE INDEX IF NOT EXISTS "payment_transactions_created_at_idx" ON "PaymentTransactions" ("createdAt");

-- Migration 4: Criar tabela WebhookEventLogs
-- Arquivo: YYYYMMDDHHMMSS-create-webhook-event-logs.js

CREATE TABLE IF NOT EXISTS "WebhookEventLogs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "eventId" VARCHAR(255) NOT NULL,
  "source" VARCHAR(50) NOT NULL DEFAULT 'hotmart',
  "eventType" VARCHAR(100) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'received' CHECK ("status" IN ('received', 'processing', 'processed', 'failed', 'ignored')),
  "headers" JSONB,
  "rawPayload" JSONB NOT NULL,
  "signature" VARCHAR(255),
  "processedAt" TIMESTAMP WITH TIME ZONE,
  "errorMessage" TEXT,
  "retryCount" INTEGER DEFAULT 0,
  "lastRetryAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para WebhookEventLogs
CREATE UNIQUE INDEX IF NOT EXISTS "webhook_event_logs_event_id_idx" ON "WebhookEventLogs" ("eventId");
CREATE INDEX IF NOT EXISTS "webhook_event_logs_source_idx" ON "WebhookEventLogs" ("source");
CREATE INDEX IF NOT EXISTS "webhook_event_logs_event_type_idx" ON "WebhookEventLogs" ("eventType");
CREATE INDEX IF NOT EXISTS "webhook_event_logs_status_idx" ON "WebhookEventLogs" ("status");
CREATE INDEX IF NOT EXISTS "webhook_event_logs_created_at_idx" ON "WebhookEventLogs" ("createdAt");
CREATE INDEX IF NOT EXISTS "webhook_event_logs_processed_at_idx" ON "WebhookEventLogs" ("processedAt");
CREATE INDEX IF NOT EXISTS "webhook_event_logs_retry_idx" ON "WebhookEventLogs" ("retryCount", "lastRetryAt");

-- =====================================================
-- VIEWS ÚTEIS PARA RELATÓRIOS
-- =====================================================

-- View: Assinaturas ativas no mês atual
CREATE OR REPLACE VIEW "ActiveSubscriptionsCurrentMonth" AS
SELECT 
  s.*,
  u.email,
  u.name as user_name,
  CASE 
    WHEN s."currentPeriodStart" <= NOW() 
         AND s."currentPeriodEnd" >= NOW() 
         AND s.status = 'active'
    THEN true
    ELSE false
  END as is_active_current_month
FROM "Subscriptions" s
JOIN "Users" u ON s."userId" = u.id
WHERE s.status = 'active';

-- View: Resumo de transações por método de pagamento
CREATE OR REPLACE VIEW "PaymentMethodSummary" AS
SELECT 
  "paymentMethod",
  COUNT(*) as transaction_count,
  SUM(amount) as total_amount,
  AVG(amount) as average_amount,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
  COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded_count,
  COUNT(CASE WHEN status = 'chargeback' THEN 1 END) as chargeback_count
FROM "PaymentTransactions"
GROUP BY "paymentMethod"
ORDER BY total_amount DESC;

-- View: Estatísticas de webhook por tipo de evento
CREATE OR REPLACE VIEW "WebhookEventStats" AS
SELECT 
  "eventType",
  COUNT(*) as total_events,
  COUNT(CASE WHEN status = 'processed' THEN 1 END) as processed_count,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
  COUNT(CASE WHEN status = 'ignored' THEN 1 END) as ignored_count,
  AVG("retryCount") as avg_retry_count,
  MIN("createdAt") as first_event,
  MAX("createdAt") as last_event
FROM "WebhookEventLogs"
GROUP BY "eventType"
ORDER BY total_events DESC;

-- =====================================================
-- FUNÇÕES ÚTEIS
-- =====================================================

-- Função: Verificar se usuário tem assinatura ativa no mês atual
CREATE OR REPLACE FUNCTION check_user_active_subscription(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM "Subscriptions" 
    WHERE "userId" = user_uuid 
      AND status = 'active'
      AND "currentPeriodStart" <= NOW()
      AND "currentPeriodEnd" >= NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Função: Obter estatísticas de receita mensal
CREATE OR REPLACE FUNCTION get_monthly_revenue_stats(start_date DATE, end_date DATE)
RETURNS TABLE (
  month_year TEXT,
  total_revenue DECIMAL,
  transaction_count BIGINT,
  unique_users BIGINT,
  avg_transaction_value DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(DATE_TRUNC('month', "approvedAt"), 'YYYY-MM') as month_year,
    SUM(amount) as total_revenue,
    COUNT(*) as transaction_count,
    COUNT(DISTINCT "userId") as unique_users,
    AVG(amount) as avg_transaction_value
  FROM "PaymentTransactions"
  WHERE status = 'approved'
    AND "approvedAt" >= start_date
    AND "approvedAt" <= end_date
  GROUP BY DATE_TRUNC('month', "approvedAt")
  ORDER BY month_year;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS PARA AUDITORIA
-- =====================================================

-- Trigger: Atualizar userType quando assinatura muda
CREATE OR REPLACE FUNCTION update_user_type_on_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a assinatura foi ativada
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
    UPDATE "Users" 
    SET "userType" = 'premium', "updatedAt" = NOW()
    WHERE id = NEW."userId";
  END IF;
  
  -- Se a assinatura foi cancelada/expirada
  IF NEW.status IN ('canceled', 'expired') AND OLD.status = 'active' THEN
    -- Verificar se não há outras assinaturas ativas
    IF NOT EXISTS (
      SELECT 1 FROM "Subscriptions" 
      WHERE "userId" = NEW."userId" 
        AND id != NEW.id 
        AND status = 'active'
        AND "currentPeriodStart" <= NOW()
        AND "currentPeriodEnd" >= NOW()
    ) THEN
      UPDATE "Users" 
      SET "userType" = 'comum', "updatedAt" = NOW()
      WHERE id = NEW."userId";
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_status_change_trigger
  AFTER INSERT OR UPDATE ON "Subscriptions"
  FOR EACH ROW
  EXECUTE FUNCTION update_user_type_on_subscription_change();

-- =====================================================
-- POLÍTICAS DE LIMPEZA (OPCIONAL)
-- =====================================================

-- Procedure: Limpar logs antigos de webhook (executar mensalmente)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_logs(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM "WebhookEventLogs" 
  WHERE "createdAt" < NOW() - INTERVAL '1 day' * retention_days
    AND status IN ('processed', 'ignored');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CONSULTAS ÚTEIS PARA MONITORAMENTO
-- =====================================================

-- Verificar assinaturas que expiram nos próximos 7 dias
/*
SELECT 
  u.email,
  u.name,
  s."currentPeriodEnd",
  s."paymentMethod",
  s."nextBillingDate"
FROM "Subscriptions" s
JOIN "Users" u ON s."userId" = u.id
WHERE s.status = 'active'
  AND s."currentPeriodEnd" BETWEEN NOW() AND NOW() + INTERVAL '7 days'
ORDER BY s."currentPeriodEnd";
*/

-- Verificar eventos de webhook com falha nas últimas 24 horas
/*
SELECT 
  "eventType",
  "eventId",
  "errorMessage",
  "retryCount",
  "createdAt"
FROM "WebhookEventLogs"
WHERE status = 'failed'
  AND "createdAt" >= NOW() - INTERVAL '24 hours'
ORDER BY "createdAt" DESC;
*/

-- Verificar receita por método de pagamento no mês atual
/*
SELECT 
  "paymentMethod",
  COUNT(*) as transactions,
  SUM(amount) as total_revenue,
  AVG(amount) as avg_amount
FROM "PaymentTransactions"
WHERE status = 'approved'
  AND "approvedAt" >= DATE_TRUNC('month', NOW())
GROUP BY "paymentMethod"
ORDER BY total_revenue DESC;
*/

-- =====================================================
-- BACKUP E RESTORE
-- =====================================================

-- Comando para backup (executar no terminal)
-- pg_dump -h localhost -U postgres -d saas_buyandhold --schema-only > schema_backup.sql
-- pg_dump -h localhost -U postgres -d saas_buyandhold --data-only > data_backup.sql

-- Comando para restore (executar no terminal)
-- psql -h localhost -U postgres -d saas_buyandhold_new < schema_backup.sql
-- psql -h localhost -U postgres -d saas_buyandhold_new < data_backup.sql