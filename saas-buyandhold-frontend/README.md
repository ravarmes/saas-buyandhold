# SaaS Buy & Hold - Frontend

Interface web da aplicação SaaS para sugestões de investimento Buy & Hold. Desenvolvido em React.js com Tailwind CSS.

## 🚀 Funcionalidades

- **Interface Responsiva** com design moderno e intuitivo
- **Autenticação Completa** (login, registro, perfil)
- **Gestão de Carteiras** para usuários premium
- **Calculadora de Investimentos** acessível a todos
- **Sistema de Planos** (Free vs Premium)
- **Context API** para gestão de estado global
- **Roteamento** com React Router
- **Componentes Reutilizáveis** bem organizados

## 📋 Pré-requisitos

- **Node.js** 16+
- **npm** ou **yarn**
- **Backend API** rodando (veja README do backend)

## 🛠️ Instalação

### 1. Instalar dependências

```bash
cd saas-buyandhold-frontend
npm install
```

### 2. Configuração

Copie o arquivo de exemplo e configure:

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENVIRONMENT=development

# Features
REACT_APP_ENABLE_REGISTRATION=true
REACT_APP_ENABLE_DEMO_MODE=true

# App Configuration
REACT_APP_NAME=SaaS Buy & Hold
REACT_APP_VERSION=1.0.0
```

### 3. Executar a aplicação

```bash
# Desenvolvimento
npm start

# Build para produção
npm run build
```

A aplicação estará disponível em: `http://localhost:3000`

## 📱 Páginas e Funcionalidades

### Páginas Públicas

#### Home (`/`)
- Landing page com apresentação da plataforma
- Seções de funcionalidades e pricing
- Call-to-actions para registro/login

#### Calculadora (`/calculator`)
- Calculadora de investimentos acessível a todos
- Funcionalidade limitada (sem salvamento)
- Demonstração das capacidades da plataforma

#### Login (`/login`)
- Formulário de autenticação
- Opção para usar sem cadastro
- Link para registro

#### Registro (`/register`)
- Formulário de criação de conta
- Validação de dados
- Início automático com plano gratuito

### Páginas Protegidas (Requer Login)

#### Dashboard (`/dashboard`)
- Visão geral das carteiras do usuário
- Acesso rápido às funcionalidades principais
- Indicadores de performance

#### Configurações (`/settings`)
- Gestão de carteiras e alocações
- Configuração de percentuais desejados
- Definição de targets por ativo

#### Perfil (`/profile`)
- Dados pessoais do usuário
- Informações da assinatura
- Opções de upgrade

## 🎨 Estrutura de Componentes

```
src/
├── components/
│   ├── layout/           # Componentes de layout
│   │   ├── Navbar.js     # Barra de navegação
│   │   └── ...
│   ├── ProtectedRoute.js # Proteção de rotas
│   └── ...
├── contexts/             # Contexts do React
│   ├── AuthContext.js    # Autenticação global
│   └── PortfolioContext.js # Gestão de carteiras
├── pages/                # Páginas da aplicação
│   ├── Home.js
│   ├── Login.js
│   ├── Register.js
│   ├── Dashboard.js
│   ├── Calculator.js
│   ├── Settings.js
│   └── Profile.js
└── App.js               # Componente principal
```

## 🔐 Sistema de Autenticação

### AuthContext
Gerencia o estado global de autenticação:

```javascript
const {
  user,           // Dados do usuário logado
  token,          // JWT token
  loading,        // Estado de carregamento
  login,          // Função de login
  register,       // Função de registro
  logout,         // Função de logout
  permissions     // Permissões baseadas no plano
} = useAuth();
```

### Permissões por Plano

```javascript
// Usuário Free
permissions = {
  isPremium: false,
  save: false,              // Não pode salvar carteiras
  multiplePortfolios: false, // Uma carteira apenas
  history: false,           // Sem histórico
  analytics: false          // Sem analytics
}

// Usuário Premium
permissions = {
  isPremium: true,
  save: true,               // Pode salvar carteiras
  multiplePortfolios: true, // Carteiras ilimitadas
  history: true,            // Histórico completo
  analytics: true           // Analytics avançados
}
```

