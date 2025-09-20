@echo off
REM ================================
REM Script para visualizar logs Docker
REM SaaS Buy & Hold
REM ================================

echo ================================
echo  SaaS Buy & Hold - Docker Logs
echo ================================
echo.

if "%1"=="" (
    echo [INFO] Mostrando logs de todos os serviços...
    echo Pressione Ctrl+C para sair
    echo.
    docker-compose logs -f
) else (
    echo [INFO] Mostrando logs do serviço: %1
    echo Pressione Ctrl+C para sair
    echo.
    docker-compose logs -f %1
)

echo.
echo ================================
echo  Logs finalizados
echo ================================
echo.
echo Uso:
echo   docker-logs.bat          - Todos os logs
echo   docker-logs.bat frontend - Logs do frontend
echo   docker-logs.bat backend  - Logs do backend
echo   docker-logs.bat database - Logs do database
echo.
pause