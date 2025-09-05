# SaaS Buy & Hold - Sistema Completo

Sistema SaaS para sugestões inteligentes de investimento seguindo a estratégia Buy & Hold. Composto por backend em Node.js e frontend em React.js.

## 🎯 Visão Geral

Este projeto transforma a aplicação original de sugestões de investimento em um **SaaS completo** com:

- **Backend robusto** em Node.js + Express + PostgreSQL
- **Frontend moderno** em React.js + Tailwind CSS
- **Sistema de autenticação** JWT completo
- **Planos diferenciados** (Free vs Premium)
- **Lógica de negócio avançada** para cálculo de investimentos

## 🏗️ Arquitetura do Sistema

```
saas-buyandhold/
├── saas-buyandhold-backend/    # API Node.js
│   ├── src/
│   │   ├── models/            # Modelos Sequelize
│   │   ├── routes/            # Endpoints da API
│   │   ├── services/          # Lógica de negócio
│   │   ├── middleware/        # Autenticação e validação
│   │   └── utils/             # Utilitários
│   ├── server.js              # Entrada principal
│   └── README.md
│
└── saas-buyandhold-frontend/   # Interface React
    ├── src/
    │   ├── components/        # Componentes reutilizáveis
    │   ├── contexts/          # Estados globais
    │   ├── pages/             # Páginas da aplicação
    │   └── App.js
    ├── public/
    └── README.md
```

## 🚀 Funcionalidades Principais

### ✅ Sistema de Usuários
- Registro e login com JWT
- Perfis de usuário com planos (Free/Premium)
- Proteção de rotas e recursos

### ✅ Gestão de Carteiras
- **Free**: Uma carteira temporária
- **Premium**: Carteiras ilimitadas e persistentes
- CRUD completo de carteiras

### ✅ Gestão de Ativos
- Adicionar ações e FIIs à carteira
- Definir percentuais ideais por ativo
- Configurar distribuição entre ações/FIIs
- Atualização de preços e quantidades

### ✅ Calculadora Inteligente
- Análise de déficit por categoria (ações vs FIIs)
- Sugestões baseadas em target allocation
- Rebalanceamento automático da carteira
- Validação de investimentos

### ✅ Interface Responsiva
- Design moderno com Tailwind CSS
- Experiência otimizada mobile/desktop
- Componentes reutilizáveis

### ✅ Sistema de Monetização
- **Google AdSense** integrado para usuários gratuitos
- Anúncios estratégicos em páginas principais
- Experiência premium sem anúncios
- Controle inteligente de exibição por plano

### ✅ Conformidade Legal
- **Política de Privacidade** completa
- **Banner de Cookies** (LGPD/GDPR)
- Consentimento de usuário para cookies
- Transparência no uso de dados

## 🎮 Como Usar

### 1. **Setup do Backend**

```bash
cd saas-buyandhold-backend

# Instalar dependências
npm install

# Configurar banco de dados PostgreSQL
# Editar .env com suas credenciais

# Iniciar servidor
npm run dev
```

Backend estará em: `http://localhost:5000`

### 2. **Setup do Frontend**

```bash
cd saas-buyandhold-frontend

# Instalar dependências
npm install

# Configurar API URL no .env

# Iniciar aplicação
npm start
```

Frontend estará em: `http://localhost:3000`

### 3. **Testar a Aplicação**

1. **Acesse** `http://localhost:3000`
2. **Registre** uma nova conta
3. **Adicione ativos** à sua carteira
4. **Configure percentuais** ideais
5. **Calculate sugestões** de investimento

## 💡 Fluxo de Uso

### Para Usuários Free
1. Registro rápido e gratuito
2. Carteira temporária (não persistente)
3. Acesso completo à calculadora
4. Prompts para upgrade durante o uso

### Para Usuários Premium
1. Todas as funcionalidades Free
2. Carteiras ilimitadas e persistentes
3. Salvamento automático
4. Histórico de investimentos (futuro)

## 🗄️ Modelos de Dados

### User
- `id`, `email`, `password`, `name`
- `planType` (free/premium)
- `subscriptionStatus`

### Portfolio
- `id`, `userId`, `name`
- `stocksPercentage`, `reitsPercentage`
- `totalValue`, `isDefault`

### Asset
- `id`, `portfolioId`, `ticker`, `name`
- `type` (stock/reit), `quantity`, `price`
- `targetAllocation` (percentual desejado)

## 🧮 Lógica do Calculador

### 1. Análise de Distribuição
```javascript
// Exemplo: Carteira atual vs ideal
Atual:  Ações 40% | FIIs 60%
Ideal:  Ações 70% | FIIs 30%
Déficit: Ações +30% | FIIs -30%
```

