# 📱 Exemplos de Uso - Bot do Telegram

## 🎯 Casos de Uso Práticos

### 1. Técnico Registrando Execução em Campo

**Situação**: João está verificando os servidores e precisa registrar a rotina.

```
João: /executar

Bot: ℹ️ Selecione a rotina para marcar como executada:
     [🖥️ Verificar Servidores]
     [🌐 Testar Conectividade]
     [💾 Verificar Backup]

João: [clica em "Verificar Servidores"]

Bot: ✅ Rotina Executada!
     🖥️ Verificar Servidores
     Por: João Silva
     Horário: 03/11/2024 14:30
```

**Resultado**: A execução aparece instantaneamente no app web e no histórico.

---

### 2. Verificação Rápida do Progresso

**Situação**: Maria quer ver como está o andamento do dia.

```
Maria: /status

Bot: 📊 STATUS DO DIA
     
     📅 03/11/2024
     
     ✅ Executadas: 8
     ⏰ Pendentes: 2
     📊 Progresso: 80%
     
     ██████████░░ 80%
     
     ⚠️ Ainda há 2 rotina(s) pendente(s)!
```

---

### 3. Recebendo Notificação Automática

**Situação**: Às 16h, o bot verifica rotinas pendentes.

```
Bot: 🔔 LEMBRETE DE ROTINAS
     
     Olá João Silva!
     
     Você tem 2 rotina(s) pendente(s) hoje:
     
     🖨️ Verificar Impressoras
     💾 Backup Diário
     
     Use /pendentes para ver todas.
```

---

### 4. Monitorando Impressoras

**Situação**: Admin quer verificar status das impressoras.

```
Admin: /impressoras

Bot: 🖨️ STATUS DAS IMPRESSORAS
     
     ✅ HP LaserJet 1
        IP: 192.168.1.100
        Status: online
     
     ❌ Epson L3150
        IP: 192.168.1.101
        Status: offline
        ⚠️ Tinta baixa!
     
     ✅ Canon G3110
        IP: 192.168.1.102
        Status: online
     
     📊 Resumo
     ✅ Online: 2
     ❌ Offline: 1
     ⚠️ Alertas: 1
```

---

### 5. Consultando Alertas Críticos

**Situação**: Admin recebe notificação e quer detalhes.

```
Admin: /alertas

Bot: ⚠️ ALERTAS ATIVOS
     
     Total: 3
     
     ❌ Epson L3150
        Impressora offline
     
     ⚠️ HP LaserJet 2
        Tinta preta baixa (15%)
     
     ⚠️ Canon G3110
        Tinta ciano baixa (8%)
```

---

### 6. Visualizando Histórico

**Situação**: Gestor quer ver últimas execuções.

```
Gestor: /historico

Bot: 📜 HISTÓRICO RECENTE
     
     Últimas 10 execuções:
     
     ✅ Verificar Servidores
        Por: João Silva
        03/11/2024 14:30
     
     ✅ Backup Diário
        Por: Maria Santos
        03/11/2024 13:15
     
     ✅ Testar Conectividade
        Por: João Silva
        03/11/2024 10:00
     
     ...
```

---

### 7. Primeiro Acesso - Registro

**Situação**: Novo técnico usando o bot pela primeira vez.

```
Pedro: /start

Bot: 🤖 Bem-vindo ao Bot de Rotinas TI - HPAES!
     
     Olá, Pedro! 👋
     
     Eu sou seu assistente para gerenciar rotinas de TI.
     
     📋 Rotinas
     /rotinas - Ver todas as rotinas
     /pendentes - Ver rotinas pendentes hoje
     /executar - Marcar rotina como executada
     
     ...
     
     Digite /registrar para começar!

Pedro: /registrar

Bot: ℹ️ Selecione seu usuário:
     [Pedro Costa (Técnico)]
     [João Silva (Técnico)]
     [Maria Santos (Admin)]

Pedro: [clica em "Pedro Costa (Técnico)"]

Bot: ✅ Registro concluído!
     
     Nome: Pedro Costa
     Tipo: Técnico
     
     Agora você pode usar todos os comandos do bot!
```

---

### 8. Listando Todas as Rotinas

**Situação**: Técnico quer ver todas as rotinas cadastradas.

```
Técnico: /rotinas

Bot: 📋 ROTINAS CADASTRADAS
     
     📅 DIÁRIAS
     🖨️ Verificar Impressoras
        Verificar status e tinta de todas impressoras
     
     💾 Backup Diário
        Verificar se backup automático foi executado
     
     🖥️ Verificar Servidores
        Checar status dos servidores principais
     
     📅 SEMANAIS
     🌐 Teste de Conectividade
        Testar velocidade e estabilidade da rede
     
     📅 MENSAIS
     🔐 Atualização de Senhas
        Renovar senhas de sistemas críticos
```

