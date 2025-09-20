@echo off
REM ================================
REM Script de Limpeza Docker
REM SaaS Buy & Hold - Otimização de Disco
REM ================================

echo ========================================
echo  LIMPEZA DOCKER - SAAS BUY & HOLD
echo ========================================
echo.

REM Verificar se Docker está rodando
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Docker Desktop não está rodando!
    echo Por favor, inicie o Docker Desktop e tente novamente.
    pause
    exit /b 1
)

echo [INFO] Docker está rodando. Iniciando limpeza...
echo.

REM Parar containers do projeto
echo [1/6] Parando containers do projeto...
docker-compose down 2>nul
echo.

REM Remover imagens não utilizadas
echo [2/6] Removendo imagens não utilizadas...
docker image prune -f
echo.

REM Remover containers parados
echo [3/6] Removendo containers parados...
docker container prune -f
echo.

REM Remover volumes não utilizados (CUIDADO: isso remove dados!)
echo [4/6] Removendo volumes não utilizados...
echo AVISO: Isso pode remover dados do banco!
set /p confirm="Deseja continuar? (s/N): "
if /i "%confirm%"=="s" (
    docker volume prune -f
    echo Volumes removidos.
) else (
    echo Volumes mantidos.
)
echo.

REM Remover redes não utilizadas
echo [5/6] Removendo redes não utilizadas...
docker network prune -f
echo.

REM Limpeza completa do sistema (opcional)
echo [6/6] Limpeza completa do sistema Docker...
set /p cleanup="Deseja fazer limpeza completa? (s/N): "
if /i "%cleanup%"=="s" (
    echo Executando limpeza completa...
    docker system prune -a -f
    echo Limpeza completa finalizada.
) else (
    echo Limpeza completa pulada.
)
echo.

REM Mostrar uso de disco atual
echo ========================================
echo  RESUMO DO USO DE DISCO
echo ========================================
docker system df
echo.

echo ========================================
echo  LIMPEZA CONCLUÍDA!
echo ========================================
echo.
echo Para reconstruir o projeto:
echo   docker-compose up --build -d
echo.
pause