# ================================
# Dockerfile para Backend Node.js
# SaaS Buy & Hold - API Backend
# ================================

# Usar imagem oficial do Node.js LTS (Alpine para menor tamanho)
FROM node:18-alpine AS base

# Instalar dependências do sistema necessárias para PostgreSQL e bcrypt
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    postgresql-client

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001

# ================================
# Stage 1: Dependências
# ================================
FROM base AS deps

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências de produção e desenvolvimento
    RUN npm install

# ================================
# Stage 2: Build (se necessário)
# ================================
FROM base AS builder

WORKDIR /app

# Copiar dependências do stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Remover dependências de desenvolvimento
RUN npm prune --production

# ================================
# Stage 3: Runtime
# ================================
FROM base AS runner

# Definir variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=5000

# Criar diretório da aplicação
WORKDIR /app

# Criar diretórios necessários
RUN mkdir -p logs && chown -R backend:nodejs logs

# Copiar dependências de produção
COPY --from=builder --chown=backend:nodejs /app/node_modules ./node_modules

# Copiar código da aplicação
COPY --chown=backend:nodejs . .

# Remover arquivos desnecessários
RUN rm -rf .env.example .env.production README.md

# Mudar para usuário não-root
USER backend

# Expor porta
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const port = process.env.PORT || 5000; require('http').get('http://localhost:' + port + '/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando para iniciar a aplicação
CMD ["npm", "start"]