# 🚀 Guia Rápido - Bot do Telegram

## ⚡ Início Rápido (5 minutos)

### 1️⃣ Criar o Bot (2 min)

1. Abra o Telegram
2. Procure por **@BotFather**
3. Envie: `/newbot`
4. Escolha um nome: `Rotinas TI HPAES`
5. Escolha um username: `hpaes_rotinas_bot`
6. **Copie o token** que aparece

### 2️⃣ Instalar (1 min)

```bash
cd telegram-bot
npm install
```

### 3️⃣ Configurar (2 min)

```bash
npm run setup
```

Você precisará:
- ✅ Token do bot (copiado no passo 1)
- ✅ Credenciais do Firebase (Project ID, Client Email, Private Key)
- ✅ Seu Telegram ID (obtenha com @userinfobot)

### 4️⃣ Iniciar

```bash
npm start
```

Pronto! 🎉

## 📱 Primeiros Passos no Telegram

1. Procure seu bot no Telegram
2. Envie: `/start`
3. Envie: `/registrar`
4. Selecione seu usuário
5. Pronto para usar!

## 🎯 Comandos Essenciais

```
/pendentes   - Ver rotinas pendentes
/executar    - Marcar rotina como feita
/status      - Ver progresso do dia
/impressoras - Status das impressoras
```

## 🔧 Obter Credenciais do Firebase

1. Acesse: https://console.firebase.google.com/
2. Selecione seu projeto
3. ⚙️ Configurações → Contas de Serviço
4. "Gerar nova chave privada"
5. Baixe o arquivo JSON

## 🆔 Obter seu Telegram ID

1. No Telegram, procure: **@userinfobot**
2. Envie: `/start`
3. Copie o número que aparece

## ❓ Problemas?

### Bot não responde
```bash
# Verifique se está rodando
npm start
```

### Erro no Firebase
- Verifique se a private key está entre aspas no .env
- Confirme o Project ID

### Não aparece na lista de usuários
- Certifique-se de que seu usuário existe no app web
- Tente fazer login no app web primeiro

## 🚀 Executar em Segundo Plano

### Opção 1: PM2 (Recomendado)
```bash
npm install -g pm2
pm2 start index.js --name telegram-bot
pm2 save
```

### Opção 2: Janela separada
- Abra um novo terminal
- Execute `npm start`
- Minimize a janela

## 📊 Verificar se está funcionando

1. No Telegram, envie `/start` para o bot
2. Você deve receber uma mensagem de boas-vindas
3. Envie `/status` para ver o resumo do dia

## 🔔 Configurar Notificações

As notificações são automáticas! O bot verifica rotinas pendentes a cada hora (configurável).

Para alterar o intervalo, edite `.env`:
```env
CHECK_INTERVAL=30  # Verificar a cada 30 minutos
```

## 📖 Documentação Completa

Para mais detalhes, consulte o [README.md](./README.md)

---

💡 **Dica**: Adicione o bot a um grupo do Telegram para que toda a equipe receba as notificações!
