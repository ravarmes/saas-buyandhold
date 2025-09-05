# ================================
# Dockerfile para Frontend React
# SaaS Buy & Hold - Interface Web
# ================================

# ================================
# Stage 1: Build da aplicação React
# ================================
FROM node:18-alpine AS builder

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
    RUN npm install --silent

# Copiar código fonte
COPY . .

# Definir variáveis de ambiente para build
ARG REACT_APP_API_URL=http://localhost:5000/api
ARG REACT_APP_DOMAIN=localhost
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_DOMAIN=$REACT_APP_DOMAIN
ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false

# Build da aplicação
RUN npm run build

# ================================
# Stage 2: Servidor Nginx
# ================================
FROM nginx:alpine AS runner

# Instalar curl para health checks
RUN apk add --no-cache curl

# Remover configuração padrão do nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiar configuração customizada do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar arquivos buildados do React
COPY --from=builder /app/build /usr/share/nginx/html

# Criar usuário não-root
RUN addgroup -g 1001 -S nginx-user
RUN adduser -S frontend -u 1001 -G nginx-user

# Ajustar permissões
RUN chown -R frontend:nginx-user /usr/share/nginx/html
RUN chown -R frontend:nginx-user /var/cache/nginx
RUN chown -R frontend:nginx-user /var/log/nginx
RUN chown -R frontend:nginx-user /etc/nginx/conf.d
RUN touch /var/run/nginx.pid
RUN chown -R frontend:nginx-user /var/run/nginx.pid

# Expor porta
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Iniciar nginx
CMD ["nginx", "-g", "daemon off;"]