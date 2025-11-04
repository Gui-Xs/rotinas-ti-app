# 🤖 Bot do Telegram - Rotinas TI HPAES

Bot do Telegram integrado ao sistema de gerenciamento de rotinas de TI, permitindo gerenciar rotinas, receber notificações e monitorar impressoras diretamente pelo Telegram.

## 📋 Funcionalidades

### 🎯 Comandos Principais

- **`/start`** - Mensagem de boas-vindas e lista de comandos
- **`/ajuda`** - Exibe ajuda e comandos disponíveis
- **`/registrar`** - Registra seu usuário do sistema no bot

### 📝 Gerenciamento de Rotinas

- **`/rotinas`** - Lista todas as rotinas cadastradas (diárias, semanais, mensais)
- **`/pendentes`** - Mostra rotinas pendentes do dia
- **`/executar`** - Marca uma rotina como executada
- **`/status`** - Exibe resumo do dia com progresso
- **`/historico`** - Mostra últimas 10 execuções

### 🖨️ Monitoramento de Impressoras

- **`/impressoras`** - Status de todas as impressoras monitoradas
- **`/alertas`** - Lista alertas ativos (offline, tinta baixa)

### 🔔 Notificações Automáticas

- **Rotinas Pendentes**: Notificações periódicas sobre rotinas não executadas
- **Alertas Críticos**: Notificações para admins sobre impressoras offline ou tinta crítica

## 🚀 Instalação

### Pré-requisitos

- Node.js 16 ou superior
- Conta no Telegram
- Projeto Firebase configurado
- Credenciais do Firebase Admin SDK

### Passo 1: Criar o Bot no Telegram

1. Abra o Telegram e procure por **@BotFather**
2. Envie o comando `/newbot`
3. Escolha um nome para o bot (ex: "Rotinas TI HPAES")
4. Escolha um username (ex: "hpaes_rotinas_bot")
5. **Copie o token** fornecido pelo BotFather

### Passo 2: Obter Credenciais do Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá em **Configurações do Projeto** (ícone de engrenagem)
4. Clique na aba **Contas de Serviço**
5. Clique em **Gerar nova chave privada**
6. Um arquivo JSON será baixado - guarde-o em segurança

### Passo 3: Instalar Dependências

```bash
cd telegram-bot
npm install
```

### Passo 4: Configurar o Bot

**Opção A: Configuração Interativa (Recomendado)**

```bash
npm run setup
```

Siga as instruções na tela para configurar:
- Token do bot
- Credenciais do Firebase
- App ID
- IDs dos administradores
- Intervalo de verificação

**Opção B: Configuração Manual**

1. Copie o arquivo de exemplo:
```bash
copy .env.example .env
```

2. Edite o arquivo `.env` com suas configurações:

```env
TELEGRAM_BOT_TOKEN=seu_token_aqui
FIREBASE_PROJECT_ID=seu_project_id
FIREBASE_PRIVATE_KEY="sua_private_key_aqui"
FIREBASE_CLIENT_EMAIL=seu_client_email
APP_ID=hpaes-rotinas-ti
ADMIN_TELEGRAM_IDS=123456789,987654321
CHECK_INTERVAL=60
```

### Passo 5: Obter seu Telegram ID

1. No Telegram, procure por **@userinfobot**
2. Envie `/start`
3. Copie o ID fornecido
4. Adicione-o ao arquivo `.env` em `ADMIN_TELEGRAM_IDS`

### Passo 6: Iniciar o Bot

```bash
npm start
```

Você verá:
```
🤖 Bot do Telegram iniciado com sucesso!
ℹ️ Verificações automáticas a cada 60 minutos
🔔 Aguardando comandos...
```

## 📱 Como Usar

### 1. Primeiro Acesso

1. Abra o Telegram e procure pelo seu bot (username escolhido)
2. Envie `/start`
3. Envie `/registrar`
4. Selecione seu usuário na lista
5. Pronto! Agora você pode usar todos os comandos

### 2. Verificar Rotinas Pendentes

```
/pendentes
```

O bot mostrará todas as rotinas diárias que ainda não foram executadas hoje.

### 3. Executar uma Rotina

```
/executar
```

