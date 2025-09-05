@echo off
REM ================================
REM Script para iniciar aplicação Docker
REM SaaS Buy & Hold
REM ================================

echo ================================
echo  SaaS Buy & Hold - Docker Setup
echo ================================
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

echo [INFO] Construindo e iniciando containers...
docker-compose up --build -d
echo.

echo [INFO] Aguardando serviços ficarem prontos...
timeout /t 10 /nobreak >nul
echo.

echo [INFO] Status dos containers:
docker-compose ps
echo.

echo ================================
echo  Aplicação iniciada com sucesso!
echo ================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo Database: localhost:5432
echo.
echo Para ver os logs: docker-compose logs -f
echo Para parar: docker-compose down
echo.
pause