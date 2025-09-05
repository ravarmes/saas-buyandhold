@echo off
REM ================================
REM Script para parar aplicação Docker
REM SaaS Buy & Hold
REM ================================

echo ================================
echo  SaaS Buy & Hold - Docker Stop
echo ================================
echo.

echo [INFO] Parando todos os containers...
docker-compose down
echo.

echo [INFO] Status dos containers:
docker-compose ps
echo.

echo ================================
echo  Containers parados com sucesso!
echo ================================
echo.
echo Para iniciar novamente: docker-start.bat
echo Para ver logs: docker-compose logs
echo.
pause