## 📊 Sistema de Carteiras

### PortfolioContext
Gerencia carteiras e ativos:

```javascript
const {
  portfolios,         // Lista de carteiras
  currentPortfolio,   // Carteira ativa
  loading,            // Estado de carregamento
  createPortfolio,    // Criar carteira
  updatePortfolio,    // Atualizar carteira
  deletePortfolio,    // Deletar carteira
  addAsset,           // Adicionar ativo
  updateAsset,        // Atualizar ativo
  removeAsset,        // Remover ativo
  switchPortfolio     // Trocar carteira ativa
} = usePortfolio();
```

### Carteira Temporária (Usuários Free)
Usuários não logados ou gratuitos recebem uma carteira temporária:

- Dados armazenados apenas na sessão
- Sem persistência no backend
- Funcionalidade completa de cálculo
- Incentivo para upgrade

## 🎯 Diferenciação de Planos

### Componentes Condicionais
A interface se adapta baseada no plano do usuário:

```javascript
// Exemplo de uso
{permissions.save ? (
  <SaveButton onClick={handleSave} />
) : (
  <UpgradePrompt feature="save" />
)}
```

### Prompts de Upgrade
Componentes estratégicos incentivam upgrade:

- Aparecem quando usuário tenta usar funcionalidade premium
- Design atrativo com comparação de planos
- CTAs claros para conversão

## 🛣️ Roteamento

### Rotas Públicas
```javascript
/ → Home
/login → Login
/register → Register
/calculator → Calculator (demo)
```

### Rotas Protegidas
```javascript
/dashboard → Dashboard (requer login)
/settings → Settings (requer login)
/profile → Profile (requer login)
```

### ProtectedRoute Component
Protege rotas que requerem autenticação:

