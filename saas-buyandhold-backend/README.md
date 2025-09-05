# SaaS Buy & Hold - Backend API

Backend da aplicação SaaS para sugestões de investimento Buy & Hold. Desenvolvido em Node.js com Express, PostgreSQL e Sequelize.

## 🚀 Funcionalidades

- **Autenticação JWT** completa (registro, login, proteção de rotas)
- **Gestão de Carteiras** (CRUD completo)
- **Gestão de Ativos** (ações e FIIs com target allocation)
- **Calculadora de Investimentos** (sugestões inteligentes baseadas em rebalanceamento)
- **Sistema de Planos** (Free vs Premium)
- **Validação robusta** de dados de entrada
- **Logs estruturados** com Winston

## 📋 Pré-requisitos

- **Node.js** 16+ 
- **PostgreSQL** 12+
- **npm** ou **yarn**

## 🛠️ Instalação

### 1. Clone e instale dependências

```bash
cd saas-buyandhold-backend
npm install
```

### 2. Configuração do Banco de Dados

Crie um banco PostgreSQL:

```sql
CREATE DATABASE saas_buyandhold;
CREATE USER buyandhold_user WITH PASSWORD 'sua_senha';
GRANT ALL PRIVILEGES ON DATABASE saas_buyandhold TO buyandhold_user;
```

### 3. Variáveis de Ambiente

Copie o arquivo de exemplo e configure:

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=saas_buyandhold
DB_USER=buyandhold_user
DB_PASSWORD=sua_senha

# JWT Secret (gere uma chave forte)
JWT_SECRET=sua_chave_jwt_super_secreta_aqui

# Server
PORT=5000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:3000
```

### 4. Executar a aplicação

```bash
# Desenvolvimento (com auto-reload)
npm run dev

# Produção
npm start
```

A API estará disponível em: `http://localhost:5000`

## 📚 Endpoints da API

### Autenticação (`/api/auth`)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/register` | Registrar usuário | ❌ |
| POST | `/login` | Login | ❌ |
| GET | `/profile` | Perfil do usuário | ✅ |

**Exemplo - Registro:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@email.com",
    "password": "senha123"
  }'
```

**Exemplo - Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@email.com",
    "password": "senha123"
  }'
```

### Carteiras (`/api/portfolios`)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/` | Listar carteiras | ✅ |
| POST | `/` | Criar carteira | ✅ |
| GET | `/:id` | Buscar carteira | ✅ |
| PUT | `/:id` | Atualizar carteira | ✅ |
| DELETE | `/:id` | Deletar carteira | ✅ |

**Exemplo - Criar Carteira:**
```bash
curl -X POST http://localhost:5000/api/portfolios \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "name": "Minha Carteira Conservadora",
    "stocksPercentage": 40,
    "reitsPercentage": 60
  }'
```

### Ativos (`/api/assets`)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/portfolio/:portfolioId` | Listar ativos da carteira | ✅ |
| POST | `/portfolio/:portfolioId` | Adicionar ativo | ✅ |
| PUT | `/:id` | Atualizar ativo | ✅ |
| DELETE | `/:id` | Remover ativo | ✅ |

**Exemplo - Adicionar Ativo:**
```bash
curl -X POST http://localhost:5000/api/assets/portfolio/PORTFOLIO_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "ticker": "PETR4",
    "name": "Petrobras",
    "type": "stock",
    "quantity": 100,
    "price": 36.50,
    "targetAllocation": 50
  }'
```

### Investimentos (`/api/investments`)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/calculate` | Calcular sugestões | ✅ |
| POST | `/execute` | Executar investimento | ✅ |

**Exemplo - Calcular Sugestões:**
```bash
curl -X POST http://localhost:5000/api/investments/calculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "portfolioId": "PORTFOLIO_ID",
    "investmentAmount": 1000
  }'
```

## 🗃️ Modelos de Dados

### User
```javascript
{
  id: UUID,
  email: String (unique),
  password: String (hashed),
  name: String,
  planType: 'free' | 'premium',
  subscriptionStatus: 'active' | 'cancelled' | 'expired',
  lastLoginAt: Date
}
```

