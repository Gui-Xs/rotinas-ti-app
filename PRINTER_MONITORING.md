# 🖨️ Sistema de Monitoramento de Impressoras

Sistema completo de monitoramento automático de impressoras USB e de rede, com detecção em tempo real e visualização web.

## 📋 Visão Geral

O sistema é composto por dois componentes principais:

1. **Agente Local (Node.js)** - Executa nos computadores do hospital e detecta impressoras
2. **Interface Web (React)** - Exibe os dados em tempo real via Firebase Firestore

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────┐
│  Agente Local   │────────▶│   Firebase   │◀────────│   App Web   │
│   (Node.js)     │         │  Firestore   │         │   (React)   │
└─────────────────┘         └──────────────┘         └─────────────┘
        │                                                     │
        ▼                                                     ▼
  Impressoras                                         Visualização
  USB + Rede                                          Tempo Real
```

## 🚀 Início Rápido

### 1. Configurar o Agente Local

```bash
cd agent
npm install
npm run setup
```

Siga as instruções interativas para configurar:
- Credenciais do Firebase
- Nome do computador
- Localização/setor
- Impressoras de rede (opcional)

### 2. Iniciar o Monitoramento

```bash
npm start
```

O agente começará a detectar impressoras e enviar dados para o Firebase automaticamente.

### 3. Visualizar no App Web

Acesse a página "Impressoras" no app web. Os dados aparecerão automaticamente em tempo real.

## 🏗️ Arquitetura

### Agente Local (`/agent`)

**Funcionalidades:**
- ✅ Detecta impressoras USB conectadas localmente (Windows)
- ✅ Monitora impressoras de rede via ping e SNMP
- ✅ Coleta informações: nome, tipo, IP, status, nível de tinta
- ✅ Envia dados para Firebase Firestore a cada 60 segundos (configurável)
- ✅ Identifica cada impressora por computador e localização

**Tecnologias:**
- `firebase-admin` - Comunicação com Firebase
- `wmic` - Detecção de impressoras USB (Windows)
- `ping` - Verificação de conectividade de rede
- `snmp-native` - Coleta de informações via SNMP

**Estrutura de Arquivos:**
```
agent/
├── index.js              # Código principal do agente
├── setup.js              # Script de configuração interativa
├── package.json          # Dependências
├── config.example.json   # Exemplo de configuração
├── config.json           # Configuração real (não commitado)
└── README.md             # Documentação do agente
```

### Interface Web

**Funcionalidades:**
- ✅ Visualização em tempo real via `onSnapshot`
- ✅ Cards de estatísticas (Total, Online, Offline, Tinta Baixa)
- ✅ Tabela com todas as impressoras detectadas
- ✅ Filtros por status, tipo e localização
- ✅ Busca por nome, IP ou computador
- ✅ Detalhes expandíveis de cada impressora
- ✅ Alertas automáticos para impressoras offline ou com tinta baixa
- ✅ Indicador de última verificação

**Componente:** `PrintersPage` em `/src/App.jsx`

## 📊 Estrutura de Dados no Firestore

### Coleção: `artifacts/{appId}/printers`

Cada impressora é armazenada com a seguinte estrutura:

```javascript
{
  // Identificação
  name: "Impressora Recepção",
  type: "USB" | "Rede",
  
  // Conectividade
  ip: "192.168.0.100" | null,
  usb_port: "USB001" | null,
  
  // Status
  status: "Online" | "Offline" | "Printing" | "Idle",
  ink_level: 87 | null,  // Percentual (0-100)
  
  // Rastreamento
  last_check: Timestamp,
  location: "Recepção",
  registered_by: "PC da Recepção",
  
  // Metadados
  created_at: Timestamp,
  updated_at: Timestamp
}
```

### ID do Documento

O ID é gerado automaticamente baseado no nome da impressora e computador:
```
{registered_by}_{name}
```

Exemplo: `pc_da_recepcao_impressora_recepcao`

Isso garante que a mesma impressora não seja duplicada.

## ⚙️ Configuração Detalhada

### config.json do Agente

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

### Obter Credenciais do Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá em **Configurações do Projeto** → **Contas de Serviço**
4. Clique em **Gerar nova chave privada**
5. Salve o arquivo JSON baixado
6. Extraia os campos `projectId`, `private_key` e `client_email`

### Configurar SNMP nas Impressoras

Para obter informações detalhadas (nível de tinta) via SNMP:

1. Acesse a interface web da impressora
2. Vá em **Configurações** → **Rede** → **SNMP**
3. Ative o SNMP v1/v2c
4. Defina a community string (padrão: `public`)
5. Salve as configurações

**Nota:** Nem todas as impressoras suportam SNMP ou reportam nível de tinta.

## 🖥️ Executar como Serviço (Windows)

### Opção 1: NSSM (Recomendado)

1. Baixe o [NSSM](https://nssm.cc/download)
2. Execute como administrador:

```cmd
nssm install PrinterMonitor "C:\Program Files\nodejs\node.exe" "C:\caminho\para\agent\index.js"
nssm set PrinterMonitor AppDirectory "C:\caminho\para\agent"
nssm set PrinterMonitor DisplayName "Monitor de Impressoras HPAES"
nssm set PrinterMonitor Description "Agente de monitoramento automático de impressoras"
nssm start PrinterMonitor
```

### Opção 2: Task Scheduler

1. Abra o **Agendador de Tarefas**
2. Criar Tarefa Básica
3. Nome: "Monitor de Impressoras"
4. Disparador: **Ao fazer logon**
5. Ação: **Iniciar um programa**
   - Programa: `node.exe`
   - Argumentos: `index.js`
   - Iniciar em: `C:\caminho\para\agent`
6. Marcar: **Executar com privilégios mais altos**

## 📱 Recursos da Interface Web

### Cards de Estatísticas

- **Total**: Número total de impressoras detectadas
- **Online**: Impressoras ativas e respondendo
- **Offline**: Impressoras sem comunicação
- **Tinta Baixa**: Impressoras com nível < 20%

### Filtros Disponíveis

- **Status**: Todas, Online, Offline, Sem Comunicação (>5 min)
- **Tipo**: Todas, USB, Rede
- **Localização**: Todas, ou localizações específicas detectadas
- **Busca**: Por nome, IP, localização ou computador

### Tabela de Impressoras

Colunas exibidas:
- Nome (com ícone de impressora)
- Tipo (USB/Rede com badge colorido)
- IP/Porta
- Status (com cores: verde=online, vermelho=offline, cinza=sem comunicação)
- Nível de Tinta (barra de progresso colorida)
- Última Verificação (tempo relativo: "2 min atrás")
- Local (localização + computador)
- Ações (expandir detalhes)

### Detalhes Expandidos

Ao clicar no botão de expandir:
- **Informações Detalhadas**: Todos os campos da impressora
- **Nível de Tinta**: Gráfico circular com percentual e status

### Alertas Automáticos

- **Impressoras Offline**: Alerta vermelho quando há impressoras sem comunicação
- **Tinta Baixa**: Alerta amarelo quando há impressoras com tinta < 20%

## 🔧 Solução de Problemas

### Agente não detecta impressoras USB

**Causa:** Permissões insuficientes ou comando WMIC não disponível

**Solução:**
```cmd
# Testar manualmente
wmic printer list brief

