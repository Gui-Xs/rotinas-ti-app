# 🚀 Guia de Deploy - GitHub Pages + Firebase

Este guia mostra como fazer o deploy do app de Rotinas TI no GitHub Pages usando Firebase como banco de dados.

## 📋 Pré-requisitos

1. Conta no GitHub
2. Conta no Firebase (Google)
3. Git instalado
4. Node.js instalado

---

## 🔥 Passo 1: Configurar o Firebase

### 1.1 Criar Projeto no Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em **"Adicionar projeto"**
3. Dê um nome ao projeto (ex: `rotinas-ti-hpaes`)
4. Desabilite o Google Analytics (opcional)
5. Clique em **"Criar projeto"**

### 1.2 Ativar Autenticação

1. No menu lateral, clique em **"Authentication"**
2. Clique em **"Começar"**
3. Na aba **"Sign-in method"**, ative:
   - **E-mail/senha** (clique em "Ativar" e salve)

### 1.3 Criar Firestore Database

1. No menu lateral, clique em **"Firestore Database"**
2. Clique em **"Criar banco de dados"**
3. Escolha **"Iniciar no modo de produção"**
4. Selecione a localização (ex: `southamerica-east1` para São Paulo)
5. Clique em **"Ativar"**

### 1.4 Configurar Regras do Firestore

Na aba **"Regras"**, substitua o conteúdo por:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId || 
                     get(/databases/$(database)/documents/artifacts/$(appId)/users/$(request.auth.uid)).data.tipo == 'admin';
    }
    
    match /artifacts/{appId}/public/data/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

Clique em **"Publicar"**.

### 1.5 Ativar Storage

1. No menu lateral, clique em **"Storage"**
2. Clique em **"Começar"**
3. Aceite as regras padrão
4. Selecione a mesma localização do Firestore
5. Clique em **"Concluído"**

### 1.6 Configurar Regras do Storage

Na aba **"Regras"**, substitua por:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /evidencias/{appId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.resource.size < 10 * 1024 * 1024;
    }
  }
}
```

Clique em **"Publicar"**.

### 1.7 Obter Credenciais

1. Clique no ícone de **engrenagem** ⚙️ ao lado de "Visão geral do projeto"
2. Clique em **"Configurações do projeto"**
3. Role até **"Seus aplicativos"**
4. Clique no ícone **"</>"** (Web)
5. Dê um apelido ao app (ex: `rotinas-ti-web`)
6. **NÃO** marque Firebase Hosting
7. Clique em **"Registrar app"**
8. Copie o objeto `firebaseConfig`

---

## 📝 Passo 2: Configurar o Projeto

### 2.1 Editar arquivo de configuração

Abra o arquivo `src/firebase.config.js` e substitua pelas suas credenciais:

```javascript
export const firebaseConfig = {
  apiKey: "AIza...",  // Cole suas credenciais aqui
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};

export const appId = "rotinas-ti-app";
```

### 2.2 Atualizar configurações do GitHub Pages

Edite os seguintes arquivos substituindo os placeholders:

**`package.json`** - Linha 4:
```json
"homepage": "https://seu-usuario.github.io/rotinas-ti-app",
```

**`vite.config.js`** - Linha 7:
```javascript
base: process.env.NODE_ENV === 'production' ? '/rotinas-ti-app/' : '/',
```

> ⚠️ **Importante**: Substitua `seu-usuario` pelo seu username do GitHub e `rotinas-ti-app` pelo nome do seu repositório.

---

## 🐙 Passo 3: Criar Repositório no GitHub

### 3.1 Criar repositório

1. Acesse [GitHub](https://github.com)
2. Clique em **"New repository"**
3. Nome: `rotinas-ti-app` (ou outro nome)
4. Deixe como **Público**
5. **NÃO** inicialize com README
6. Clique em **"Create repository"**

### 3.2 Fazer push do código

No terminal, dentro da pasta do projeto:

```bash
# Inicializar git (se ainda não foi feito)
git init

# Adicionar todos os arquivos
git add .

# Fazer commit
git commit -m "Initial commit - Rotinas TI App"

