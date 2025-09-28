-- =====================================================
-- MIGRATION: Criar tabela PixTransactions para Mercado Pago
-- =====================================================
-- Execute usando: psql -h localhost -U postgres -d saas_buyandhold < create-pix-transactions.sql
-- =====================================================

-- Criar tabela PixTransactions para Mercado Pago
CREATE TABLE IF NOT EXISTS "PixTransactions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "subscriptionId" UUID REFERENCES "Subscriptions"("id") ON DELETE SET NULL,
  
  -- Dados do Mercado Pago
  "mercadoPagoPaymentId" VARCHAR(255) NOT NULL UNIQUE,
  "externalReference" VARCHAR(255) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'approved', 'rejected', 'cancelled', 'refunded', 'charged_back')),
  
  -- Dados do PIX
  "pixCode" TEXT,
  "qrCodeBase64" TEXT,
  "pixKey" VARCHAR(255),
  
  -- Dados financeiros
  "amount" DECIMAL(10,2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
  "description" TEXT,
  
  -- Timestamps importantes
  "expirationDate" TIMESTAMP WITH TIME ZONE,
  "approvedAt" TIMESTAMP WITH TIME ZONE,
  "processedAt" TIMESTAMP WITH TIME ZONE,
  "refundedAt" TIMESTAMP WITH TIME ZONE,
  
  -- Dados adicionais
  "payerEmail" VARCHAR(255),
  "payerName" VARCHAR(255),
  "payerDocument" VARCHAR(20),
  "gatewayResponse" JSONB,
  "webhookData" JSONB,
  "metadata" JSONB,
  
  -- Controle de auditoria
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para PixTransactions
CREATE UNIQUE INDEX IF NOT EXISTS "pix_transactions_mp_payment_id_idx" ON "PixTransactions" ("mercadoPagoPaymentId");
CREATE UNIQUE INDEX IF NOT EXISTS "pix_transactions_external_ref_idx" ON "PixTransactions" ("externalReference");
CREATE INDEX IF NOT EXISTS "pix_transactions_user_id_idx" ON "PixTransactions" ("userId");
CREATE INDEX IF NOT EXISTS "pix_transactions_subscription_id_idx" ON "PixTransactions" ("subscriptionId");
CREATE INDEX IF NOT EXISTS "pix_transactions_status_idx" ON "PixTransactions" ("status");
CREATE INDEX IF NOT EXISTS "pix_transactions_approved_at_idx" ON "PixTransactions" ("approvedAt");
CREATE INDEX IF NOT EXISTS "pix_transactions_amount_idx" ON "PixTransactions" ("amount");
CREATE INDEX IF NOT EXISTS "pix_transactions_created_at_idx" ON "PixTransactions" ("createdAt");
CREATE INDEX IF NOT EXISTS "pix_transactions_expiration_date_idx" ON "PixTransactions" ("expirationDate");

-- Atualizar tabela WebhookEventLogs para suportar Mercado Pago
ALTER TABLE "WebhookEventLogs" 
ALTER COLUMN "source" SET DEFAULT 'mercadopago';

-- Adicionar constraint para source incluir mercadopago
ALTER TABLE "WebhookEventLogs" 
DROP CONSTRAINT IF EXISTS "webhook_event_logs_source_check";

ALTER TABLE "WebhookEventLogs" 
ADD CONSTRAINT "webhook_event_logs_source_check" 
CHECK ("source" IN ('hotmart', 'mercadopago', 'pix', 'other'));

-- Trigger para atualizar updatedAt automaticamente
CREATE OR REPLACE FUNCTION update_pix_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pix_transactions_updated_at_trigger
  BEFORE UPDATE ON "PixTransactions"
  FOR EACH ROW
  EXECUTE FUNCTION update_pix_transactions_updated_at();

-- Trigger para atualizar userType quando pagamento PIX é aprovado
CREATE OR REPLACE FUNCTION update_user_type_on_pix_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o pagamento foi aprovado
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Atualizar usuário para premium
    UPDATE "Users" 
    SET "userType" = 'premium', "updatedAt" = NOW()
    WHERE id = NEW."userId";
    
    -- Se há uma subscription associada, ativá-la
    IF NEW."subscriptionId" IS NOT NULL THEN
      UPDATE "Subscriptions"
      SET 
        "status" = 'active',
        "currentPeriodStart" = NOW(),
        "currentPeriodEnd" = NOW() + INTERVAL '1 month',
        "updatedAt" = NOW()
      WHERE id = NEW."subscriptionId";
    END IF;
    
    -- Log da aprovação
    INSERT INTO "WebhookEventLogs" (
      "eventId",
      "source", 
      "eventType",
      "status",
      "rawPayload"
    ) VALUES (
      'pix_approved_' || NEW."mercadoPagoPaymentId",
      'mercadopago',
      'payment.approved',
      'processed',
      jsonb_build_object(
        'paymentId', NEW."mercadoPagoPaymentId",
        'userId', NEW."userId",
        'amount', NEW.amount,
        'approvedAt', NEW."approvedAt"
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_type_on_pix_approval_trigger
  AFTER UPDATE ON "PixTransactions"
  FOR EACH ROW
  EXECUTE FUNCTION update_user_type_on_pix_approval();

-- Função para limpar transações PIX expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_pix_transactions()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE "PixTransactions"
  SET 
    "status" = 'cancelled',
    "updatedAt" = NOW()
  WHERE 
    "status" = 'pending'
    AND "expirationDate" < NOW()
    AND "expirationDate" IS NOT NULL;
    
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE "PixTransactions" IS 'Tabela para armazenar transações PIX do Mercado Pago';
COMMENT ON COLUMN "PixTransactions"."mercadoPagoPaymentId" IS 'ID único do pagamento no Mercado Pago';
COMMENT ON COLUMN "PixTransactions"."externalReference" IS 'Referência externa única gerada pela aplicação';
COMMENT ON COLUMN "PixTransactions"."status" IS 'Status do pagamento: pending, approved, rejected, cancelled, refunded, charged_back';
COMMENT ON COLUMN "PixTransactions"."pixCode" IS 'Código PIX copia e cola';
COMMENT ON COLUMN "PixTransactions"."qrCodeBase64" IS 'QR Code em base64 para exibição';
COMMENT ON COLUMN "PixTransactions"."gatewayResponse" IS 'Resposta completa da API do Mercado Pago';
COMMENT ON COLUMN "PixTransactions"."webhookData" IS 'Dados recebidos via webhook do Mercado Pago';

-- =====================================================
-- QUERIES ÚTEIS PARA MONITORAMENTO
-- =====================================================

-- Verificar transações PIX por status
/*
SELECT 
  status,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM "PixTransactions"
GROUP BY status
ORDER BY count DESC;
*/

-- Verificar transações PIX expiradas
/*
SELECT 
  COUNT(*) as expired_count
FROM "PixTransactions"
WHERE 
  status = 'pending'
  AND "expirationDate" < NOW();
*/

-- Verificar receita PIX por dia
/*
SELECT 
  DATE("approvedAt") as date,
  COUNT(*) as transactions,
  SUM(amount) as total_revenue
FROM "PixTransactions"
WHERE status = 'approved'
  AND "approvedAt" >= NOW() - INTERVAL '30 days'
GROUP BY DATE("approvedAt")
ORDER BY date DESC;
*/