```javascript
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

## 📱 Responsividade

A aplicação é totalmente responsiva:

- **Mobile First**: Design otimizado para dispositivos móveis
- **Breakpoints**: `sm`, `md`, `lg`, `xl` (Tailwind CSS)
- **Menu Mobile**: Navegação adaptada para telas pequenas
- **Layout Flexível**: Componentes se adaptam ao tamanho da tela

## 🎨 Design System

### Cores Principais
```css
Primary: Blue (#2563eb)
Success: Green (#10b981)
Warning: Yellow (#f59e0b)
Error: Red (#ef4444)
Gray Scale: (#f9fafb → #111827)
```

### Componentes Base
- **Cards**: Container padrão para conteúdo
- **Buttons**: Variações de botões (primary, secondary, outline)
- **Forms**: Inputs e validação consistentes
- **Modals**: Overlays para ações importantes

## 🧪 Testando a Aplicação

### Fluxo Completo - Usuário Novo

1. **Acessar Home** (`http://localhost:3000`)
2. **Testar Calculadora** sem cadastro
3. **Fazer Registro** com dados válidos
4. **Explorar Dashboard** com carteira padrão
5. **Adicionar Ativos** à carteira
6. **Configurar Percentuais** ideais
7. **Calcular Sugestões** de investimento

### Fluxo de Upgrade

1. **Tentar usar funcionalidade premium** (múltiplas carteiras)
2. **Ver prompt de upgrade**
3. **Comparar planos**
4. **Testar fluxo de assinatura**

## 🔧 Configurações de Desenvolvimento

### ESLint
Configurado para React com regras padrão:

```json
{
  "extends": [
    "react-app",
    "react-app/jest"
  ]
}
```

### Tailwind CSS
Utilitários CSS configurados em `tailwind.config.js`:

```javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### Proxy de Desenvolvimento
Configurado no `package.json` para redirecionar API calls:

```json
{
  "proxy": "http://localhost:5000"
}
```

## 📦 Scripts Disponíveis

```bash
npm start          # Desenvolvimento (hot reload)
npm run build      # Build de produção
npm test           # Executar testes
npm run eject      # Ejetar configuração (não recomendado)
```

## 🚀 Deploy

### Build de Produção
```bash
npm run build
```

Gera pasta `build/` com arquivos otimizados para produção.

### Variáveis de Ambiente para Produção
```env
REACT_APP_API_URL=https://api.buyandhold.com
REACT_APP_ENVIRONMENT=production
```

## 🔧 Scripts de Deploy e Ambiente

O frontend inclui suporte para diferentes ambientes através de scripts automatizados:

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

**O que acontece no frontend**:
- ✅ Arquivo `.env` é atualizado
- ✅ URL da API é configurada
- ✅ Configurações do Google AdSense
- ✅ Configurações do EmailJS
- ✅ Features habilitadas/desabilitadas

### 🚀 Deploy para Produção

Use o script `deploy-production.sh` na raiz do projeto:

```bash
# Preparar para deploy
../script-deploy-production.sh
```

**Processo do frontend**:
1. 📦 Instala dependências: `npm install`
2. ⚙️ Copia configurações de produção
3. 🏗️ Gera build otimizado: `npm run build`
4. 🔍 Valida arquivos gerados
5. 📋 Lista próximos passos

### ⚙️ Configurações por Ambiente

**Development**:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENVIRONMENT=development
REACT_APP_DOMAIN=localhost:3000
REACT_APP_ADSENSE_CLIENT=ca-pub-exemplo
```

**Production**:
```env
REACT_APP_API_URL=https://buyandhold.vargascode.com.br/api
REACT_APP_ENVIRONMENT=production
REACT_APP_DOMAIN=buyandhold.vargascode.com.br
REACT_APP_ADSENSE_CLIENT=ca-pub-seu_id_real
```

**Test**:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENVIRONMENT=test
REACT_APP_DOMAIN=localhost:3000
REACT_APP_ADSENSE_CLIENT=ca-pub-exemplo
```

### 📁 Estrutura do Build

Após executar `npm run build`, a pasta `build/` contém:

```
build/
├── static/
│   ├── css/           # Arquivos CSS minificados
│   ├── js/            # Arquivos JavaScript minificados
│   └── media/         # Imagens e outros assets
├── index.html         # Página principal
├── manifest.json      # Configurações PWA
└── robots.txt         # SEO
```

### 🌐 Deploy em Servidor Web

**1. Copiar arquivos**:
```bash
# Copiar build para servidor
scp -r saas-buyandhold-frontend/build/* user@servidor:/var/www/html/
```

**2. Configurar servidor web (Nginx)**:
```nginx
server {
    listen 80;
    server_name buyandhold.vargascode.com.br;
    root /var/www/html;
    index index.html;
    
    # Configuração para SPA (Single Page Application)
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache para assets estáticos
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Proxy para API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**3. Configurar HTTPS (Let's Encrypt)**:
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d buyandhold.vargascode.com.br

# Renovação automática
sudo crontab -e
# Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 🔍 Verificação Pós-Deploy

```bash
# Testar aplicação
curl https://buyandhold.vargascode.com.br

# Verificar assets
curl https://buyandhold.vargascode.com.br/static/css/main.css

# Testar roteamento SPA
curl https://buyandhold.vargascode.com.br/dashboard
```

### 📊 Monitoramento

**Google Analytics** (se configurado):
- Acesse Google Analytics para métricas
- Monitore páginas mais visitadas
- Acompanhe conversões

**Performance**:
```bash
# Lighthouse (auditoria de performance)
npx lighthouse https://buyandhold.vargascode.com.br

# Bundle analyzer (análise do build)
npm install -g webpack-bundle-analyzer
npx webpack-bundle-analyzer build/static/js/*.js
```

## 🐛 Troubleshooting

### Erro de CORS
- Verifique se backend está rodando
- Confirme `REACT_APP_API_URL` no `.env`
- Verifique configuração de CORS no backend

### Página em Branco
- Verifique console do navegador para erros
- Confirme se todas as dependências estão instaladas
- Teste com `npm start` em modo desenvolvimento

### Problemas de Autenticação
- Limpe localStorage: `localStorage.clear()`
- Verifique se token está sendo enviado nas requisições
- Confirme se backend está processando autenticação

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Commit: `git commit -m 'Add nova feature'`
4. Push: `git push origin feature/nova-feature`
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob licença MIT. Veja o arquivo LICENSE para mais detalhes.
