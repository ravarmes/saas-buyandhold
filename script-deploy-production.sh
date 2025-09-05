#!/bin/bash

# Script de Deploy para Produção - Buy & Hold
# Subdomínio: buyandhold.vargascode.com.br

echo "🚀 Iniciando deploy para produção..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ] && [ ! -d "saas-buyandhold-frontend" ]; then
    log_error "Execute este script no diretório raiz do projeto"
    exit 1
fi

# 1. Backup dos arquivos .env atuais
log_info "Fazendo backup dos arquivos .env atuais..."
mkdir -p backups/$(date +%Y%m%d_%H%M%S)
cp saas-buyandhold-frontend/.env backups/$(date +%Y%m%d_%H%M%S)/frontend.env.backup 2>/dev/null || true
cp saas-buyandhold-backend/.env backups/$(date +%Y%m%d_%H%M%S)/backend.env.backup 2>/dev/null || true

# 2. Copiar arquivos de produção
log_info "Configurando arquivos de ambiente para produção..."
cp saas-buyandhold-frontend/.env.production saas-buyandhold-frontend/.env
cp saas-buyandhold-backend/.env.production saas-buyandhold-backend/.env

# 3. Instalar dependências do frontend
log_info "Instalando dependências do frontend..."
cd saas-buyandhold-frontend
npm install
if [ $? -ne 0 ]; then
    log_error "Falha ao instalar dependências do frontend"
    exit 1
fi

# 4. Build do frontend
log_info "Gerando build de produção do frontend..."
npm run build
if [ $? -ne 0 ]; then
    log_error "Falha ao gerar build do frontend"
    exit 1
fi

cd ..

# 5. Instalar dependências do backend
log_info "Instalando dependências do backend..."
cd saas-buyandhold-backend
npm install
if [ $? -ne 0 ]; then
    log_error "Falha ao instalar dependências do backend"
    exit 1
fi

cd ..

# 6. Verificar configurações
log_info "Verificando configurações..."
echo "Frontend build: $(ls -la saas-buyandhold-frontend/build 2>/dev/null | wc -l) arquivos"
echo "Backend: $(ls -la saas-buyandhold-backend/src 2>/dev/null | wc -l) arquivos"

# 7. Instruções finais
log_info "Deploy preparado com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Copie a pasta 'saas-buyandhold-frontend/build' para seu servidor web"
echo "2. Configure o Nginx/Apache conforme documentação"
echo "3. Copie a pasta 'saas-buyandhold-backend' para seu servidor"
echo "4. Configure as variáveis de ambiente de produção"
echo "5. Inicie o servidor backend: npm start"
echo "6. Configure SSL/HTTPS"
echo "7. Teste o subdomínio: https://buyandhold.vargascode.com.br"
echo ""
log_warning "Lembre-se de configurar:"
echo "- DNS para o subdomínio"
echo "- Certificado SSL"
echo "- Banco de dados de produção"
echo "- Chaves de API do Mercado Pago (produção)"
echo "- Configurações de email"
echo ""
log_info "Deploy concluído! 🎉"