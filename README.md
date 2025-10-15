# 🖥️ Rotinas TI - HPAES

Sistema de gerenciamento de rotinas de TI desenvolvido com React, Firebase e TailwindCSS.

> 🚀 **[Ver guia completo de deploy no GitHub Pages](./DEPLOY.md)**

## 📋 Funcionalidades

- ✅ **Dashboard Interativo**: Visualização em tempo real do progresso das rotinas diárias
- 📝 **Checklist de Rotinas**: Gerenciamento de rotinas diárias, semanais e mensais
- 📸 **Evidências Fotográficas**: Upload de fotos como comprovação de execução
- 📊 **Histórico Completo**: Registro detalhado de todas as execuções com filtros avançados
- 🖨️ **Monitoramento de Impressoras**: Sistema automático de detecção e monitoramento de impressoras USB e de rede em tempo real
- 👥 **Gestão de Usuários**: Sistema de permissões (Admin/Técnico/Estagiário)
- 🔐 **Autenticação Segura**: Login com Firebase Authentication
- 📱 **Design Responsivo**: Interface adaptada para desktop e mobile

## 🚀 Tecnologias Utilizadas

- **React 18** - Biblioteca JavaScript para construção de interfaces
- **Vite** - Build tool moderna e rápida
- **Firebase** - Backend as a Service (Auth, Firestore, Storage)
- **TailwindCSS** - Framework CSS utilitário
- **Lucide React** - Biblioteca de ícones moderna

## 📦 Instalação

### Pré-requisitos

- Node.js (versão 16 ou superior)
- npm ou yarn
- Conta no Firebase

### Passos

1. **Clone o repositório ou navegue até a pasta do projeto**

```bash
cd windsurf-project
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure o Firebase**

   - Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
   - Ative os seguintes serviços:
     - Authentication (Email/Password)
     - Firestore Database
     - Storage
   
   - Copie as credenciais do Firebase

4. **Configure o arquivo de configuração**

   Edite o arquivo `src/firebase.config.js` com suas credenciais do Firebase:

```javascript
export const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJECT_ID.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_PROJECT_ID.appspot.com",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID"
};
```

5. **Inicie o servidor de desenvolvimento**

```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:5173`

## 🏗️ Estrutura do Projeto

```
windsurf-project/
├── .github/
│   └── workflows/
│       └── deploy.yml   # GitHub Actions para deploy automático
├── src/
│   ├── App.jsx          # Componente principal
│   ├── main.jsx         # Entry point
│   ├── index.css        # Estilos globais
│   └── firebase.config.js # Configuração do Firebase
├── public/              # Arquivos estáticos
├── index.html           # HTML base
├── package.json         # Dependências
├── vite.config.js       # Configuração do Vite
├── tailwind.config.js   # Configuração do Tailwind
├── DEPLOY.md            # Guia completo de deploy
└── README.md            # Este arquivo
```

## 📊 Estrutura do Firestore

### Coleções

```
/artifacts/{appId}/
├── users/
│   └── {userId}/
│       ├── nome: string
│       ├── email: string
│       └── tipo: "admin" | "tecnico"
│
└── public/data/
    ├── rotinas/
    │   └── {rotinaId}/
    │       ├── nome: string
    │       ├── descricao: string
    │       ├── categoria: string
    │       └── frequencia: "diaria" | "semanal" | "mensal"
    │
    └── execucoes/
        └── {execucaoId}/
            ├── rotinaId: string
            ├── dataHora: timestamp
            ├── responsavelId: string
            ├── responsavelNome: string
            ├── observacao: string
            └── fotoUrl: string
```

## 👤 Tipos de Usuário

### Técnico
- Visualizar dashboard
- Executar rotinas
- Adicionar observações e fotos
- Visualizar histórico

### Admin
- Todas as permissões de Técnico
- Criar/editar/excluir rotinas
- Gerenciar usuários e permissões

## 🎨 Categorias de Rotinas

- Rede
- Computadores
- Impressoras
- Backup
- Servidores
- Outros

## 📱 Recursos Mobile

- Menu de navegação inferior
- Interface otimizada para toque
- Upload de fotos direto da câmera
- Design responsivo

## 🔒 Regras de Segurança do Firestore

Configure as seguintes regras no Firebase Console:

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

## 🚀 Build para Produção

```bash
npm run build
```

Os arquivos otimizados serão gerados na pasta `dist/`

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run preview` - Visualiza o build de produção localmente
- `npm run deploy` - Deploy manual para GitHub Pages (após configurar)

## 🖨️ Sistema de Monitoramento de Impressoras

O sistema inclui um **agente local** que detecta e monitora impressoras automaticamente.

### Recursos

- 🔍 **Detecção Automática**: Impressoras USB e de rede
- 📊 **Monitoramento em Tempo Real**: Status, IP, nível de tinta
- 🌐 **Interface Web**: Visualização completa com filtros e alertas
- ⚡ **Sincronização Automática**: Dados enviados para Firebase a cada 60s
- 🚨 **Alertas Inteligentes**: Notificações para impressoras offline ou com tinta baixa

### Início Rápido

```bash
# Navegar até a pasta do agente
cd agent

# Instalar dependências
npm install

# Configurar (interativo)
npm run setup

# Iniciar monitoramento
npm start
```

### Documentação Completa

- 📖 **[PRINTER_MONITORING.md](./PRINTER_MONITORING.md)** - Documentação completa do sistema
- 🚀 **[agent/QUICK_START.md](./agent/QUICK_START.md)** - Guia rápido de início
- 📋 **[agent/README.md](./agent/README.md)** - Documentação do agente
- ✅ **[IMPLEMENTACAO_COMPLETA.md](./IMPLEMENTACAO_COMPLETA.md)** - Resumo da implementação

## 🌐 Deploy no GitHub Pages

Para fazer deploy do app no GitHub Pages:

1. **Siga o guia completo**: [DEPLOY.md](./DEPLOY.md)
2. **Resumo rápido**:
   - Configure suas credenciais do Firebase em `src/firebase.config.js`
   - Atualize `package.json` e `vite.config.js` com o nome do seu repositório
   - Faça push para o GitHub
   - O deploy será automático via GitHub Actions

**URL do app**: `https://seu-usuario.github.io/nome-do-repositorio/`

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.

## 🐛 Reportar Bugs

Se encontrar algum problema, por favor abra uma issue descrevendo:
- O comportamento esperado
- O comportamento atual
- Passos para reproduzir
- Screenshots (se aplicável)

## 💡 Suporte

Para dúvidas ou suporte, entre em contato com a equipe de TI do HPAES.

---

Desenvolvido com ❤️ para otimizar as rotinas de TI
