# ================================
# Dockerfile Otimizado - Frontend React
# SaaS Buy & Hold - Interface Web
# ================================

# ================================
# Stage 1: Build da aplicação React
# ================================
FROM node:18-alpine AS builder

# Definir variáveis de ambiente para build
ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false
ENV NPM_CONFIG_CACHE=/tmp/.npm

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências primeiro (para cache do Docker)
COPY package*.json ./

# Instalar dependências otimizado
RUN npm install --production --no-audit --no-fund && \
    npm cache clean --force

# Copiar código fonte
COPY . .

# Build stage
FROM node:18-alpine AS build

ENV NODE_ENV=production \
    GENERATE_SOURCEMAP=false \
    NPM_CONFIG_PRODUCTION=false

# Argumentos de build para variáveis do CRA
ARG REACT_APP_API_URL=/api
ARG REACT_APP_DOMAIN=localhost
ARG REACT_APP_PROFILE=production
ARG REACT_APP_EMAILJS_SERVICE_ID
ARG REACT_APP_EMAILJS_TEMPLATE_ID
ARG REACT_APP_EMAILJS_PASSWORD_TEMPLATE_ID
ARG REACT_APP_EMAILJS_PUBLIC_KEY

# Exporta os argumentos como variáveis de ambiente para o build do CRA
ENV REACT_APP_API_URL=$REACT_APP_API_URL \
    REACT_APP_DOMAIN=$REACT_APP_DOMAIN \
    REACT_APP_PROFILE=$REACT_APP_PROFILE \
    REACT_APP_EMAILJS_SERVICE_ID=$REACT_APP_EMAILJS_SERVICE_ID \
    REACT_APP_EMAILJS_TEMPLATE_ID=$REACT_APP_EMAILJS_TEMPLATE_ID \
    REACT_APP_EMAILJS_PASSWORD_TEMPLATE_ID=$REACT_APP_EMAILJS_PASSWORD_TEMPLATE_ID \
    REACT_APP_EMAILJS_PUBLIC_KEY=$REACT_APP_EMAILJS_PUBLIC_KEY

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund

COPY . .

RUN npm run build

# Runtime stage (Nginx)
FROM nginx:1.25-alpine AS runtime

# Copia build do React para o Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copia configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Healthcheck básico
HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]