### Portfolio
```javascript
{
  id: UUID,
  userId: UUID,
  name: String,
  isDefault: Boolean,
  stocksPercentage: Decimal (0-100),
  reitsPercentage: Decimal (0-100),
  totalValue: Decimal
}
```

### Asset
```javascript
{
  id: UUID,
  portfolioId: UUID,
  ticker: String,
  name: String,
  type: 'stock' | 'reit',
  quantity: Integer,
  price: Decimal,
  targetAllocation: Decimal (0-100)
}
```

## 🧮 Lógica do Calculador de Investimentos

O sistema utiliza uma lógica sofisticada para sugerir investimentos:

### 1. **Análise de Déficit por Categoria**
- Compara distribuição atual vs desejada (ações/FIIs)
- Calcula déficit em cada categoria

### 2. **Alocação de Valor**
- Prioriza categorias com maior déficit
- Distribui valor proporcionalmente aos déficits

### 3. **Sugestões por Ativo**
- Dentro de cada categoria, prioriza ativos com maior déficit
- Considera `targetAllocation` de cada ativo
- Sugere quantidades baseadas no déficit individual

### 4. **Validação**
- Verifica se sugestões não excedem valor disponível
- Calcula valor restante após sugestões

## 🔐 Autenticação

O sistema utiliza **JWT (JSON Web Tokens)** para autenticação:

1. **Login** retorna um token válido por 7 dias
2. **Token** deve ser enviado no header: `Authorization: Bearer TOKEN`
3. **Middleware** `authenticate` protege rotas privadas
4. **Middleware** `requirePremium` restringe recursos premium

## 📊 Sistema de Planos

### Free
- ✅ Calculadora de investimentos
- ✅ Uma carteira
- ❌ Salvamento limitado
- ❌ Múltiplas carteiras

### Premium
- ✅ Todas as funcionalidades Free
- ✅ Carteiras ilimitadas
- ✅ Salvamento completo
- ✅ Recursos avançados

## 🛡️ Segurança

- **Senhas**: Hash bcrypt com salt 12
- **JWT**: Tokens assinados com chave secreta
- **Validação**: Joi para validação de entrada
- **Headers**: Helmet.js para headers de segurança
- **CORS**: Configurado para frontend específico

## 📝 Logs

O sistema utiliza Winston para logs estruturados:

- **Console**: Em desenvolvimento
- **Arquivos**: `logs/error.log` e `logs/combined.log`
- **Rotação**: Máximo 5MB por arquivo, 5 arquivos
- **Levels**: error, warn, info, debug

## 🧪 Testando a API

### Health Check
```bash
curl http://localhost:5000/health
```

### Fluxo Completo
```bash
# 1. Registrar usuário
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"123456"}'

# 2. Fazer login (salve o token retornado)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'

# 3. Criar carteira
curl -X POST http://localhost:5000/api/portfolios \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"name":"Test Portfolio","stocksPercentage":70,"reitsPercentage":30}'

# 4. Adicionar ativos
curl -X POST http://localhost:5000/api/assets/portfolio/PORTFOLIO_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"ticker":"PETR4","name":"Petrobras","type":"stock","quantity":100,"price":36.50,"targetAllocation":50}'

# 5. Calcular investimento
curl -X POST http://localhost:5000/api/investments/calculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"portfolioId":"PORTFOLIO_ID","investmentAmount":1000}'
```

## 🔧 Scripts de Deploy e Ambiente

O backend inclui suporte para diferentes ambientes através de scripts automatizados:

### 📋 Configuração de Ambientes

| Ambiente | Arquivo | Descrição |
|----------|---------|----------|
| Development | `.env` | Configurações locais (padrão) |
| Production | `.env.production` | Configurações de produção |
| Test | Criado dinamicamente | Configurações de teste |

### 🔄 Alternando Ambientes

Use o script `switch-environment.sh` na raiz do projeto:

```bash
# Voltar para desenvolvimento
../switch-environment.sh development

# Alternar para produção (para testes locais)
../switch-environment.sh production

# Modo teste
../switch-environment.sh test
```