### 2. Alocação de Investimento
```javascript
// Valor disponível: R$ 1.000
// Priorizar ações (maior déficit)
Sugestão: R$ 800 em ações + R$ 200 em FIIs
```

### 3. Seleção de Ativos
```javascript
// Dentro de ações, priorizar por target allocation
PETR4: Target 50%, Atual 20% → MAIOR PRIORIDADE
ITUB4: Target 30%, Atual 25% → menor prioridade
```

## 🔧 Tecnologias Utilizadas

### Backend
- **Node.js** + Express
- **PostgreSQL** + Sequelize ORM
- **JWT** para autenticação
- **Bcrypt** para senhas
- **Winston** para logs
- **Joi** para validação

### Frontend
- **React.js** + Hooks
- **React Router** para roteamento
- **Context API** para estado global
- **Axios** para API calls
- **Tailwind CSS** para styling
- **Google AdSense** para monetização
- **Cookie Consent** para LGPD/GDPR

## 📊 Estrutura do Banco

```sql
-- Usuários
Users (id, email, password, name, planType, subscriptionStatus)

-- Carteiras
Portfolios (id, userId, name, stocksPercentage, reitsPercentage, totalValue)

-- Ativos
Assets (id, portfolioId, ticker, name, type, quantity, price, targetAllocation)

-- Relacionamentos
User 1:N Portfolio
Portfolio 1:N Asset
```

## 🎯 Diferenciais do Sistema

### 🔄 Lógica Migrada para Backend
- Toda lógica de negócio no servidor
- Frontend focado apenas na interface
- Maior segurança e controle

### 🎨 Interface Adaptativa
- Componentes condicionais por plano
- Prompts estratégicos de upgrade
- UX otimizada para conversão
- Sistema de anúncios não-intrusivo
- Layout responsivo com grid flexível

### 📱 Totalmente Responsivo
- Mobile-first design
- Funciona perfeitamente em qualquer dispositivo
- Menu adaptativo

### 🔐 Segurança Robusta
- Senhas com hash bcrypt
- JWT com expiração
- Validação rigorosa de inputs
- Proteção contra ataques comuns

### 📊 Conformidade e Privacidade
- Política de privacidade detalhada
- Gestão de consentimento de cookies
- Transparência no uso de dados
- Compliance com LGPD e GDPR

## 🚧 Próximos Passos

### Funcionalidades Futuras
- [ ] Histórico de investimentos
- [ ] Analytics avançados
- [ ] Integração com APIs de preços reais
- [ ] Notificações por email
- [ ] Dashboard administrativo
- [ ] Sistema de pagamentos (Stripe)
- [ ] Otimização de anúncios por performance
- [ ] A/B testing para conversão

### Melhorias Técnicas
- [ ] Testes automatizados
- [ ] Cache Redis
- [ ] Monitoramento de performance
- [ ] Deploy automatizado
- [ ] Documentação da API

## 📈 Potencial de Monetização

### Modelo Freemium
- **Usuários gratuitos**: Base para conversão + receita de anúncios
- **Funcionalidades limitadas**: Incentivam upgrade
- **Usuários premium**: R$ 29,90/mês (sem anúncios)
- **Dupla monetização**: Assinaturas + publicidade

### Projeções
- **100 usuários premium** = R$ 2.990/mês
- **500 usuários premium** = R$ 14.950/mês
- **1.000 usuários premium** = R$ 29.900/mês

## 🔧 Scripts de Deploy e Ambiente

O projeto inclui scripts automatizados para facilitar o gerenciamento de ambientes e deploy:

### 📋 Scripts Disponíveis

| Script | Descrição | Quando Usar |
|--------|-----------|-------------|
| `switch-environment.sh` | Alterna entre ambientes (dev/prod/test) | Durante desenvolvimento |
| `deploy-production.sh` | Prepara build para produção | Antes do deploy |
| `start-app.bat` / `start-app.ps1` | Inicia aplicação em desenvolvimento | Desenvolvimento local |

### 🔄 Switch Environment (`switch-environment.sh`)

**Finalidade**: Alterna rapidamente entre diferentes ambientes de configuração.

**Quando usar**:
- ✅ Testando configurações de produção localmente
- ✅ Alternando entre desenvolvimento e teste
- ✅ Verificando comportamento em diferentes ambientes
- ✅ Debugando problemas específicos de ambiente

