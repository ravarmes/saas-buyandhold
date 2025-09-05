#!/bin/bash
# Script para alternar entre ambientes de TESTE e PRODUÇÃO
# Uso: ./switch-environment.sh [development|production|test]

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para output colorido
color_echo() {
    echo -e "${2}${1}${NC}"
}

# Função para mostrar ajuda
show_help() {
    color_echo "🔧 Script de Alternância de Ambiente" "$BLUE"
    echo ""
    echo "Uso:"
    echo "   ./switch-environment.sh development   # Ambiente de desenvolvimento"
    echo "   ./switch-environment.sh production    # Ambiente de produção"
    echo "   ./switch-environment.sh test          # Ambiente de teste"
    echo ""
    echo "Ambientes disponíveis:"
    echo "   • development: Desenvolvimento local (padrão)"
    echo "   • production:  Produção (buyandhold.vargascode.com.br)"
    echo "   • test:        Testes automatizados"
    echo ""
    color_echo "💡 Este script configura automaticamente frontend e backend" "$YELLOW"
}

# Função para mostrar configurações ativas
show_active_configuration() {
    local env=$1
    
    color_echo "📋 Configurações ativas para $env:" "$BLUE"
    echo ""
    
    case $env in
        "development")
            echo "   🌐 Frontend URL: http://localhost:3000"
            echo "   🖥️  Backend URL: http://localhost:5000"
            echo "   🗄️  Database: buyandhold_dev (localhost)"
            echo "   🔐 JWT: Chave de desenvolvimento"
            echo "   💳 Pagamentos: Modo teste"
            echo "   🐛 Debug: Habilitado"
            echo "   📊 Logs: Debug level"
            ;;
        "production")
            echo "   🌐 Frontend URL: https://buyandhold.vargascode.com.br"
            echo "   🖥️  Backend URL: https://buyandhold.vargascode.com.br/api"
            echo "   🗄️  Database: Configuração de produção"
            echo "   🔐 JWT: Chave de produção (variável de ambiente)"
            echo "   💳 Pagamentos: Modo produção"
            echo "   🐛 Debug: Desabilitado"
            echo "   📊 Logs: Info level"
            echo "   🔒 SSL: Habilitado"
            ;;
        "test")
            echo "   🌐 Frontend URL: http://localhost:3000"
            echo "   🖥️  Backend URL: http://localhost:5001"
            echo "   🗄️  Database: buyandhold_test (localhost)"
            echo "   🔐 JWT: Chave de teste (1h)"
            echo "   💳 Pagamentos: Modo teste"
            echo "   🐛 Debug: Habilitado"
            echo "   📊 Logs: Error level"
            ;;
    esac
    
    echo ""
    color_echo "💡 Dica: Reinicie os serviços para aplicar as mudanças" "$YELLOW"
    
    if [ "$env" = "production" ]; then
        echo ""
        color_echo "⚠️  ATENÇÃO - Ambiente de Produção:" "$RED"
        echo "   • Certifique-se de que todas as variáveis de ambiente estão configuradas"
        echo "   • Verifique as configurações de SSL"
        echo "   • Confirme as credenciais do banco de dados"
        echo "   • Valide as chaves de pagamento (PIX e Mercado Pago)"
    fi
}

# Função principal para configurar ambiente
set_environment() {
    local env=$1
    
    color_echo "🔄 Alternando para ambiente: $env" "$BLUE"
    echo ""
    
    # Definir variável NODE_ENV
    export NODE_ENV=$env
    
    # Frontend
    color_echo "📱 Configurando Frontend..." "$YELLOW"
    
    # Criar/atualizar .env do frontend
    cat > "saas-buyandhold-frontend/.env" << EOF
# Ambiente atual: $env
NODE_ENV=$env

# Esta configuração será automaticamente detectada pelo sistema
# Não é necessário alterar outras variáveis manualmente

# As configurações específicas do ambiente são carregadas automaticamente de:
# - src/config/environment.js (frontend)
# - config/environment.js (backend)
EOF
    
    color_echo "   ✅ Frontend configurado para $env" "$GREEN"
    
    # Backend
    color_echo "🖥️  Configurando Backend..." "$YELLOW"
    
    # Criar/atualizar .env do backend
    cat > "saas-buyandhold-backend/.env" << EOF
# Ambiente atual: $env
NODE_ENV=$env

# Esta configuração será automaticamente detectada pelo sistema
# Não é necessário alterar outras variáveis manualmente

# As configurações específicas do ambiente são carregadas automaticamente de:
# - config/environment.js

# Para produção, certifique-se de que as seguintes variáveis estão definidas no sistema:
# DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
# JWT_SECRET, SESSION_SECRET
# PIX_KEY, PIX_BANK_CODE
# MERCADO_PAGO_ACCESS_TOKEN, MERCADO_PAGO_PUBLIC_KEY
# SSL_KEY_PATH, SSL_CERT_PATH (se SSL habilitado)
EOF
    
    color_echo "   ✅ Backend configurado para $env" "$GREEN"
    
    echo ""
    color_echo "🎉 Ambiente alterado com sucesso para: $env" "$GREEN"
    echo ""
    
    # Mostrar configurações ativas
    show_active_configuration $env
}

# Verificar argumentos
if [ $# -eq 0 ]; then
    color_echo "❌ Erro: Especifique o ambiente" "$RED"
    echo ""
    show_help
    exit 1
fi

# Validar ambiente
case $1 in
    "development"|"production"|"test")
        ENVIRONMENT=$1
        ;;
    "help"|"--help"|"h")
        show_help
        exit 0
        ;;
    *)
        color_echo "❌ Erro: Ambiente inválido '$1'" "$RED"
        echo "   Ambientes válidos: development, production, test"
        echo ""
        show_help
        exit 1
        ;;
esac

# Verificar se estamos no diretório correto
if [ ! -d "saas-buyandhold-frontend" ] || [ ! -d "saas-buyandhold-backend" ]; then
    color_echo "❌ Erro: Execute este script no diretório raiz do projeto" "$RED"
    echo "   Certifique-se de que os diretórios 'saas-buyandhold-frontend' e 'saas-buyandhold-backend' existem"
    exit 1
fi

# Executar configuração
set_environment $ENVIRONMENT

echo ""
color_echo "✨ Configuração concluída! Ambiente: $ENVIRONMENT" "$GREEN"