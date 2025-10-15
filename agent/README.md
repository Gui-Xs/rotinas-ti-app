# 🖨️ Agente de Monitoramento de Impressoras

Serviço local Node.js que detecta e monitora impressoras USB e de rede, enviando informações em tempo real para o Firebase Firestore.

## 📋 Funcionalidades

- ✅ **Detecção automática de impressoras USB** locais (Windows)
- ✅ **Monitoramento de impressoras de rede** via ping e SNMP
- ✅ **Coleta de informações**: status, IP, nível de tinta, última verificação
- ✅ **Sincronização automática** com Firebase Firestore
- ✅ **Verificações periódicas** configuráveis
- ✅ **Identificação por computador** e localização

## 🚀 Instalação

### 1. Instalar dependências

```bash
cd agent
npm install
```

### 2. Configurar credenciais do Firebase

Você precisa das credenciais de uma Service Account do Firebase:

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Vá em **Configurações do Projeto** → **Contas de Serviço**
3. Clique em **Gerar nova chave privada**
4. Salve o arquivo JSON baixado

### 3. Configurar o agente

**Opção A: Configuração automática (recomendado)**

```bash
npm run setup
```

Siga as instruções interativas para configurar o agente.

**Opção B: Configuração manual**

1. Copie o arquivo de exemplo:
```bash
copy config.example.json config.json
```

2. Edite `config.json` com suas informações:

```json
{
  "firebase": {
    "projectId": "seu-project-id",
    "privateKey": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
    "clientEmail": "firebase-adminsdk-xxxxx@seu-project-id.iam.gserviceaccount.com"
  },
  "appId": "rotinas-ti-hpaes",
  "computerName": "PC da Recepção",
  "location": "Recepção",
  "checkInterval": 60000,
  "networkPrinters": [
    {
      "name": "Impressora Rede 1",
      "ip": "192.168.0.100",
      "snmpCommunity": "public"
    }
  ]
}
```

### 4. Iniciar o agente

```bash
npm start
```

O agente começará a monitorar as impressoras e enviar dados para o Firebase.

## ⚙️ Configurações

### Parâmetros do config.json

| Campo | Descrição | Obrigatório |
|-------|-----------|-------------|
| `firebase.projectId` | ID do projeto Firebase | ✅ |
| `firebase.privateKey` | Chave privada da Service Account | ✅ |
| `firebase.clientEmail` | Email da Service Account | ✅ |
| `appId` | ID da aplicação no Firestore | ✅ |
| `computerName` | Nome identificador deste computador | ✅ |
| `location` | Local/setor onde está o computador | ✅ |
| `checkInterval` | Intervalo entre verificações (ms) | ❌ (padrão: 60000) |
| `networkPrinters` | Array de impressoras de rede | ❌ |

### Configuração de Impressoras de Rede

Para cada impressora de rede, configure:

```json
{
  "name": "Nome da Impressora",
  "ip": "192.168.0.100",
  "snmpCommunity": "public"
}
```

**Nota**: A maioria das impressoras usa a community SNMP `public` por padrão.

## 🔍 Como Funciona

### Detecção de Impressoras USB

O agente usa o comando `wmic printer list brief` (Windows) para listar todas as impressoras conectadas localmente via USB.

### Detecção de Impressoras de Rede

1. **Ping**: Verifica se o IP está acessível
2. **SNMP**: Coleta informações detalhadas (status, nível de tinta)

### Estrutura de Dados no Firestore

Cada impressora é salva em:
```
artifacts/{appId}/printers/{printerId}
```

Com os seguintes campos:

```javascript
{
  name: "Impressora Recepção",
  type: "USB" | "Rede",
  ip: "192.168.0.25" | null,
  usb_port: "USB001" | null,
  status: "Online" | "Offline",
  ink_level: 87 | null,
  last_check: Timestamp,
  location: "Recepção",
  registered_by: "PC da Recepção",
  created_at: Timestamp,
  updated_at: Timestamp
}
```

## 🖥️ Executar como Serviço (Windows)

Para que o agente execute automaticamente ao iniciar o Windows:

### Usando NSSM (recomendado)

1. Baixe o [NSSM](https://nssm.cc/download)
2. Execute como administrador:

```cmd
nssm install PrinterMonitor "C:\Program Files\nodejs\node.exe" "C:\caminho\para\agent\index.js"
nssm set PrinterMonitor AppDirectory "C:\caminho\para\agent"
nssm start PrinterMonitor
```

### Usando Task Scheduler

1. Abra o Agendador de Tarefas
2. Criar Tarefa Básica
3. Configurar para executar no logon
4. Ação: Iniciar programa
   - Programa: `node.exe`
   - Argumentos: `index.js`
   - Iniciar em: `C:\caminho\para\agent`

## 📊 Monitoramento

### Logs

O agente exibe logs no console:

```
🔍 Iniciando verificação - 15/10/2025 10:30:00
🖨️  Detectadas 2 impressoras USB
🌐 Verificando 3 impressoras de rede...
  ✅ Impressora Rede 1 (192.168.0.100) - Online
  ✅ Impressora Rede 2 (192.168.0.101) - Online
  ❌ Impressora Rede 3 (192.168.0.102) - Offline
📤 Enviando 5 impressoras para o Firebase...
✅ 5/5 impressoras sincronizadas com sucesso
⏰ Próxima verificação em 60s
```

### Verificar no Firebase

Acesse o Firestore Console e navegue até:
```
artifacts/rotinas-ti-hpaes/printers/
```

## 🐛 Solução de Problemas

### Erro: "Configuração do Firebase incompleta"

Verifique se o `config.json` está correto e contém todas as credenciais necessárias.

### Erro: "Nenhuma impressora detectada"

- **USB**: Verifique se há impressoras conectadas localmente
- **Rede**: Verifique se os IPs estão corretos e acessíveis

### Erro de permissão no Firebase

Certifique-se de que a Service Account tem permissões de leitura/escrita no Firestore.

### SNMP não funciona

Algumas impressoras têm SNMP desabilitado por padrão. Verifique as configurações da impressora.

## 🔒 Segurança

- ⚠️ **Nunca commite** o arquivo `config.json` no Git
- 🔐 Mantenha as credenciais do Firebase seguras
- 🛡️ Use Service Accounts com permissões mínimas necessárias

## 📝 Licença

MIT - HPAES TI

---

**Desenvolvido para otimizar o monitoramento de impressoras no Hospital HPAES** 🏥