**Como usar**:
```bash
# Alternar para desenvolvimento (padrão)
./switch-environment.sh development

# Alternar para produção
./switch-environment.sh production

# Alternar para teste
./switch-environment.sh test

# Ver ajuda
./switch-environment.sh help
```

**O que o script faz**:
1. 🔧 Atualiza arquivos `.env` do frontend e backend
2. 🌐 Configura URLs apropriadas para cada ambiente
3. 🗄️ Define configurações de banco de dados
4. 🔐 Ajusta configurações de segurança
5. 📊 Configura níveis de log
6. 💳 Define modo de pagamentos (teste/produção)

**Configurações por ambiente**:

| Configuração | Development | Production | Test |
|--------------|-------------|------------|---------|
| Frontend URL | `localhost:3000` | `buyandhold.vargascode.com.br` | `localhost:3000` |
| Backend URL | `localhost:5000` | `buyandhold.vargascode.com.br/api` | `localhost:5001` |
| Database | `buyandhold_dev` | Variáveis de ambiente | `buyandhold_test` |
| SSL | Desabilitado | Habilitado | Desabilitado |
| Debug | Habilitado | Desabilitado | Habilitado |
| Pagamentos | Modo teste | Modo produção | Modo teste |

### 🚀 Deploy Production (`deploy-production.sh`)

**Finalidade**: Prepara a aplicação para deploy em produção.

**Quando usar**:
- ✅ Antes de fazer deploy no servidor
- ✅ Criando build otimizado para produção
- ✅ Preparando arquivos para hospedagem
- ✅ Validando configurações de produção

**Pré-requisitos**:
1. 📝 Configurar `.env.production` com credenciais reais
2. 🗄️ Banco de dados de produção configurado
3. 🔐 Chaves de API do Mercado Pago (produção)
4. 📧 Configurações de email
5. 🌐 DNS e SSL configurados

**Como usar**:
```bash
# Executar deploy
./script-deploy-production.sh
```

**Passo a passo do script**:

1. **🔄 Backup**: Faz backup dos arquivos `.env` atuais
   ```bash
   # Cria pasta de backup com timestamp
   mkdir -p backups/20240115_143022
   cp saas-buyandhold-frontend/.env backups/20240115_143022/
   ```

2. **⚙️ Configuração**: Copia arquivos de produção
   ```bash
   cp saas-buyandhold-frontend/.env.production saas-buyandhold-frontend/.env
   cp saas-buyandhold-backend/.env.production saas-buyandhold-backend/.env
   ```

3. **📦 Frontend**: Instala dependências e gera build
   ```bash
   cd saas-buyandhold-frontend
   npm install
   npm run build  # Cria pasta 'build' otimizada
   ```

4. **🖥️ Backend**: Instala dependências
   ```bash
   cd saas-buyandhold-backend
   npm install
   ```

5. **✅ Verificação**: Valida arquivos gerados
   - Conta arquivos na pasta `build`
   - Verifica estrutura do backend

6. **📋 Instruções**: Mostra próximos passos
   - Como copiar arquivos para servidor
   - Configurações necessárias
   - Variáveis de ambiente obrigatórias

**Após executar o script**:

1. **📁 Copiar arquivos**:
   ```bash
   # Frontend (arquivos estáticos)
   scp -r saas-buyandhold-frontend/build/* user@servidor:/var/www/html/
   
   # Backend (aplicação Node.js)
   scp -r saas-buyandhold-backend/ user@servidor:/opt/buyandhold/
   ```

2. **🌐 Configurar servidor web** (Nginx/Apache)
3. **🗄️ Configurar banco de dados de produção**
4. **🔐 Definir variáveis de ambiente no servidor**
5. **🚀 Iniciar aplicação**: `npm start`
6. **🔒 Configurar SSL/HTTPS**
7. **🧪 Testar**: `https://buyandhold.vargascode.com.br`

### ⚠️ Variáveis de Ambiente Obrigatórias (Produção)

**Backend**:
```bash
# Banco de dados
DB_HOST=seu_host_postgres
DB_PORT=5432
DB_NAME=buyandhold_prod
DB_USER=buyandhold_user
DB_PASSWORD=senha_super_segura

# Segurança
JWT_SECRET=chave_jwt_super_secreta_256_bits
SESSION_SECRET=chave_sessao_super_secreta

# Pagamentos
PIX_KEY=sua_chave_pix_real
MERCADO_PAGO_ACCESS_TOKEN=PROD-sua_chave_real
MERCADO_PAGO_PUBLIC_KEY=PROD-sua_chave_publica_real

# SSL (se habilitado)
SSL_KEY_PATH=/path/to/private.key
SSL_CERT_PATH=/path/to/certificate.crt
```