# Se não funcionar, executar como administrador
```

### Agente não detecta impressoras de rede

**Causa:** Firewall bloqueando ping ou SNMP

**Solução:**
1. Verificar conectividade: `ping 192.168.0.100`
2. Verificar SNMP: Testar com ferramenta SNMP externa
3. Liberar portas no firewall: ICMP (ping) e UDP 161 (SNMP)

### Impressoras não aparecem no app web

**Causa:** Agente não está enviando dados ou Firebase não configurado

**Solução:**
1. Verificar logs do agente no console
2. Confirmar que o agente está rodando: `npm start`
3. Verificar credenciais do Firebase em `config.json`
4. Verificar regras de segurança do Firestore

### Nível de tinta sempre N/A

**Causa:** Impressora não suporta SNMP ou OID não compatível

**Solução:**
- Nem todas as impressoras reportam nível de tinta via SNMP
- Impressoras USB geralmente não reportam nível de tinta
- Verificar documentação do fabricante para OIDs específicos

### "Sem Comunicação" mesmo com impressora online

**Causa:** Agente parado ou intervalo de verificação muito longo

**Solução:**
1. Verificar se o agente está rodando
2. Reiniciar o agente: `npm start`
3. Reduzir `checkInterval` em `config.json` (padrão: 60000ms)

## 📈 Melhorias Futuras

### Funcionalidades Planejadas

- [ ] **Histórico de Status**: Gráfico de uptime/downtime
- [ ] **Alertas por E-mail**: Notificações automáticas
- [ ] **Previsão de Troca de Tinta**: Baseado em consumo histórico
- [ ] **Contador de Páginas**: Rastreamento de uso
- [ ] **Suporte para Linux/Mac**: Detecção multiplataforma
- [ ] **Dashboard de Custos**: Estimativa de gastos com impressão
- [ ] **Integração com Tickets**: Criar chamados automaticamente
- [ ] **Relatórios PDF**: Exportação de dados

### Otimizações Técnicas

- [ ] Cache local para reduzir consultas ao Firebase
- [ ] Compressão de dados históricos
- [ ] Suporte a múltiplos fabricantes de impressoras
- [ ] API REST para integração com outros sistemas
- [ ] Modo offline com sincronização posterior

## 🔒 Segurança

### Boas Práticas

✅ **Implementadas:**
- Credenciais do Firebase em arquivo local (não commitado)
- Service Account com permissões mínimas
- Validação de dados antes de enviar ao Firestore
- Identificação única por computador

⚠️ **Recomendações:**
- Rotacionar chaves do Firebase periodicamente
- Usar VPN para acesso remoto ao app
- Monitorar logs de acesso ao Firestore
- Implementar rate limiting no Firebase

### Regras de Segurança do Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Impressoras - leitura para autenticados, escrita apenas para service accounts
    match /artifacts/{appId}/printers/{printerId} {
      allow read: if request.auth != null;
      allow write: if false; // Apenas service accounts podem escrever
    }
  }
}
```

