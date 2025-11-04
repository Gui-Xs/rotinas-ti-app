# 🤖 Integração com Telegram - Sistema de Rotinas TI

## 📱 Visão Geral

O Bot do Telegram permite gerenciar rotinas de TI diretamente pelo aplicativo de mensagens, oferecendo:

- ✅ **Execução de rotinas** via comandos
- 🔔 **Notificações automáticas** de rotinas pendentes
- 📊 **Monitoramento em tempo real** de impressoras
- 🚨 **Alertas críticos** para administradores
- 📈 **Relatórios de progresso** diário

## 🎯 Funcionalidades

### Para Técnicos e Estagiários

- Visualizar rotinas pendentes do dia
- Marcar rotinas como executadas
- Consultar histórico de execuções
- Ver status das impressoras
- Receber lembretes automáticos

### Para Administradores

- Todas as funcionalidades de técnicos
- Receber alertas críticos de impressoras
- Monitorar progresso da equipe
- Gerenciar notificações

## 🚀 Instalação Rápida

### 1. Criar o Bot no Telegram

```
1. Abra o Telegram
2. Procure por @BotFather
3. Envie: /newbot
4. Siga as instruções
5. Copie o token fornecido
```

### 2. Instalar Dependências

```bash
cd telegram-bot
npm install
```

### 3. Configurar

```bash
npm run setup
```

Ou use o instalador Windows:
```bash
INSTALAR.bat
```

### 4. Iniciar o Bot

```bash
npm start
```

Ou use:
```bash
INICIAR.bat
```

## 📋 Comandos Disponíveis

### Comandos Básicos

| Comando | Descrição |
|---------|-----------|
| `/start` | Mensagem de boas-vindas e ajuda |
| `/ajuda` | Lista de comandos disponíveis |
| `/registrar` | Vincular conta do sistema ao Telegram |

### Gerenciamento de Rotinas

| Comando | Descrição | Exemplo |
|---------|-----------|---------|
| `/rotinas` | Lista todas as rotinas | Mostra diárias, semanais e mensais |
| `/pendentes` | Rotinas não executadas hoje | Lista com botões de ação |
| `/executar` | Marcar rotina como feita | Seleção interativa |
| `/status` | Resumo do progresso do dia | Mostra % de conclusão |
| `/historico` | Últimas 10 execuções | Com data e responsável |

### Monitoramento de Impressoras

| Comando | Descrição | Informações |
|---------|-----------|-------------|
| `/impressoras` | Status de todas impressoras | Online/Offline, IP, tinta |
| `/alertas` | Alertas ativos | Offline, tinta baixa/crítica |

## 🔔 Sistema de Notificações

### Notificações Automáticas

O bot verifica periodicamente e envia notificações sobre:

#### 1. Rotinas Pendentes
- **Frequência**: Configurável (padrão: 60 minutos)
- **Destinatários**: Todos os usuários registrados
- **Conteúdo**: Lista de rotinas não executadas

#### 2. Alertas de Impressoras
- **Frequência**: Configurável (padrão: 60 minutos)
- **Destinatários**: Apenas administradores
- **Conteúdo**: 
  - Impressoras offline
  - Tinta em nível crítico (<10%)

### Configurar Intervalo

Edite o arquivo `.env`:

```env
# Verificar a cada 30 minutos
CHECK_INTERVAL=30

# Verificar a cada 2 horas
CHECK_INTERVAL=120
```

## 🔧 Configuração Detalhada

### Arquivo .env

```env
# Token do Bot (obtenha com @BotFather)
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11

# Firebase Admin SDK
FIREBASE_PROJECT_ID=seu-projeto-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@seu-projeto.iam.gserviceaccount.com

# App ID (mesmo do app web)
APP_ID=hpaes-rotinas-ti

# IDs dos administradores (obtenha com @userinfobot)
ADMIN_TELEGRAM_IDS=123456789,987654321

# Intervalo de verificação (minutos)
CHECK_INTERVAL=60
```

### Obter Credenciais do Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. ⚙️ **Configurações do Projeto**
4. Aba **Contas de Serviço**
5. Clique em **Gerar nova chave privada**
6. Baixe o arquivo JSON
7. Use os valores:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

### Obter Telegram ID

1. No Telegram, procure: **@userinfobot**
2. Envie: `/start`
3. Copie o ID numérico fornecido
4. Adicione ao `.env` em `ADMIN_TELEGRAM_IDS`

## 💡 Casos de Uso

### Cenário 1: Técnico em Campo

```
Técnico está em campo e precisa registrar execução:

1. Abre o Telegram
2. Envia /executar para o bot
3. Seleciona a rotina executada
4. Bot confirma e registra no sistema
5. Execução aparece no app web instantaneamente
```

### Cenário 2: Lembrete de Rotinas

```
Sistema detecta rotinas pendentes:

1. Bot verifica rotinas não executadas
2. Envia notificação para todos os técnicos
3. Lista as rotinas pendentes
4. Técnicos podem executar direto pelo Telegram
```

### Cenário 3: Alerta de Impressora

```
Impressora fica offline:

1. Agente detecta impressora offline
2. Bot verifica alertas críticos
3. Envia notificação para administradores
4. Admin pode verificar status com /impressoras
```

### Cenário 4: Acompanhamento Diário