**O que acontece no backend**:
- ✅ Arquivo `.env` é atualizado
- ✅ Configurações de banco são ajustadas
- ✅ URLs e CORS são configurados
- ✅ Níveis de log são definidos
- ✅ Modo SSL é configurado

### 🚀 Deploy para Produção

Use o script `deploy-production.sh` na raiz do projeto:

```bash
# Preparar para deploy
../script-deploy-production.sh
```

**Processo do backend**:
1. 📦 Instala dependências: `npm install`
2. ⚙️ Copia configurações de produção
3. 🔍 Valida estrutura do projeto
4. 📋 Lista próximos passos

### ⚠️ Variáveis de Ambiente Obrigatórias

**Para produção, configure no servidor**:

```bash
# Banco de dados
export DB_HOST="seu_host_postgres"
export DB_PORT="5432"
export DB_NAME="buyandhold_prod"
export DB_USER="buyandhold_user"
export DB_PASSWORD="senha_super_segura"

# Segurança
export JWT_SECRET="chave_jwt_super_secreta_256_bits"
export SESSION_SECRET="chave_sessao_super_secreta"

# URLs
export FRONTEND_URL="https://buyandhold.vargascode.com.br"
export BACKEND_URL="https://buyandhold.vargascode.com.br/api"

# Pagamentos
export PIX_KEY="sua_chave_pix_real"
export MERCADO_PAGO_ACCESS_TOKEN="PROD-sua_chave_real"
export MERCADO_PAGO_PUBLIC_KEY="PROD-sua_chave_publica_real"

# SSL (opcional)
export SSL_ENABLED="true"
export SSL_KEY_PATH="/path/to/private.key"
export SSL_CERT_PATH="/path/to/certificate.crt"

# Logs
export LOG_LEVEL="info"
export LOG_FILE="/var/log/buyandhold/app.log"
```

### 🖥️ Configuração do Servidor

**1. Copiar arquivos**:
```bash
# Copiar backend para servidor
scp -r saas-buyandhold-backend/ user@servidor:/opt/buyandhold/
```

**2. Instalar dependências no servidor**:
```bash
ssh user@servidor
cd /opt/buyandhold
npm install --production
```

**3. Configurar processo (PM2)**:
```bash
# Instalar PM2
npm install -g pm2

# Criar arquivo ecosystem.config.js
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'buyandhold-api',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
EOF

# Iniciar aplicação
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**4. Configurar proxy reverso (Nginx)**:
```nginx
server {
    listen 80;
    server_name buyandhold.vargascode.com.br;
    
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 🔍 Verificação Pós-Deploy

```bash
# Testar API
curl https://buyandhold.vargascode.com.br/api/health

# Verificar logs
pm2 logs buyandhold-api

# Status da aplicação
pm2 status

# Monitoramento
pm2 monit
```

## 🐛 Troubleshooting

### Erro de Conexão com Banco
- Verifique se PostgreSQL está rodando
- Confirme credenciais no `.env`
- Teste conexão: `psql -h localhost -U buyandhold_user -d saas_buyandhold`

### Erro de JWT
- Verifique se `JWT_SECRET` está definido no `.env`
- Confirme se token está sendo enviado corretamente

### Erro de CORS
- Verifique `FRONTEND_URL` no `.env`
- Confirme se frontend está rodando na URL especificada

## 📦 Scripts Disponíveis

```bash
npm start          # Produção
npm run dev        # Desenvolvimento com nodemon
npm run migrate    # Executar migrações (futuro)
npm test          # Executar testes (futuro)
```

## 🏗️ Estrutura do Projeto

```
saas-buyandhold-backend/
├── src/
│   ├── middleware/     # Middlewares (auth, validation)
│   ├── models/         # Modelos Sequelize
│   ├── routes/         # Rotas da API
│   ├── services/       # Lógica de negócio
│   └── utils/          # Utilitários (logger)
├── logs/              # Arquivos de log
├── server.js          # Entrada principal
├── package.json       # Dependências
└── .env.example       # Exemplo de configuração
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Commit: `git commit -m 'Add nova feature'`
4. Push: `git push origin feature/nova-feature`
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob licença MIT. Veja o arquivo LICENSE para mais detalhes.
