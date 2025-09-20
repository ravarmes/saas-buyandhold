@echo off
echo ========================================
echo    Iniciando aplicacao SaaS Buy&Hold
echo ========================================
echo.

echo [1/5] Matando processos nas portas 5000 e 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
    if not "%%a"=="0" (
        echo Matando processo %%a na porta 5000
        taskkill /PID %%a /F >nul 2>&1
    )
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    if not "%%a"=="0" (
        echo Matando processo %%a na porta 3000
        taskkill /PID %%a /F >nul 2>&1
    )
)

echo [2/5] Aguardando liberacao das portas...
timeout /t 2 /nobreak >nul

echo [3/5] Configurando portas padrao...
echo PORT=5000 > saas-buyandhold-backend\.env.temp
type saas-buyandhold-backend\.env | findstr /v "^PORT=" >> saas-buyandhold-backend\.env.temp
move saas-buyandhold-backend\.env.temp saas-buyandhold-backend\.env >nul

echo REACT_APP_API_URL=http://localhost:5000 > saas-buyandhold-frontend\.env.temp
rem Variaveis do EmailJS para desenvolvimento local
echo REACT_APP_EMAILJS_SERVICE_ID=service_2ptqo6c >> saas-buyandhold-frontend\.env.temp
echo REACT_APP_EMAILJS_TEMPLATE_ID=template_general >> saas-buyandhold-frontend\.env.temp
echo REACT_APP_EMAILJS_PASSWORD_TEMPLATE_ID=template_password >> saas-buyandhold-frontend\.env.temp
echo REACT_APP_EMAILJS_PUBLIC_KEY=VJHfBUQ8SCGRoPkrZ >> saas-buyandhold-frontend\.env.temp

rem Preservar demais variaveis existentes no arquivo .env local do frontend, exceto as que sobrescrevemos acima
type saas-buyandhold-frontend\.env | findstr /v "^REACT_APP_API_URL=" | findstr /v "^REACT_APP_EMAILJS_SERVICE_ID=" | findstr /v "^REACT_APP_EMAILJS_TEMPLATE_ID=" | findstr /v "^REACT_APP_EMAILJS_PASSWORD_TEMPLATE_ID=" | findstr /v "^REACT_APP_EMAILJS_PUBLIC_KEY=" >> saas-buyandhold-frontend\.env.temp 2>nul
move saas-buyandhold-frontend\.env.temp saas-buyandhold-frontend\.env >nul

echo [4/5] Iniciando backend na porta 5000...
start "Backend" cmd /k "cd saas-buyandhold-backend && npm start"

echo [5/5] Aguardando backend inicializar...
timeout /t 5 /nobreak >nul

echo Iniciando frontend na porta 3000...
start "Frontend" cmd /k "cd saas-buyandhold-frontend && npm start"

echo.
echo ========================================
echo    Aplicacao iniciada com sucesso!
echo    Backend: http://localhost:5000
echo    Frontend: http://localhost:3000
echo ========================================
echo.
echo Pressione qualquer tecla para fechar...
pause >nul