# 🐳 Guia Completo Docker - SaaS Buy & Hold

Este guia contém todas as informações necessárias para executar a aplicação usando Docker.

## 📋 Pré-requisitos

### 1. Instalar Docker Desktop

**Windows:**
1. Baixe o Docker Desktop em: https://www.docker.com/products/docker-desktop/
2. Execute o instalador como administrador
3. Reinicie o computador quando solicitado
4. Abra o Docker Desktop e aguarde a inicialização completa

**Verificar Instalação:**
```cmd
docker --version
docker-compose --version
```

### 2. Configurar Recursos (Recomendado)

No Docker Desktop, vá em Settings > Resources:
- **CPU**: Mínimo 2 cores
- **Memory**: Mínimo 4GB
- **Disk**: Mínimo 20GB livres

## 🚀 Execução Rápida

### Método 1: Scripts Automatizados (Windows)

```cmd
# 1. Iniciar aplicação completa
docker-start.bat

# 2. Visualizar logs
docker-logs.bat

# 3. Parar aplicação
docker-stop.bat
```

### Método 2: Comandos Manuais

```bash
# 1. Configurar ambiente
cp .env.docker .env

# 2. Construir e iniciar
docker-compose up --build -d

# 3. Verificar status
docker-compose ps

# 4. Ver logs
docker-compose logs -f

# 5. Parar
docker-compose down
```

## 🌐 URLs de Acesso

Após iniciar com sucesso:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check Backend**: http://localhost:5000/health
- **Banco PostgreSQL**: localhost:5432

## 🔧 Configuração Avançada

### Variáveis de Ambiente

Edite o arquivo `.env` para personalizar:

```env
# Portas dos serviços
FRONTEND_PORT=3000
BACKEND_PORT=5000
DB_PORT=5432

# Banco de dados
DB_NAME=saas_buyandhold
DB_USER=postgres
DB_PASSWORD=postgres123

# URLs
REACT_APP_API_URL=http://localhost:5000/api
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

# Segurança (ALTERE EM PRODUÇÃO!)
JWT_SECRET=your_super_secret_jwt_key_change_in_production_docker
SESSION_SECRET=your_super_secret_session_key_docker
```

### Comandos Úteis de Desenvolvimento

```bash
# Reconstruir apenas um serviço
docker-compose build backend
docker-compose up -d backend

# Executar comandos no container
docker-compose exec backend npm run migrate
docker-compose exec backend npm install nova-dependencia

# Acessar shell do container
docker-compose exec backend sh
docker-compose exec database psql -U postgres -d saas_buyandhold

# Backup do banco
docker-compose exec database pg_dump -U postgres saas_buyandhold > backup.sql

# Restaurar backup
docker-compose exec -T database psql -U postgres saas_buyandhold < backup.sql
```

## 🛠️ Troubleshooting

### Problema: "Docker Desktop não está rodando"

**Solução:**
1. Abra o Docker Desktop
2. Aguarde aparecer "Engine running" na interface
3. Execute o comando novamente

### Problema: "Porta já em uso"

**Verificar processos:**
```cmd
netstat -ano | findstr :3000
netstat -ano | findstr :5000
```

**Matar processo:**
```cmd
taskkill /PID <numero_do_pid> /F
```

**Ou alterar portas no .env:**
```env
FRONTEND_PORT=3001
BACKEND_PORT=5001
```

### Problema: "Erro de build"

**Limpar cache:**
```bash
# Parar tudo
docker-compose down

# Limpar cache
docker system prune -a

# Rebuild completo
docker-compose build --no-cache
docker-compose up -d
```

### Problema: "Erro de conexão com banco"

**Verificar logs:**
```bash
docker-compose logs database
```

**Reiniciar banco:**
```bash
docker-compose restart database
```

**Recriar volumes (CUIDADO: apaga dados):**
```bash
docker-compose down -v
docker-compose up --build -d
```

### Problema: "Containers não iniciam"

**Verificar recursos:**
1. Docker Desktop > Settings > Resources
2. Aumentar Memory para 4GB+
3. Verificar espaço em disco

**Verificar logs detalhados:**
```bash
docker-compose logs --tail=50
```

### Problema: "Frontend não carrega"

**Verificar build:**
```bash
docker-compose logs frontend
```

**Reconstruir frontend:**
```bash
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

## 📊 Monitoramento

### Status dos Containers
```bash
# Status geral
docker-compose ps

# Uso de recursos
docker stats

# Health checks
docker-compose exec backend curl http://localhost:5000/health
docker-compose exec frontend curl http://localhost/
```

### Logs em Tempo Real
```bash
# Todos os serviços
docker-compose logs -f

# Serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database
```

## 🏭 Produção

### Deploy em Produção

1. **Configurar variáveis de produção:**
```env
NODE_ENV=production
JWT_SECRET=chave_super_segura_producao
SESSION_SECRET=chave_sessao_super_segura
DB_PASSWORD=senha_muito_forte_producao
```

2. **Build otimizado:**
```bash
docker-compose build --no-cache
docker-compose up -d
```

3. **Configurar proxy reverso (Nginx/Apache)**
4. **Configurar SSL/HTTPS**
5. **Configurar backup automático do banco**

### Backup e Restore

**Backup automático:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T database pg_dump -U postgres saas_buyandhold > "backup_${DATE}.sql"
```

**Restore:**
```bash
docker-compose exec -T database psql -U postgres saas_buyandhold < backup_20240101_120000.sql
```

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs: `docker-compose logs`
2. Consulte este guia de troubleshooting
3. Verifique se o Docker Desktop está atualizado
4. Reinicie o Docker Desktop se necessário

---

**Dica:** Mantenha o Docker Desktop sempre atualizado para melhor performance e compatibilidade.