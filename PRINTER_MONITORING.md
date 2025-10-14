# 🖨️ Sistema de Monitoramento Automático de Impressoras

## 📋 Visão Geral

Este sistema permite monitorar automaticamente os níveis de tinta das impressoras conectadas ao computador (USB ou rede).

## 🎯 Funcionalidades Implementadas

### ✅ **Modo de Teste (Simulação)**
- Atualização manual com valores simulados
- Botão "Atualizar Níveis de Tinta" em cada impressora
- Botão "Atualizar Todas" para atualizar todas de uma vez
- Registro de data/hora da última atualização

### 🔄 **Como Funciona Agora**

1. **Interface Web:**
   - Clique em "Atualizar Níveis de Tinta" em qualquer impressora
   - Ou clique em "Atualizar Todas" no topo da página
   - Valores são simulados aleatoriamente para teste

2. **Dados Salvos:**
   - Níveis de tinta (Preta, Ciano, Magenta, Amarela)
   - Data/hora da última atualização
   - Método de atualização usado

## 🚀 Próximos Passos: Integração Real

### **Opção 1: PowerShell (Windows - USB/Rede)**

Para impressoras USB conectadas localmente:

1. **Executar o script de teste:**
   ```powershell
   cd scripts
   .\get-printer-ink-levels.ps1
   ```

2. **Para uma impressora específica:**
   ```powershell
   .\get-printer-ink-levels.ps1 -PrinterName "HP LaserJet"
   ```

3. **Limitações:**
   - Nem todos os drivers expõem níveis de tinta via WMI
   - Funciona melhor com impressoras HP, Epson, Canon que têm software do fabricante instalado

### **Opção 2: Electron App (Recomendado)**

Para criar um aplicativo desktop que monitora automaticamente:

1. **Instalar Electron:**
   ```bash
   npm install electron --save-dev
   ```

2. **Criar arquivo `electron-main.js`:**
   ```javascript
   const { app, BrowserWindow } = require('electron');
   const PrinterMonitor = require('./scripts/printer-monitor');
   
   let mainWindow;
   const monitor = new PrinterMonitor();
   
   app.whenReady().then(() => {
       mainWindow = new BrowserWindow({
           width: 1200,
           height: 800,
           webPreferences: {
               nodeIntegration: true
           }
       });
       
       mainWindow.loadURL('http://localhost:5173'); // Vite dev server
       
       // Iniciar monitoramento
       monitor.startMonitoring((printers) => {
           // Enviar dados para o Firebase
           mainWindow.webContents.send('printers-updated', printers);
       });
   });
   ```

3. **Adicionar ao `package.json`:**
   ```json
   {
       "scripts": {
           "electron": "electron ."
       }
   }
   ```

### **Opção 3: API do Fabricante**

#### **HP Web Services:**
```javascript
// Requer HP Smart instalado e impressora conectada
const hpApi = require('hp-web-services-api');
const levels = await hpApi.getInkLevels('192.168.1.100');
```

#### **Epson Connect API:**
```javascript
// Requer conta Epson Connect
const epsonApi = require('epson-connect-api');
const levels = await epsonApi.getPrinterStatus(printerId);
```

#### **Canon PRINT API:**
```javascript
// Requer Canon PRINT app instalado
const canonApi = require('canon-print-api');
const levels = await canonApi.getInkStatus(printerIp);
```

### **Opção 4: SNMP (Impressoras de Rede)**

Para impressoras de rede que suportam SNMP:

```javascript
const snmp = require('net-snmp');

// OIDs padrão para níveis de tinta
const OIDS = {
    black: '1.3.6.1.2.1.43.11.1.1.9.1.1',
    cyan: '1.3.6.1.2.1.43.11.1.1.9.1.2',
    magenta: '1.3.6.1.2.1.43.11.1.1.9.1.3',
    yellow: '1.3.6.1.2.1.43.11.1.1.9.1.4'
};

const session = snmp.createSession('192.168.1.100', 'public');
session.get([OIDS.black], (error, varbinds) => {
    if (!error) {
        console.log('Nível de tinta preta:', varbinds[0].value);
    }
});
```

## 🧪 Testar Agora (Modo Simulação)

1. **Acesse a página de Impressoras**
2. **Cadastre uma impressora** (se ainda não tiver)
3. **Clique em "Atualizar Níveis de Tinta"**
4. **Veja os valores atualizarem** automaticamente
5. **Expanda os detalhes** para ver a data da última atualização

## 📊 Dados Armazenados

Cada impressora agora salva:

```javascript
{
    nome: "HP LaserJet Pro",
    modelo: "M404dn",
    tintaPreta: 45,
    tintaCiano: 67,
    tintaMagenta: 23,
    tintaAmarela: 89,
    ultimaAtualizacao: Timestamp,
    metodoAtualizacao: "Simulação (Teste)" // ou "WMI", "SNMP", "HP API", etc.
}
```

## 🔧 Implementação Real - Sua Impressora USB

Para sua impressora USB específica:

1. **Identifique o fabricante e modelo**
2. **Verifique se tem software do fabricante instalado**
3. **Execute o script PowerShell para teste:**
   ```powershell
   cd scripts
   .\get-printer-ink-levels.ps1
   ```

4. **Veja o output:**
   - Se mostrar "HP (Requer HP Smart)" → Instale HP Smart
   - Se mostrar "Epson (Requer Epson Status Monitor)" → Instale Epson Status Monitor
   - Se mostrar "Canon (Requer Canon IJ Status Monitor)" → Instale Canon IJ Status Monitor

5. **Depois de instalar o software do fabricante:**
   - O software geralmente expõe APIs ou comandos CLI
   - Podemos integrar com o sistema

## 🎯 Recomendação

Para sua impressora USB, recomendo:

1. **Curto prazo:** Use o modo de simulação para testar a interface
2. **Médio prazo:** Instale o software do fabricante da sua impressora
3. **Longo prazo:** Crie um Electron app que lê os dados do software do fabricante

## 📝 Notas Importantes

- ⚠️ **Limitação do navegador:** Navegadores web não podem acessar dispositivos USB diretamente
- ✅ **Solução:** Usar Electron (app desktop) ou script que roda no servidor
- 🔄 **Atualização automática:** Pode ser configurada para rodar a cada X minutos
- 📊 **Histórico:** Todos os níveis são salvos com timestamp no Firebase

## 🆘 Suporte

Se precisar de ajuda para integrar com sua impressora específica:
1. Me informe o fabricante e modelo
2. Verifique se tem software do fabricante instalado
3. Execute o script PowerShell e me envie o output