```
Gestor quer ver progresso:

1. Envia /status para o bot
2. Recebe resumo com:
   - Rotinas executadas
   - Rotinas pendentes
   - Percentual de conclusão
   - Barra de progresso visual
```

## 🔄 Integração com o Sistema Web

### Sincronização Bidirecional

- ✅ Execuções feitas no bot aparecem no web
- ✅ Execuções feitas no web aparecem no bot
- ✅ Rotinas criadas no web disponíveis no bot
- ✅ Status de impressoras sincronizado
- ✅ Usuários compartilhados

### Identificação de Origem

Execuções feitas pelo bot são marcadas com:
```javascript
{
  origem: 'telegram',
  observacao: 'Executado via Telegram Bot'
}
```

## 🚀 Executar em Produção

### Opção 1: PM2 (Recomendado)

```bash
# Instalar PM2
npm install -g pm2

# Iniciar bot
pm2 start index.js --name telegram-bot

# Configurar para iniciar com o sistema
pm2 startup
pm2 save

# Comandos úteis
pm2 status              # Ver status
pm2 logs telegram-bot   # Ver logs em tempo real
pm2 restart telegram-bot # Reiniciar
pm2 stop telegram-bot    # Parar
```

### Opção 2: Windows Service (NSSM)

```bash
# Baixar NSSM: https://nssm.cc/download

# Instalar serviço
nssm install TelegramBotRotinas

# Configurar:
# - Path: C:\Program Files\nodejs\node.exe
# - Startup directory: [caminho da pasta telegram-bot]
# - Arguments: index.js

# Gerenciar serviço
nssm start TelegramBotRotinas
nssm stop TelegramBotRotinas
nssm restart TelegramBotRotinas
```

### Opção 3: Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

CMD ["node", "index.js"]
```

```bash
# Build
docker build -t telegram-bot-rotinas .

# Run
docker run -d --name telegram-bot --env-file .env telegram-bot-rotinas
```

## 🔒 Segurança

### Boas Práticas

- ✅ Token do bot em variável de ambiente
- ✅ Credenciais Firebase não expostas
- ✅ Arquivo `.env` no `.gitignore`
- ✅ Apenas usuários registrados podem executar ações
- ✅ Notificações críticas apenas para admins
- ✅ Validação de permissões em cada comando

### Recomendações

1. **Não compartilhe** o token do bot
2. **Não commite** o arquivo `.env`
3. **Restrinja** IDs de administradores
4. **Monitore** logs regularmente
5. **Atualize** dependências periodicamente

## 🐛 Solução de Problemas

### Bot não responde

**Problema**: Bot não responde aos comandos

**Soluções**:
```bash
# 1. Verificar se está rodando
pm2 status

# 2. Ver logs de erro
pm2 logs telegram-bot

# 3. Reiniciar
pm2 restart telegram-bot

# 4. Verificar token
# Edite .env e confirme o token
```

### Erro de autenticação Firebase

**Problema**: `Error: Could not load the default credentials`

**Soluções**:
1. Verifique se a `FIREBASE_PRIVATE_KEY` está entre aspas duplas
2. Confirme que não há espaços extras
3. Verifique se o `FIREBASE_PROJECT_ID` está correto
4. Regenere a chave privada no Firebase Console

### Usuário não encontrado

**Problema**: "Você precisa se registrar primeiro"

**Soluções**:
1. Envie `/registrar` no bot
2. Selecione seu usuário na lista
3. Se não aparecer na lista, faça login no app web primeiro
4. Verifique se o `APP_ID` está correto no `.env`

### Notificações não chegam

**Problema**: Não recebo notificações automáticas

**Soluções**:
1. Verifique se você se registrou com `/registrar`
2. Confirme o `CHECK_INTERVAL` no `.env`
3. Aguarde o intervalo configurado
4. Verifique os logs: `pm2 logs telegram-bot`

## 📊 Monitoramento

### Logs

```bash
# Ver logs em tempo real
pm2 logs telegram-bot

# Ver logs específicos
pm2 logs telegram-bot --lines 100

# Limpar logs
pm2 flush telegram-bot
```

### Métricas

```bash
# Status e uso de recursos
pm2 status

# Monitoramento detalhado
pm2 monit
```

## 🔄 Atualizações

### Atualizar o Bot

```bash
# Parar o bot
pm2 stop telegram-bot

# Atualizar código
git pull

# Instalar novas dependências
npm install

# Reiniciar
pm2 restart telegram-bot
```

## 📚 Recursos Adicionais

### Documentação

- 📖 [README.md](./telegram-bot/README.md) - Documentação completa
- 🚀 [QUICK_START.md](./telegram-bot/QUICK_START.md) - Guia rápido
- 📋 [README.md principal](./README.md) - Sistema completo

### Links Úteis

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)

## 🤝 Suporte

Para dúvidas ou problemas:

1. Consulte a seção de Solução de Problemas
2. Verifique os logs do bot
3. Entre em contato com a equipe de TI

## 📝 Changelog

### v1.0.0 (2024)
- ✨ Lançamento inicial
- 📋 Comandos de gerenciamento de rotinas
- 🖨️ Monitoramento de impressoras
- 🔔 Sistema de notificações automáticas
- 🔐 Sistema de registro de usuários

---

Desenvolvido com ❤️ para otimizar as rotinas de TI via Telegram