# Adicionar remote (substitua SEU-USUARIO e NOME-REPO)
git remote add origin https://github.com/SEU-USUARIO/NOME-REPO.git

# Renomear branch para main (se necessário)
git branch -M main

# Fazer push
git push -u origin main
```

---

## ⚙️ Passo 4: Configurar GitHub Pages

### 4.1 Ativar GitHub Pages

1. No seu repositório, vá em **Settings** (Configurações)
2. No menu lateral, clique em **Pages**
3. Em **"Source"**, selecione:
   - Source: **GitHub Actions**

### 4.2 Deploy automático

O GitHub Actions já está configurado! Cada push na branch `main` fará deploy automaticamente.

Para verificar o progresso:
1. Vá na aba **Actions** do repositório
2. Veja o workflow **"Deploy to GitHub Pages"** rodando

---

## 🎉 Passo 5: Acessar o App

Após o deploy concluir (2-3 minutos):

**URL do app**: `https://seu-usuario.github.io/rotinas-ti-app/`

---

## 👤 Passo 6: Criar Primeiro Usuário Admin

1. Acesse o app
2. Clique em **"Cadastre-se"**
3. Preencha:
   - Nome completo
   - E-mail
   - Senha
4. Clique em **"Cadastrar"**

### 6.1 Tornar usuário Admin (via Firebase Console)

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá em **Firestore Database**
4. Navegue até: `artifacts` > `rotinas-ti-app` > `users` > `[ID do usuário]`
5. Clique no documento do usuário
6. Edite o campo `tipo` de `tecnico` para `admin`
7. Salve

Agora você tem acesso à área de administração! 🎊

---

## 🔄 Deploy Manual (Alternativo)

Se preferir fazer deploy manual sem GitHub Actions:

```bash
# Instalar dependências
npm install

# Fazer build
npm run build

# Deploy para GitHub Pages
npm run deploy
```

---

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento local
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview

# Deploy manual
npm run deploy
```

---

## 📊 Estrutura de Dados no Firestore

Após criar o primeiro admin, você pode criar rotinas pela interface. A estrutura será:

```
/artifacts/rotinas-ti-app/
├── users/
│   └── {userId}/
│       ├── nome: "João Silva"
│       ├── email: "joao@example.com"
│       └── tipo: "admin"
│
└── public/data/
    ├── rotinas/
    │   └── {rotinaId}/
    │       ├── nome: "Verificar Backup"
    │       ├── descricao: "Verificar se backup foi executado"
    │       ├── categoria: "Backup"
    │       └── frequencia: "diaria"
    │
    └── execucoes/
        └── {execucaoId}/
            ├── rotinaId: "abc123"
            ├── dataHora: timestamp
            ├── responsavelId: "user123"
            ├── responsavelNome: "João Silva"
            ├── observacao: "Tudo OK"
            └── fotoUrl: "https://..."
```

---

## 🔒 Segurança

### Domínios Autorizados

Para evitar uso não autorizado do Firebase:

1. No Firebase Console, vá em **Authentication**
2. Clique na aba **Settings**
3. Role até **"Authorized domains"**
4. Adicione: `seu-usuario.github.io`

---

## 🐛 Troubleshooting

### Erro: "Firebase: Error (auth/unauthorized-domain)"

**Solução**: Adicione o domínio do GitHub Pages nos domínios autorizados do Firebase (veja seção Segurança acima).

### Página em branco após deploy

**Solução**: Verifique se o `base` no `vite.config.js` está correto com o nome do repositório.

### Erro 404 ao recarregar página

**Solução**: GitHub Pages não suporta SPA routing nativamente. O app já está configurado para usar hash routing se necessário.

### Build falha no GitHub Actions

**Solução**: Verifique se o arquivo `src/firebase.config.js` está commitado e com as credenciais corretas.

---

## 📞 Suporte

Para problemas ou dúvidas:
- Verifique a aba **Actions** no GitHub para logs de erro
- Consulte a documentação do [Firebase](https://firebase.google.com/docs)
- Consulte a documentação do [Vite](https://vitejs.dev)

---

**Desenvolvido com ❤️ para HPAES**
