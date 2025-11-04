# ✅ Checklist de Instalação - Bot do Telegram

Use este checklist para garantir que tudo está configurado corretamente.

## 📋 Pré-requisitos

- [ ] Node.js 16+ instalado
- [ ] npm instalado
- [ ] Conta no Telegram
- [ ] Projeto Firebase ativo
- [ ] Acesso ao Firebase Console

## 🤖 Criar o Bot no Telegram

- [ ] Abrir o Telegram
- [ ] Procurar por **@BotFather**
- [ ] Enviar `/newbot`
- [ ] Escolher nome do bot (ex: "Rotinas TI HPAES")
- [ ] Escolher username (ex: "hpaes_rotinas_bot")
- [ ] **Copiar e guardar o token fornecido**

## 🔑 Obter Credenciais do Firebase

- [ ] Acessar [Firebase Console](https://console.firebase.google.com/)
- [ ] Selecionar o projeto
- [ ] Ir em ⚙️ **Configurações do Projeto**
- [ ] Clicar na aba **Contas de Serviço**
- [ ] Clicar em **Gerar nova chave privada**
- [ ] Baixar o arquivo JSON
- [ ] Guardar em local seguro

## 🆔 Obter Telegram ID

- [ ] No Telegram, procurar **@userinfobot**
- [ ] Enviar `/start`
- [ ] **Copiar o ID numérico fornecido**

## 📦 Instalação

- [ ] Abrir terminal/PowerShell
- [ ] Navegar até a pasta: `cd telegram-bot`
- [ ] Instalar dependências: `npm install`
- [ ] Aguardar conclusão da instalação

## ⚙️ Configuração

### Opção A: Configuração Interativa (Recomendado)

- [ ] Executar: `npm run setup`
- [ ] Informar token do bot
- [ ] Informar Project ID do Firebase
- [ ] Informar Client Email do Firebase
- [ ] Informar Private Key do Firebase
- [ ] Informar APP_ID (padrão: hpaes-rotinas-ti)
- [ ] Informar IDs dos administradores
- [ ] Informar intervalo de verificação (padrão: 60)
- [ ] Verificar se arquivo `.env` foi criado

### Opção B: Configuração Manual

- [ ] Copiar `.env.example` para `.env`
- [ ] Editar `.env` com editor de texto
- [ ] Preencher `TELEGRAM_BOT_TOKEN`
- [ ] Preencher `FIREBASE_PROJECT_ID`
- [ ] Preencher `FIREBASE_PRIVATE_KEY` (entre aspas duplas)
- [ ] Preencher `FIREBASE_CLIENT_EMAIL`
- [ ] Preencher `APP_ID`
- [ ] Preencher `ADMIN_TELEGRAM_IDS`
- [ ] Preencher `CHECK_INTERVAL`
- [ ] Salvar arquivo

## 🚀 Iniciar o Bot

- [ ] Executar: `npm start`
- [ ] Verificar mensagem: "Bot do Telegram iniciado com sucesso!"
- [ ] Verificar se não há erros no console
- [ ] Manter terminal aberto

## 📱 Testar no Telegram

- [ ] Abrir o Telegram
- [ ] Procurar pelo bot (username escolhido)
- [ ] Enviar `/start`
- [ ] Verificar se bot responde
- [ ] Enviar `/registrar`
- [ ] Selecionar seu usuário na lista
- [ ] Verificar confirmação de registro

## ✅ Testar Comandos

- [ ] `/status` - Ver resumo do dia
- [ ] `/rotinas` - Listar todas as rotinas
- [ ] `/pendentes` - Ver rotinas pendentes
- [ ] `/executar` - Tentar executar uma rotina
- [ ] `/historico` - Ver histórico
- [ ] `/impressoras` - Ver status das impressoras
- [ ] `/alertas` - Ver alertas ativos

## 🔔 Verificar Notificações

- [ ] Aguardar intervalo configurado (padrão: 60 min)
- [ ] Verificar se recebe notificação de rotinas pendentes
- [ ] Se for admin, verificar alertas de impressoras

## 🔧 Configurar para Produção (Opcional)

### Opção 1: PM2

- [ ] Instalar PM2: `npm install -g pm2`
- [ ] Iniciar bot: `pm2 start index.js --name telegram-bot`
- [ ] Configurar startup: `pm2 startup`
- [ ] Salvar configuração: `pm2 save`
- [ ] Verificar status: `pm2 status`

### Opção 2: Windows Service (NSSM)

- [ ] Baixar NSSM de https://nssm.cc/download
- [ ] Executar: `nssm install TelegramBotRotinas`
- [ ] Configurar caminho do Node.js
- [ ] Configurar pasta do projeto
- [ ] Configurar argumentos: `index.js`
- [ ] Iniciar serviço

## 📊 Verificações Finais

- [ ] Bot responde a comandos
- [ ] Execuções aparecem no app web
- [ ] Notificações funcionam
- [ ] Logs não mostram erros
- [ ] Todos os usuários conseguem se registrar
- [ ] Impressoras são listadas corretamente

## 🐛 Solução de Problemas

### Bot não responde

- [ ] Verificar se está rodando: `pm2 status` ou verificar terminal
- [ ] Verificar token no `.env`
- [ ] Verificar conexão com internet
- [ ] Reiniciar bot: `pm2 restart telegram-bot` ou `npm start`

### Erro no Firebase

- [ ] Verificar se private_key está entre aspas duplas
- [ ] Verificar se não há espaços extras
- [ ] Verificar project_id
- [ ] Regenerar chave no Firebase Console

### Usuário não aparece na lista

- [ ] Verificar se usuário existe no app web
- [ ] Fazer login no app web primeiro
- [ ] Verificar APP_ID no `.env`
- [ ] Verificar logs do bot

### Notificações não chegam

- [ ] Verificar se você se registrou com `/registrar`
- [ ] Verificar CHECK_INTERVAL no `.env`
- [ ] Aguardar o intervalo configurado
- [ ] Verificar logs: `pm2 logs telegram-bot`

## 📚 Documentação

- [ ] Ler `README.md` completo
- [ ] Ler `QUICK_START.md`
- [ ] Consultar `EXEMPLOS_USO.md`
- [ ] Revisar `TELEGRAM_INTEGRATION.md`

## 👥 Registrar Equipe

Para cada membro da equipe:

- [ ] Enviar link do bot
- [ ] Instruir a enviar `/start`
- [ ] Instruir a enviar `/registrar`
- [ ] Verificar se conseguiu se registrar
- [ ] Testar um comando básico

## 🎉 Conclusão

- [ ] Bot instalado e funcionando
- [ ] Todos os comandos testados
- [ ] Notificações configuradas
- [ ] Equipe registrada
- [ ] Documentação lida
- [ ] Pronto para uso em produção!

---

## 📝 Notas

**Data de Instalação**: ___/___/______

**Instalado por**: _____________________

**Token do Bot**: Guardado em local seguro? [ ]

**Problemas Encontrados**: 

_________________________________________________

_________________________________________________

**Observações**:

_________________________________________________

_________________________________________________

---

## 🆘 Precisa de Ajuda?

1. Consulte a seção de Solução de Problemas acima
2. Verifique os logs: `pm2 logs telegram-bot`
3. Leia `telegram-bot/README.md`
4. Entre em contato com a equipe de TI

---

✅ **Checklist Completo!** O bot está pronto para uso.

Desenvolvido com ❤️ para otimizar as rotinas de TI via Telegram
