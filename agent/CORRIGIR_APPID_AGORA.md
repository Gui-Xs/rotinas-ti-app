# 🚨 CORREÇÃO URGENTE: AppId Incorreto

## 🐛 Problema Identificado

O agente está enviando dados para o Firebase no caminho **errado**:

- ❌ **Atual**: `/artifacts/rotinas-ti-hpaes/printers`
- ✅ **Correto**: `/artifacts/rotinas-ti-app/printers`

Por isso as impressoras não aparecem no app!

---

## ✅ SOLUÇÃO RÁPIDA (2 minutos)

### Passo 1: Localizar o arquivo config.json

O arquivo está em:
```
C:\Users\igor rodrigues\CascadeProjects\rotinas-ti-app\agent\config.json
```

### Passo 2: Editar o arquivo

1. Abra o arquivo `config.json` com um editor de texto (Notepad, VS Code, etc.)
2. Procure pela linha que contém `"appId"`
3. Altere de:
   ```json
   "appId": "rotinas-ti-hpaes",
   ```
   Para:
   ```json
   "appId": "rotinas-ti-app",
   ```

### Passo 3: Salvar e Reiniciar

1. **Salve** o arquivo
2. **Pare** o agente (Ctrl+C se estiver rodando)
3. **Inicie** novamente o agente

---

## 📋 Exemplo Completo

Seu `config.json` deve ficar assim:

```json
{
  "firebase": {
    "projectId": "seu-project-id",
    "privateKey": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
    "clientEmail": "firebase-adminsdk-xxxxx@seu-project-id.iam.gserviceaccount.com"
  },
  "appId": "rotinas-ti-app",  ← ESTA LINHA DEVE ESTAR ASSIM
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

---

## 🔍 Como Verificar se Funcionou

### No Console do Agente:

Após reiniciar, você deve ver:
```
✅ Configurações carregadas com sucesso
📍 Computador: [seu computador]
📍 Local: [sua localização]
🖨️  Detectadas X impressoras USB
📤 Enviando X impressoras para o Firebase...
✅ X/X impressoras sincronizadas com sucesso
```

### No Firebase Console:

1. Acesse: https://console.firebase.google.com
2. Vá em **Firestore Database**
3. Navegue até: `artifacts` → `rotinas-ti-app` → `printers`
4. Você deve ver os documentos das impressoras

### No App:

1. Abra o app **Rotinas TI**
2. Vá na página **Impressoras**
3. As impressoras devem aparecer na lista

---

## 🆘 Ainda não funciona?

### Verificação 1: Arquivo config.json existe?

Execute no PowerShell:
```powershell
Test-Path "C:\Users\igor rodrigues\CascadeProjects\rotinas-ti-app\agent\config.json"
```

Se retornar `False`, você precisa criar o arquivo:
```powershell
cd "C:\Users\igor rodrigues\CascadeProjects\rotinas-ti-app\agent"
Copy-Item config.example.json config.json
```
Depois edite o `config.json` com suas credenciais.

### Verificação 2: Ver conteúdo do config.json

Execute no PowerShell:
```powershell
Get-Content "C:\Users\igor rodrigues\CascadeProjects\rotinas-ti-app\agent\config.json"
```

Verifique se o `appId` está como `"rotinas-ti-app"`.

### Verificação 3: Limpar dados antigos do Firebase

Se houver dados antigos em `rotinas-ti-hpaes`, você pode:

1. Acessar o Firebase Console
2. Ir em `artifacts` → `rotinas-ti-hpaes` → `printers`
3. Deletar os documentos antigos (opcional)

---

## 📞 Precisa de Ajuda?

Se o problema persistir, forneça:
1. Conteúdo do `config.json` (sem mostrar a chave privada)
2. Logs do console do agente
3. Screenshot do Firebase Console mostrando a estrutura de coleções
