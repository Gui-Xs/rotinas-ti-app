@echo off
chcp 65001 >nul
echo ════════════════════════════════════════════════════════════
echo  🖨️  INSTALADOR DO AGENTE DE MONITORAMENTO DE IMPRESSORAS
echo ════════════════════════════════════════════════════════════
echo.

:: Verificar se está executando como administrador
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [AVISO] Recomenda-se executar como Administrador
    echo         para detectar impressoras USB corretamente.
    echo.
    set /p CONTINUAR="Deseja continuar mesmo assim? (S/N): "
    if /i not "%CONTINUAR%"=="S" (
        echo.
        echo Execute este arquivo como Administrador:
        echo - Clique com botao direito no arquivo
        echo - Selecione "Executar como administrador"
        echo.
        pause
        exit /b 1
    )
)

:: Verificar se Node.js está instalado
echo Verificando Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ════════════════════════════════════════════════════════════
    echo  ❌ ERRO: Node.js não encontrado!
    echo ════════════════════════════════════════════════════════════
    echo.
    echo O Node.js é necessário para executar o agente.
    echo.
    echo Por favor:
    echo 1. Acesse: https://nodejs.org/
    echo 2. Baixe a versão LTS (recomendada)
    echo 3. Instale e reinicie este instalador
    echo.
    pause
    exit /b 1
)

:: Mostrar versão do Node.js
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js encontrado: %NODE_VERSION%
echo.

:: Definir pasta de destino
set DESTINO=C:\printer-monitor-agent

:: Verificar se já existe instalação
if exist "%DESTINO%" (
    echo ════════════════════════════════════════════════════════════
    echo  ⚠️  INSTALAÇÃO EXISTENTE DETECTADA
    echo ════════════════════════════════════════════════════════════
    echo.
    echo Já existe uma instalação em: %DESTINO%
    echo.
    set /p SOBRESCREVER="Deseja sobrescrever? (S/N): "
    if /i not "%SOBRESCREVER%"=="S" (
        echo.
        echo Instalação cancelada.
        echo.
        pause
        exit /b 0
    )
    
    :: Fazer backup do config.json se existir
    if exist "%DESTINO%\config.json" (
        echo.
        echo Fazendo backup da configuração existente...
        copy "%DESTINO%\config.json" "%DESTINO%\config.json.backup" >nul
        echo ✅ Backup salvo em: config.json.backup
    )
    
    echo.
    echo Removendo instalação antiga...
    rmdir /s /q "%DESTINO%"
)

:: Copiar arquivos
echo.
echo ════════════════════════════════════════════════════════════
echo  📦 COPIANDO ARQUIVOS
echo ════════════════════════════════════════════════════════════
echo.
echo Destino: %DESTINO%
echo.

:: Criar pasta de destino
mkdir "%DESTINO%" 2>nul

:: Copiar arquivos (assumindo que o script está na pasta agent)
echo Copiando arquivos do agente...
xcopy "%~dp0*.*" "%DESTINO%\" /E /I /Y /EXCLUDE:%~dp0INSTALAR.bat >nul

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Erro ao copiar arquivos!
    pause
    exit /b 1
)

echo ✅ Arquivos copiados com sucesso
echo.

:: Restaurar config.json se havia backup
if exist "%DESTINO%\config.json.backup" (
    echo Restaurando configuração anterior...
    copy "%DESTINO%\config.json.backup" "%DESTINO%\config.json" >nul
    echo ✅ Configuração restaurada
    echo.
)

:: Navegar até a pasta
cd /d "%DESTINO%"

:: Instalar dependências
echo ════════════════════════════════════════════════════════════
echo  📥 INSTALANDO DEPENDÊNCIAS
echo ════════════════════════════════════════════════════════════
echo.
echo Isso pode levar alguns minutos...
echo.

call npm install

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ════════════════════════════════════════════════════════════
    echo  ❌ ERRO AO INSTALAR DEPENDÊNCIAS
    echo ════════════════════════════════════════════════════════════
    echo.
    echo Verifique sua conexão com a internet e tente novamente.
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Dependências instaladas com sucesso
echo.

:: Verificar se config.json existe
if not exist "%DESTINO%\config.json" (
    echo ════════════════════════════════════════════════════════════
    echo  ⚙️  CONFIGURAÇÃO NECESSÁRIA
    echo ════════════════════════════════════════════════════════════
    echo.
    echo O agente ainda não foi configurado.
    echo.
    set /p CONFIGURAR="Deseja configurar agora? (S/N): "
    if /i "%CONFIGURAR%"=="S" (
        echo.
        call npm run setup
    ) else (
        echo.
        echo Você pode configurar depois executando:
        echo   cd %DESTINO%
        echo   npm run setup
    )
)

:: Sucesso
echo.
echo ════════════════════════════════════════════════════════════
echo  ✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!
echo ════════════════════════════════════════════════════════════
echo.
echo 📁 Pasta de instalação: %DESTINO%
echo.
echo 📋 PRÓXIMOS PASSOS:
echo.

if exist "%DESTINO%\config.json" (
    echo 1. Para iniciar o monitoramento:
    echo    cd %DESTINO%
    echo    npm start
    echo.
    echo 2. Para executar automaticamente com o Windows:
    echo    - Consulte o arquivo INSTALACAO_OUTROS_PCS.md
    echo    - Seção: "Executar Automaticamente"
) else (
    echo 1. Configure o agente:
    echo    cd %DESTINO%
    echo    npm run setup
    echo.
    echo 2. Inicie o monitoramento:
    echo    npm start
    echo.
    echo 3. Para executar automaticamente com o Windows:
    echo    - Consulte o arquivo INSTALACAO_OUTROS_PCS.md
)

echo.
echo 📖 DOCUMENTAÇÃO:
echo    - PRIMEIRO_USO.txt - Instruções detalhadas
echo    - QUICK_START.md - Guia rápido
echo    - README.md - Documentação completa
echo.
echo ════════════════════════════════════════════════════════════
echo.
pause