**Frontend**:
```bash
# API
REACT_APP_API_URL=https://buyandhold.vargascode.com.br/api

# Domínio
REACT_APP_DOMAIN=buyandhold.vargascode.com.br

# EmailJS (opcional - já configurado no código)
REACT_APP_EMAILJS_SERVICE_ID=seu_service_id
REACT_APP_EMAILJS_PUBLIC_KEY=sua_public_key
```

### 🔍 Troubleshooting

**Problema**: Script não executa
```bash
# Dar permissão de execução
chmod +x script-switch-environment.sh
chmod +x script-deploy-production.sh
```

**Problema**: Erro de dependências
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

**Problema**: Build falha
```bash
# Verificar versão do Node.js
node --version  # Deve ser 16+
npm --version
```

**Problema**: Configurações não aplicam
```bash
# Reiniciar serviços após trocar ambiente
# Ctrl+C nos terminais e executar novamente
./start-app.bat
```

## 🐳 Docker - Configuração e Uso

### Pré-requisitos
- Docker Desktop instalado
- Docker Compose v2.0+
- Git para clonar o repositório

### Estrutura Docker
```
saas-buyandhold/
├── docker-compose.yml          # Orquestração dos serviços
├── .env.docker                 # Variáveis de ambiente (template)
├── saas-buyandhold-backend/
│   ├── Dockerfile             # Imagem do backend Node.js
│   ├── .dockerignore          # Arquivos ignorados no build
│   └── init-db.sql           # Script de inicialização do DB
└── saas-buyandhold-frontend/
    ├── Dockerfile             # Imagem do frontend React
    ├── .dockerignore          # Arquivos ignorados no build
    └── nginx.conf            # Configuração do Nginx
```

### 🚀 Comandos para Desenvolvimento

#### 1. Configuração Inicial
```bash
# Clonar o repositório
git clone <url-do-repositorio>
cd saas-buyandhold

# Copiar e configurar variáveis de ambiente
cp .env.docker .env
# Edite o arquivo .env com suas configurações
```

#### 2. Scripts Automatizados (Windows)
Para facilitar o uso no Windows, foram criados scripts batch:

```cmd
# Iniciar aplicação completa (build + start)
docker-start.bat

# Parar todos os containers
docker-stop.bat

# Visualizar logs
docker-logs.bat                # Todos os logs
docker-logs.bat frontend       # Logs do frontend
docker-logs.bat backend        # Logs do backend
docker-logs.bat database       # Logs do database
```

#### 3. Executar em Desenvolvimento (Manual)
```bash
# Construir e iniciar todos os serviços
docker-compose up --build

# Ou executar em background
docker-compose up -d --build

# Ver logs em tempo real
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend
```

#### 4. Comandos Úteis de Desenvolvimento
```bash
# Parar todos os serviços
docker-compose down

# Parar e remover volumes (CUIDADO: apaga dados do banco)
docker-compose down -v

# Reconstruir apenas um serviço
docker-compose build backend
docker-compose up -d backend

# Executar comandos no container do backend
docker-compose exec backend npm run migrate
docker-compose exec backend npm run seed

# Acessar shell do container
docker-compose exec backend sh
docker-compose exec postgres psql -U postgres -d saas_buyandhold
```

### 🏭 Comandos para Produção

#### 1. Build Otimizado para Produção
```bash
# Definir ambiente de produção
export NODE_ENV=production

# Build das imagens otimizadas
docker-compose -f docker-compose.yml build --no-cache

# Executar em produção
docker-compose -f docker-compose.yml up -d
```

#### 2. Monitoramento em Produção
```bash
# Verificar status dos containers
docker-compose ps

# Verificar uso de recursos
docker stats

# Backup do banco de dados
docker-compose exec postgres pg_dump -U postgres saas_buyandhold > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U postgres saas_buyandhold < backup.sql
```

### 🌐 URLs de Acesso

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Banco PostgreSQL**: localhost:5432
- **Health Check Backend**: http://localhost:5000/health
- **Health Check Frontend**: http://localhost:3000/health

### 🔧 Configurações Importantes

#### Variáveis de Ambiente (.env)
```env
# Configurações Gerais
NODE_ENV=development
PORT_BACKEND=5000
PORT_FRONTEND=3000

# PostgreSQL
POSTGRES_DB=saas_buyandhold
POSTGRES_USER=postgres
POSTGRES_PASSWORD=sua_senha_segura
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# URLs dos Serviços
REACT_APP_API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

# Segurança
JWT_SECRET=seu_jwt_secret_muito_seguro
JWT_EXPIRES_IN=7d
```

