# ================================
# Dockerfile Otimizado - Backend Node.js
# SaaS Buy & Hold - API Backend
# ================================

# Usar imagem oficial do Node.js LTS Alpine (menor tamanho)
FROM node:18-alpine

# Definir variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=5000
ENV NPM_CONFIG_CACHE=/tmp/.npm

# Instalar apenas dependências essenciais do sistema
RUN apk add --no-cache \
    postgresql-client \
    curl \
    && rm -rf /var/cache/apk/*

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001 -G nodejs

# Criar diretório da aplicação
WORKDIR /app

# Copiar arquivos de dependências primeiro (para cache do Docker)
COPY package*.json ./

# Instalar apenas dependências de produção
RUN npm install --production --no-audit --no-fund && \
    npm cache clean --force

# Copiar código da aplicação
COPY . .

# Criar diretórios necessários e ajustar permissões
RUN mkdir -p logs && \
    chown -R backend:nodejs /app

# Remover arquivos desnecessários para reduzir tamanho
RUN rm -rf \
    .env.example \
    .env.production \
    README.md \
    .dockerignore \
    Dockerfile \
    /tmp/* \
    /var/tmp/*

# Mudar para usuário não-root
USER backend

# Expor porta
EXPOSE 5000

# Health check otimizado
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Comando para iniciar a aplicação
CMD ["node", "server.js"]