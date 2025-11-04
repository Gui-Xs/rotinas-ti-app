@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║      🤖 INICIANDO BOT DO TELEGRAM - ROTINAS TI          ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

REM Verificar se o arquivo .env existe
if not exist ".env" (
    echo ❌ Arquivo .env não encontrado!
    echo.
    echo Execute primeiro a configuração:
    echo    npm run setup
    echo.
    echo Ou copie o arquivo .env.example para .env e edite-o.
    echo.
    pause
    exit /b 1
)

echo ✅ Arquivo de configuração encontrado
echo.
echo 🚀 Iniciando o bot...
echo.
echo ═══════════════════════════════════════════════════════════
echo.

call npm start

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Erro ao iniciar o bot!
    echo.
    echo Verifique:
    echo - Se o token do Telegram está correto
    echo - Se as credenciais do Firebase estão corretas
    echo - Se há conexão com a internet
    echo.
    pause
    exit /b 1
)
