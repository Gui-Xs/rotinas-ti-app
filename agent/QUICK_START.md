# 🚀 Guia Rápido - Monitoramento de Impressoras

## ⚡ Início em 3 Passos

### 1️⃣ Instalar Dependências

```bash
cd agent
npm install
```

### 2️⃣ Configurar

**Opção A: Configuração Automática (Recomendado)**

```bash
npm run setup
```

Responda as perguntas:
- Firebase Project ID
- Firebase Client Email
- Firebase Private Key (cole e pressione Enter 2x)
- Nome do computador (ex: "PC da Recepção")
- Local/Setor (ex: "Recepção")
- Intervalo de verificação (padrão: 60 segundos)
- Impressoras de rede (opcional)

**Opção B: Configuração Manual**

1. Copie `config.example.json` para `config.json`
2. Edite com suas credenciais do Firebase
3. Configure nome do computador e localização

### 3️⃣ Iniciar

```bash
npm start
```

Pronto! O agente começará a monitorar as impressoras automaticamente.

---

## 📋 Obter Credenciais do Firebase

1. Acesse https://console.firebase.google.com/
2. Selecione seu projeto
3. **Configurações do Projeto** (ícone de engrenagem) → **Contas de Serviço**
4. Clique em **Gerar nova chave privada**
5. Salve o arquivo JSON
6. Abra o arquivo e copie:
   - `project_id` → Firebase Project ID
   - `client_email` → Firebase Client Email
   - `private_key` → Firebase Private Key

---

## 🖥️ Executar Automaticamente no Windows

### Método 1: Iniciar com o Windows (Task Scheduler)

1. Pressione `Win + R`, digite `taskschd.msc`
2. **Criar Tarefa Básica**
3. Nome: "Monitor de Impressoras"
4. Disparador: **Ao fazer logon**
5. Ação: **Iniciar um programa**
   - Programa: `C:\Program Files\nodejs\node.exe`
   - Argumentos: `index.js`
   - Iniciar em: `C:\Users\igor rodrigues\CascadeProjects\rotinas-ti-app\agent`
6. Finalizar

### Método 2: Serviço do Windows (NSSM)

```cmd
# Baixe NSSM: https://nssm.cc/download
# Execute como administrador:

nssm install PrinterMonitor "C:\Program Files\nodejs\node.exe" "C:\Users\igor rodrigues\CascadeProjects\rotinas-ti-app\agent\index.js"
nssm set PrinterMonitor AppDirectory "C:\Users\igor rodrigues\CascadeProjects\rotinas-ti-app\agent"
nssm start PrinterMonitor
```

---

## 🌐 Adicionar Impressoras de Rede

Edite `config.json` e adicione no array `networkPrinters`:

```json
{
  "networkPrinters": [
    {
      "name": "Impressora Consultório 1",
      "ip": "192.168.0.100",
      "snmpCommunity": "public"
    },
    {
      "name": "Impressora Recepção",
      "ip": "192.168.0.101",
      "snmpCommunity": "public"
    }
  ]
}
```

Reinicie o agente para aplicar as mudanças.

---

## ✅ Verificar se Está Funcionando

### No Console

Você verá logs como:

```
✅ Configurações carregadas com sucesso
✅ Firebase inicializado com sucesso
🖨️  Detectadas 2 impressoras USB
🌐 Verificando 3 impressoras de rede...
  ✅ Impressora Rede 1 (192.168.0.100) - Online
📤 Enviando 5 impressoras para o Firebase...
✅ 5/5 impressoras sincronizadas com sucesso
```

### No App Web

1. Acesse o app web
2. Vá na página **"Impressoras"**
3. As impressoras aparecerão automaticamente na tabela

---

## 🐛 Problemas Comuns

### "Erro ao carregar config.json"

**Solução:** Execute `npm run setup` ou crie o arquivo `config.json` manualmente.

### "Nenhuma impressora detectada"

**Solução:**
- **USB**: Verifique se há impressoras conectadas localmente
- **Rede**: Verifique se os IPs estão corretos em `config.json`
- Execute como administrador para detectar impressoras USB

### "Erro ao inicializar Firebase"

**Solução:** Verifique se as credenciais em `config.json` estão corretas.

### Impressoras não aparecem no app web

**Solução:**
1. Verifique se o agente está rodando
2. Confirme que o Firebase está configurado corretamente
3. Verifique a conexão com a internet

---

## 📚 Documentação Completa

Para mais detalhes, consulte:
- **README.md** - Documentação completa do agente
- **PRINTER_MONITORING.md** - Documentação do sistema completo

---

## 💡 Dicas

✅ **Execute em cada computador** que tem impressoras conectadas  
✅ **Use nomes descritivos** para identificar facilmente cada computador  
✅ **Configure SNMP** nas impressoras de rede para obter nível de tinta  
✅ **Monitore os logs** para identificar problemas rapidamente  

---

**Desenvolvido para HPAES TI** 🏥
