# 🔥 Configuração do Firebase

## Problema Atual
Você está recebendo erros de permissão porque:
1. A autenticação anônima não está habilitada
2. As regras do Firestore não permitem acesso às coleções

## ✅ Solução - Passo a Passo

### 1. Habilitar Autenticação Anônima

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. No menu lateral, clique em **Authentication**
4. Vá para a aba **Sign-in method**
5. Clique em **Anonymous** (Anônimo)
6. Clique no botão **Enable** (Habilitar)
7. Clique em **Save** (Salvar)

### 2. Atualizar Regras do Firestore

1. No Firebase Console, vá para **Firestore Database**
2. Clique na aba **Rules** (Regras)
3. **Substitua** o conteúdo atual pelas regras abaixo:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regras para artifacts
    match /artifacts/{appId}/{document=**} {
      // Permitir leitura e escrita para usuários autenticados (incluindo anônimos)
      allow read, write: if request.auth != null;
    }
    
    // Regra padrão - negar acesso
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

4. Clique em **Publish** (Publicar)

### 3. Verificar Storage (Opcional - para upload de fotos)

Se você usa upload de fotos, configure as regras do Storage:

1. No Firebase Console, vá para **Storage**
2. Clique na aba **Rules**
3. Use estas regras:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /evidencias/{appId}/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

4. Clique em **Publish**

## 🧪 Testar

Após fazer as configurações:

1. **Limpe o cache do navegador** (Ctrl + Shift + Delete)
2. **Recarregue a página** (F5)
3. A aplicação deve carregar normalmente

## 📊 Estrutura de Dados

O sistema usa estas coleções no Firestore:

```
/artifacts/{appId}/
  ├── users/{userId}                    # Dados dos usuários
  ├── public/data/
  │   ├── rotinas/{rotinaId}           # Rotinas cadastradas
  │   └── execucoes/{execucaoId}       # Execuções de rotinas
  ├── printers/{printerId}             # Impressoras
  ├── stock/
  │   ├── items/list/{itemId}          # Itens do estoque
  │   └── movements/list/{movementId}  # Movimentações
  ├── activityLogs/{logId}             # Logs de atividades
  ├── notifications/{notificationId}   # Notificações
  └── scheduledRoutines/{scheduleId}   # Rotinas agendadas
```

## 🔒 Segurança

As regras atuais permitem acesso a usuários autenticados (incluindo anônimos).

**Para produção**, considere:
- Remover autenticação anônima
- Implementar login com email/senha
- Adicionar regras mais restritivas baseadas em roles
- Validar dados no servidor

## ❓ Problemas Comuns

### Erro: "Missing or insufficient permissions"
- ✅ Verifique se as regras do Firestore foram publicadas
- ✅ Verifique se a autenticação anônima está habilitada
- ✅ Limpe o cache do navegador

### Erro: "auth/admin-restricted-operation"
- ✅ Habilite a autenticação anônima no Firebase Console

### Página fica carregando infinitamente
- ✅ Abra o Console do navegador (F12) para ver erros
- ✅ Verifique se as regras estão corretas
- ✅ Verifique a conexão com internet

## 📞 Suporte

Se os problemas persistirem:
1. Verifique o console do navegador (F12)
2. Verifique o Firebase Console para erros
3. Confirme que o `appId` no código está correto