O bot mostrará uma lista de rotinas pendentes. Clique na rotina desejada para marcá-la como executada.

### 4. Ver Status do Dia

```
/status
```

Exibe um resumo com:
- Rotinas executadas
- Rotinas pendentes
- Percentual de conclusão
- Barra de progresso visual

### 5. Monitorar Impressoras

```
/impressoras
```

Mostra o status de todas as impressoras:
- Online/Offline
- Endereço IP
- Nível de tinta
- Alertas

## ⚙️ Configuração Avançada

### Ajustar Intervalo de Notificações

Edite o arquivo `.env`:

```env
# Verificar a cada 30 minutos
CHECK_INTERVAL=30

# Verificar a cada 2 horas
CHECK_INTERVAL=120
```

### Adicionar Mais Administradores

Adicione os IDs separados por vírgula:

```env
ADMIN_TELEGRAM_IDS=123456789,987654321,555666777
```

### Executar em Modo Desenvolvimento

```bash
npm run dev
```

O bot reiniciará automaticamente quando você modificar o código.

## 🔧 Solução de Problemas

### Bot não responde

1. Verifique se o token está correto no `.env`
2. Certifique-se de que o bot está rodando (`npm start`)
3. Verifique os logs no console

### Erro ao conectar com Firebase

1. Verifique se as credenciais estão corretas
2. Certifique-se de que a private key está entre aspas duplas
3. Verifique se o projeto Firebase está ativo

### Não recebo notificações

1. Certifique-se de que você se registrou com `/registrar`
2. Verifique se o `CHECK_INTERVAL` está configurado
3. Aguarde o intervalo configurado

### Erro "User not registered"

Execute `/registrar` e selecione seu usuário na lista.

## 🚀 Executar como Serviço (Windows)

Para manter o bot rodando em segundo plano:

### Usando PM2

1. Instale o PM2 globalmente:
```bash
npm install -g pm2
```

2. Inicie o bot:
```bash
pm2 start index.js --name telegram-bot
```

3. Configure para iniciar com o Windows:
```bash
pm2 startup
pm2 save
```

4. Comandos úteis:
```bash
pm2 status          # Ver status
pm2 logs telegram-bot  # Ver logs
pm2 restart telegram-bot  # Reiniciar
pm2 stop telegram-bot     # Parar
```

### Usando NSSM (Windows Service)

1. Baixe o [NSSM](https://nssm.cc/download)
2. Execute:
```bash
nssm install TelegramBotRotinas
```
3. Configure:
   - Path: `C:\Program Files\nodejs\node.exe`
   - Startup directory: Caminho da pasta telegram-bot
   - Arguments: `index.js`

## 📊 Estrutura de Dados

O bot acessa as seguintes coleções do Firestore:

```
/artifacts/{APP_ID}/
├── users/                    # Usuários do sistema
├── public/data/
│   ├── rotinas/             # Rotinas cadastradas
│   ├── execucoes/           # Execuções registradas
│   └── impressoras/         # Status das impressoras
```

## 🔒 Segurança

- ✅ Token do bot mantido em variável de ambiente
- ✅ Credenciais do Firebase não expostas
- ✅ Apenas usuários registrados podem executar rotinas
- ✅ Notificações críticas apenas para administradores
- ✅ Arquivo `.env` no `.gitignore`

## 📝 Logs

O bot registra no console:
- Comandos recebidos
- Erros de conexão
- Notificações enviadas
- Verificações periódicas

## 🤝 Integração com o Sistema Web

O bot está totalmente integrado com o app web:
- Execuções feitas pelo bot aparecem no histórico web
- Rotinas criadas no web aparecem no bot
- Status de impressoras sincronizado em tempo real
- Usuários compartilhados entre web e bot

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do bot
2. Consulte a seção de Solução de Problemas
3. Entre em contato com a equipe de TI

## 🔄 Atualizações

Para atualizar o bot:

```bash
git pull
npm install
pm2 restart telegram-bot  # Se estiver usando PM2
```

## 📄 Licença

Este projeto é parte do sistema de Rotinas TI HPAES e segue a mesma licença MIT.

---

Desenvolvido com ❤️ para otimizar as rotinas de TI via Telegram
