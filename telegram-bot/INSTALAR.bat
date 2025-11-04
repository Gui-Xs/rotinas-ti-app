@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║   🤖 INSTALADOR DO BOT DO TELEGRAM - ROTINAS TI HPAES   ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

REM Verificar se Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js não encontrado!
    echo.
    echo Por favor, instale o Node.js primeiro:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js encontrado: 
node --version
echo.

REM Verificar se npm está instalado
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm não encontrado!
    pause
    exit /b 1
)

echo ✅ npm encontrado:
npm --version
echo.

echo 📦 Instalando dependências...
echo.
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Erro ao instalar dependências!
    pause
    exit /b 1
)

echo.
echo ✅ Instalação concluída com sucesso!
echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo 📋 PRÓXIMOS PASSOS:
echo.
echo 1. Configure o bot executando:
echo    npm run setup
echo.
echo 2. Ou edite manualmente o arquivo .env
echo.
echo 3. Inicie o bot com:
echo    npm start
echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo 📖 Para mais informações, consulte o README.md
echo.

pause