### 🛠️ Troubleshooting

#### Problemas Comuns

**1. Porta já em uso**
```bash
# Verificar processos usando a porta
netstat -tulpn | grep :3000

# Matar processo específico
kill -9 <PID>
```

**2. Erro de conexão com banco**
```bash
# Verificar se o PostgreSQL está rodando
docker-compose ps postgres

# Reiniciar apenas o banco
docker-compose restart postgres

# Verificar logs do banco
docker-compose logs postgres
```

**3. Problemas de build**
```bash
# Limpar cache do Docker
docker system prune -a

# Rebuild completo sem cache
docker-compose build --no-cache

# Remover volumes órfãos
docker volume prune
```

**4. Problemas de permissão (Linux/Mac)**
```bash
# Ajustar permissões dos arquivos
sudo chown -R $USER:$USER .

# Executar Docker sem sudo (adicionar usuário ao grupo)
sudo usermod -aG docker $USER
```

### 📊 Monitoramento e Logs

```bash
# Logs detalhados com timestamp
docker-compose logs -f --timestamps

# Logs apenas de erros
docker-compose logs --tail=50 | grep ERROR

# Monitorar recursos em tempo real
docker-compose top

# Verificar saúde dos containers
docker-compose exec backend curl http://localhost:5000/health
docker-compose exec frontend curl http://localhost/health
```

### 🔒 Segurança

- Containers executam com usuário não-root
- Variáveis sensíveis em arquivos `.env` (não versionados)
- Rede isolada entre containers
- Health checks configurados
- Logs estruturados para auditoria

> ⚠️ **Importante**: 
> - Nunca commite arquivos `.env` com dados reais
> - Use senhas fortes em produção
> - Configure SSL/TLS em produção
> - Faça backups regulares do banco de dados

## 📁 Controle de Versão e .gitignore

O projeto possui um arquivo `.gitignore` otimizado que ignora automaticamente:

### 🚫 Arquivos e Pastas Ignorados

**Dependências e Cache**:
- `node_modules/` (em qualquer nível)
- `package-lock.json` e `yarn.lock`
- Cache do npm e yarn

**Builds e Distribuição**:
- Pastas `build/` e `dist/`
- Arquivos de build do Next.js
- Arquivos compilados

**Arquivos de Ambiente**:
- Todos os arquivos `.env*` (exceto `.env.example`)
- Configurações locais de desenvolvimento
- Arquivos de produção sensíveis

**Arquivos Temporários**:
- Logs de debug e erro
- Arquivos de backup (`.backup`, `.bak`, `.orig`)
- Arquivos temporários (`.tmp`, `.temp`)
- Cache de ferramentas

**Configurações de IDE**:
- `.vscode/`, `.idea/`
- Arquivos de swap do Vim
- Configurações específicas do editor

**Arquivos do Sistema**:
- `.DS_Store` (macOS)
- `Thumbs.db` (Windows)
- Arquivos de sistema diversos

**Banco de Dados Local**:
- Arquivos `.db`, `.sqlite`, `.sqlite3`
- Dumps de desenvolvimento

### ✅ Arquivos Versionados

**Mantidos no repositório**:
- `.env.example` (template de configuração)
- `.env.production` (configurações de produção sem dados sensíveis)
- Arquivos de configuração (`tailwind.config.js`, `postcss.config.js`)
- Scripts de deploy e ambiente
- Documentação e README

### 🔧 Configuração Recomendada

Antes de fazer commits, sempre verifique:

```bash
# Ver arquivos que serão commitados
git status

# Ver diferenças
git diff

# Adicionar apenas arquivos necessários
git add arquivo_especifico.js

# Evitar git add . sem verificação
```

**⚠️ Importante**: Nunca commite arquivos `.env` com dados reais de produção, chaves de API ou senhas.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob licença MIT. Veja os arquivos LICENSE em cada pasta para mais detalhes.

---

## 🎉 Resultado Final

Você agora tem um **SaaS completo e profissional** para sugestões de investimento Buy & Hold, com:

✅ **Backend robusto** com autenticação e API completa  
✅ **Frontend moderno** com interface responsiva  
✅ **Sistema de planos** para monetização  
✅ **Lógica de negócio** avançada e testada  
✅ **Arquitetura escalável** para crescimento  
✅ **Google AdSense** integrado para receita adicional  
✅ **Conformidade legal** com LGPD/GDPR  
✅ **Experiência otimizada** por tipo de usuário  

**Pronto para ser testado localmente e posteriormente deployado em produção!** 🚀