# 📦 Instalação do Agente em Outros Computadores

## 🎯 Objetivo

Instalar o agente de monitoramento de impressoras em computadores que **não têm** o projeto completo.

---

## 📋 Pré-requisitos em Cada Computador

- ✅ Windows
- ✅ Node.js instalado (https://nodejs.org/)
- ✅ Conexão com internet

---

## 🚀 Método 1: Copiar Pasta do Agente (Mais Simples)

### **No Seu Computador (Preparação)**

1. Copie a pasta `agent` completa:
   ```
   C:\Users\igor rodrigues\CascadeProjects\rotinas-ti-app\agent
   ```

2. Cole em um pendrive ou compartilhamento de rede

### **No Computador de Destino**

1. **Cole a pasta** em um local permanente:
   ```
   C:\printer-monitor-agent
   ```

2. **Abra o CMD** (Win + R → `cmd`)

3. **Navegue até a pasta:**
   ```cmd
   cd C:\printer-monitor-agent
   ```

4. **Instale as dependências:**
   ```cmd
   npm install
   ```
   ⏳ Aguarde a instalação (2-3 minutos)

5. **Configure o agente:**
   ```cmd
   npm run setup
   ```
   
   **IMPORTANTE:** Use as **mesmas credenciais do Firebase** em todos os PCs!
   
   Configure apenas:
   - ✏️ **Nome do computador:** Diferente para cada PC (ex: "PC Recepção", "PC Consultório 1")
   - ✏️ **Local/Setor:** Diferente para cada PC (ex: "Recepção", "Consultório 1")

6. **Inicie o agente:**
   ```cmd
   npm start
   ```

7. **Verificar no app web:**
   - As impressoras deste PC aparecerão automaticamente!

---

## 🚀 Método 2: Usar Compartilhamento de Rede

### **1. Criar Compartilhamento no Servidor**

No seu PC ou servidor, compartilhe a pasta `agent`:

```
\\SERVIDOR\printer-monitor-agent
```

### **2. Em Cada Computador**

1. **Mapear a unidade de rede** (opcional):
   ```cmd
   net use Z: \\SERVIDOR\printer-monitor-agent
   ```

2. **Copiar para o disco local:**
   ```cmd
   xcopy Z:\*.* C:\printer-monitor-agent\ /E /I /Y
   ```

3. **Seguir os passos 3-7 do Método 1**

---

## 🚀 Método 3: Script de Instalação Automática

### **No Seu Computador (Criar o Instalador)**

1. Crie uma pasta temporária:
   ```cmd
   mkdir C:\temp\printer-agent-installer
   ```

2. Copie a pasta `agent` para lá:
   ```cmd
   xcopy "C:\Users\igor rodrigues\CascadeProjects\rotinas-ti-app\agent" "C:\temp\printer-agent-installer\agent" /E /I /Y
   ```

3. Crie um arquivo `INSTALAR.bat` com o conteúdo abaixo

4. Copie tudo para um pendrive

### **No Computador de Destino**

1. Execute `INSTALAR.bat` como **Administrador**
2. Siga as instruções na tela
3. Pronto!

---

## 📝 Arquivo INSTALAR.bat

Salve este conteúdo como `INSTALAR.bat`:

```batch
@echo off
echo ============================================================
echo  INSTALADOR DO AGENTE DE MONITORAMENTO DE IMPRESSORAS
echo ============================================================
echo.

:: Verificar se Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Node.js nao encontrado!
    echo.
    echo Por favor, instale o Node.js de: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js encontrado
echo.

:: Definir pasta de destino
set DESTINO=C:\printer-monitor-agent

:: Verificar se já existe
if exist "%DESTINO%" (
    echo [AVISO] Pasta %DESTINO% ja existe!
    echo.
    set /p SOBRESCREVER="Deseja sobrescrever? (S/N): "
    if /i not "%SOBRESCREVER%"=="S" (
        echo Instalacao cancelada.
        pause
        exit /b 0
    )
    rmdir /s /q "%DESTINO%"
)

:: Copiar arquivos
echo.
echo Copiando arquivos para %DESTINO%...
xcopy "%~dp0agent" "%DESTINO%\" /E /I /Y >nul

:: Navegar até a pasta
cd /d "%DESTINO%"

:: Instalar dependências
echo.
echo Instalando dependencias (pode levar alguns minutos)...
call npm install

:: Verificar se instalação foi bem-sucedida
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERRO] Falha ao instalar dependencias!
    pause
    exit /b 1
)

echo.
echo ============================================================
echo  INSTALACAO CONCLUIDA COM SUCESSO!
echo ============================================================
echo.
echo Proximos passos:
echo.
echo 1. Execute: npm run setup
echo    (para configurar o agente)
echo.
echo 2. Execute: npm start
echo    (para iniciar o monitoramento)
echo.
echo Pasta de instalacao: %DESTINO%
echo.
pause
```

---

## 🔧 Configuração em Múltiplos PCs

### **Credenciais do Firebase (IGUAIS em todos os PCs)**

```
Firebase Project ID: rotinas-ti-hpaes
Firebase Client Email: firebase-adminsdk-xxxxx@rotinas-ti-hpaes.iam.gserviceaccount.com
Firebase Private Key: -----BEGIN PRIVATE KEY----- ... -----END PRIVATE KEY-----
```

### **Informações Específicas (DIFERENTES em cada PC)**

| Computador | Nome do Computador | Local/Setor |
|------------|-------------------|-------------|
| PC 1 | PC da Recepção | Recepção |
| PC 2 | PC Consultório 1 | Consultório 1 |
| PC 3 | PC Consultório 2 | Consultório 2 |
| PC 4 | PC Sala de TI | TI |

---

## 🖥️ Executar Automaticamente (Em Cada PC)

Após instalar, configure para iniciar com o Windows:

### **Agendador de Tarefas**

1. `Win + R` → `taskschd.msc`
2. **Criar Tarefa Básica**
3. Nome: `Monitor de Impressoras`
4. Disparador: **Ao fazer logon**
5. Ação: **Iniciar um programa**
   - Programa: `C:\Program Files\nodejs\node.exe`
   - Argumentos: `index.js`
   - Iniciar em: `C:\printer-monitor-agent`
6. ✅ **Executar com privilégios mais altos**

---

## ✅ Verificação

### **Em Cada PC**

1. **Console:** Deve mostrar impressoras detectadas
2. **App Web:** Impressoras aparecem com o nome correto do PC

### **No App Web**

Você verá algo assim:

```
┌──────────────────┬──────┬────────────┬────────┬──────────────┐
│ Nome             │ Tipo │ IP/Porta   │ Status │ Computador   │
├──────────────────┼──────┼────────────┼────────┼──────────────┤
│ Impressora HP    │ USB  │ USB001     │ Online │ PC Recepção  │
│ Impressora Canon │ USB  │ USB002     │ Online │ PC Consult 1 │
│ Impressora Epson │ Rede │ 192.168... │ Online │ PC Sala TI   │
└──────────────────┴──────┴────────────┴────────┴──────────────┘
```

Cada PC envia suas próprias impressoras!

---

## 🔄 Atualização do Agente

Quando houver atualizações:

1. Atualize a pasta `agent` no seu PC principal
2. Copie a pasta atualizada para os outros PCs
3. Em cada PC:
   ```cmd
   cd C:\printer-monitor-agent
   npm install
   ```
4. Reinicie o agente

**IMPORTANTE:** O arquivo `config.json` **não** será sobrescrito, então as configurações serão mantidas.

---

## 📞 Suporte

Para problemas, consulte:
- `PRIMEIRO_USO.txt` - Instruções detalhadas
- `README.md` - Documentação completa
- `QUICK_START.md` - Guia rápido

---

**Desenvolvido para HPAES TI** 🏥
