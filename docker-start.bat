@echo off
REM ================================
REM Script para iniciar aplicação Docker
REM SaaS Buy & Hold
REM ================================

echo ========================================
echo  SAAS BUY & HOLD - DOCKER STARTUP
echo ========================================
echo.
echo [INFO] Iniciando aplicacao SaaS Buy & Hold...
echo [INFO] Aguarde enquanto os containers sao construidos e iniciados.
echo.

REM Verificar uso de disco antes de iniciar
echo [INFO] Verificando uso de disco Docker...
docker system df 2>nul
echo.

REM Verificar se Docker está instalado
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Docker não está instalado!
    echo Por favor, instale o Docker Desktop.
    pause
    exit /b 1
)

REM Verificar se Docker Desktop está rodando
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Docker Desktop não está rodando!
    echo.
    echo Por favor:
    echo 1. Abra o Docker Desktop
    echo 2. Aguarde até aparecer "Engine running" na interface
    echo 3. Execute este script novamente
    echo.
    pause
    exit /b 1
)

REM Verificar se arquivo .env existe
if not exist ".env" (
    echo [INFO] Arquivo .env não encontrado. Copiando .env.docker...
    copy ".env.docker" ".env"
    echo [OK] Arquivo .env criado com sucesso!
    echo.
)

echo [INFO] Parando containers existentes...
docker-compose down
echo.

REM Executar docker-compose com otimizações
echo [INFO] Construindo e iniciando containers (modo otimizado)...
set DOCKER_BUILDKIT=1
set COMPOSE_DOCKER_CLI_BUILD=1
docker-compose up --build -d --remove-orphans
echo.

echo [INFO] Aguardando serviços ficarem prontos...
timeout /t 10 /nobreak >nul
echo.

echo [INFO] Status dos containers:
docker-compose ps
echo.

echo ========================================
echo  APLICACAO INICIADA COM SUCESSO!
echo ========================================
echo.
echo URLs de acesso:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000
echo   API Docs: http://localhost:5000/api-docs
echo.
echo Comandos uteis:
echo   Parar:          docker-compose down
echo   Ver logs:       docker-compose logs -f
echo   Limpar disco:   docker-cleanup.bat
echo   Monitorar:      docker-logs.bat
echo.
echo [INFO] Uso de disco atual:
docker system df 2>nul
echo.
pause