**Nota:** O agente usa Service Account, que bypassa as regras de segurança.

## 📞 Suporte

### Logs do Agente

Os logs são exibidos no console ao executar `npm start`:

```
🚀 AGENTE DE MONITORAMENTO DE IMPRESSORAS INICIADO
═══════════════════════════════════════════════════════

✅ Configurações carregadas com sucesso
📍 Computador: PC da Recepção
📍 Local: Recepção
✅ Firebase inicializado com sucesso

═══════════════════════════════════════════════════════
🔍 Iniciando verificação - 15/10/2025 10:30:00
═══════════════════════════════════════════════════════
🖨️  Detectadas 2 impressoras USB
🌐 Verificando 3 impressoras de rede...
  ✅ Impressora Rede 1 (192.168.0.100) - Online
  ✅ Impressora Rede 2 (192.168.0.101) - Online
  ❌ Impressora Rede 3 (192.168.0.102) - Offline
📤 Enviando 5 impressoras para o Firebase...
✅ 5/5 impressoras sincronizadas com sucesso

⏰ Próxima verificação em 60s (10:31:00)
```

### Contato

Para dúvidas ou suporte:
- **Equipe de TI do HPAES**
- **Documentação**: `/agent/README.md`
- **Issues**: Reportar problemas no repositório

---

**Desenvolvido para otimizar o monitoramento de impressoras no Hospital HPAES** 🏥