---

### 9. Verificando Rotinas Pendentes

**Situação**: Início do dia, técnico quer ver o que precisa fazer.

```
Técnico: /pendentes

Bot: ⚠️ ROTINAS PENDENTES HOJE
     
     Total: 3
     
     🖨️ Verificar Impressoras
        Verificar status e tinta de todas impressoras
     
     💾 Backup Diário
        Verificar se backup automático foi executado
     
     🖥️ Verificar Servidores
        Checar status dos servidores principais
     
     [✅ Executar Rotina]
```

---

### 10. Alerta Crítico para Admin

**Situação**: Impressora fica offline, admin recebe alerta automático.

```
Bot → Admin: 🔥 ALERTAS CRÍTICOS
              
              ❌ HP LaserJet Principal está offline
              ⚠️ Epson L3150: Tinta preta crítica (5%)
```

---

## 🔄 Fluxos Completos

### Fluxo 1: Rotina Diária Completa

```
1. Técnico chega ao trabalho
   → /status (ver o que precisa fazer)

2. Bot mostra 5 rotinas pendentes
   → /pendentes (ver detalhes)

3. Técnico executa primeira rotina
   → /executar
   → Seleciona "Verificar Impressoras"
   → Bot confirma execução

4. Técnico verifica progresso
   → /status (agora 4 pendentes)

5. Continua executando...
   → /executar para cada rotina

6. Fim do dia
   → /status (100% completo)
   → Bot: "Parabéns! Todas as rotinas foram executadas!"
```

### Fluxo 2: Resposta a Alerta

```
1. Bot detecta impressora offline
   → Envia alerta para admin

2. Admin verifica detalhes
   → /impressoras (ver todas)
   → /alertas (ver só problemas)

3. Admin vai até a impressora
   → Resolve o problema

4. Agente detecta impressora online
   → Status atualizado automaticamente

5. Admin confirma
   → /impressoras (status OK)
```

### Fluxo 3: Acompanhamento de Equipe

```
1. Gestor quer ver progresso da equipe
   → /status (visão geral)

2. Verifica quem executou o quê
   → /historico (últimas execuções)

3. Identifica rotinas pendentes
   → /pendentes (o que falta)

4. Pode executar ele mesmo se necessário
   → /executar
```

---

## 💡 Dicas de Uso

### Para Técnicos

1. **Comece o dia com `/status`** - Veja o que precisa fazer
2. **Use `/executar` em campo** - Registre na hora
3. **Ative notificações** - Não perca lembretes
4. **Consulte `/historico`** - Veja o que já foi feito

### Para Administradores

1. **Configure alertas** - Adicione seu ID em ADMIN_TELEGRAM_IDS
2. **Monitore impressoras** - Use `/impressoras` regularmente
3. **Acompanhe a equipe** - Use `/historico` para ver execuções
4. **Responda alertas** - Aja rápido em notificações críticas

### Para Gestores

1. **Acompanhe progresso** - `/status` mostra percentual do dia
2. **Verifique histórico** - `/historico` mostra últimas ações
3. **Identifique gargalos** - `/pendentes` mostra o que está atrasado

---

## 🎨 Personalizações

### Alterar Intervalo de Notificações

```env
# .env
CHECK_INTERVAL=30  # Notificar a cada 30 minutos
```

### Adicionar Mais Admins

```env
# .env
ADMIN_TELEGRAM_IDS=123456789,987654321,555666777
```

### Desativar Notificações Automáticas

```env
# .env
CHECK_INTERVAL=0  # Desativa verificações automáticas
```

---

## 📊 Estatísticas de Uso

### Comandos Mais Usados

1. `/status` - Verificação rápida do dia
2. `/executar` - Registro de execuções
3. `/pendentes` - Ver o que falta fazer
4. `/impressoras` - Monitoramento de equipamentos
5. `/historico` - Consulta de execuções passadas

### Horários de Pico

- **08:00-09:00**: Início do dia, verificação de status
- **12:00-13:00**: Meio do dia, execuções
- **16:00-17:00**: Fim do dia, finalização de pendentes

---

## 🔗 Integração com Outros Sistemas

### Com o App Web

- Execuções no bot aparecem no web
- Rotinas criadas no web aparecem no bot
- Usuários sincronizados
- Status em tempo real

### Com o Agente de Impressoras

- Status de impressoras sincronizado
- Alertas automáticos
- Dados atualizados a cada minuto

---

Desenvolvido com ❤️ para otimizar as rotinas de TI via Telegram
