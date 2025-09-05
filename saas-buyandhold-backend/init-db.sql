-- ================================
-- Script de Inicialização do Banco
-- SaaS Buy & Hold - PostgreSQL
-- ================================

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Configurar timezone
SET timezone = 'America/Sao_Paulo';

-- Criar schema se não existir
CREATE SCHEMA IF NOT EXISTS public;

-- Comentários informativos
COMMENT ON DATABASE saas_buyandhold IS 'Banco de dados do SaaS Buy & Hold - Sistema de sugestões de investimento';

-- Configurações de performance
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- Recarregar configurações
SELECT pg_reload_conf();

-- Log de inicialização
DO $$
BEGIN
    RAISE NOTICE 'Banco de dados inicializado com sucesso para SaaS Buy & Hold';
    RAISE NOTICE 'Timezone configurado: %', current_setting('timezone');
    RAISE NOTICE 'Versão do PostgreSQL: %', version();
END $$;