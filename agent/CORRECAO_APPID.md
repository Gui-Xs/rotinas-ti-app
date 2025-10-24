# 🔧 Correção: Impressoras não aparecem no App

## 🐛 Problema Identificado

As impressoras estavam sendo detectadas e enviadas para o Firebase pelo agente, mas **não apareciam no app**.

### Causa Raiz

**Incompatibilidade de `appId`** entre o agente e o aplicativo:

- **Agente**: Salvava em `/artifacts/rotinas-ti-hpaes/printers`
- **App**: Lia de `/artifacts/rotinas-ti-app/printers`

Como os caminhos eram diferentes, as impressoras ficavam "invisíveis" para o app.

## ✅ Solução Aplicada

Atualizei o `appId` no agente para corresponder ao do app:

### Arquivos Modificados:

1. **`agent/config.example.json`** (linha 7)
   - Antes: `"appId": "rotinas-ti-hpaes"`
   - Depois: `"appId": "rotinas-ti-app"`

2. **`agent/index.js`** (linha 45)
   - Antes: `appId = config.appId || 'rotinas-ti-hpaes';`
   - Depois: `appId = config.appId || 'rotinas-ti-app';`

## 📋 Próximos Passos

### Se você já tem um arquivo `config.json`:

1. **Abra o arquivo** `agent/config.json`
2. **Localize a linha** com `"appId"`
3. **Altere para**: `"appId": "rotinas-ti-app"`
4. **Salve o arquivo**
5. **Reinicie o agente**

### Se você ainda não configurou o agente:

1. Copie `config.example.json` para `config.json`
2. Configure suas credenciais do Firebase
3. O `appId` já estará correto

## 🔄 Verificação

Após reiniciar o agente com o `appId` correto:

1. ✅ As impressoras serão detectadas
2. ✅ Serão salvas em `/artifacts/rotinas-ti-app/printers`
3. ✅ Aparecerão automaticamente no app

### No Console do Agente:

```
✅ Configurações carregadas com sucesso
📍 Computador: [seu computador]
📍 Local: [sua localização]
🖨️  Detectadas X impressoras USB
📤 Enviando X impressoras para o Firebase...
✅ X/X impressoras sincronizadas com sucesso
```

### No App:

- Acesse a página **"Impressoras"**
- As impressoras detectadas devem aparecer na lista
- O status será atualizado em tempo real

## 🆘 Ainda não funciona?

Verifique:

1. **Firebase Console**: Acesse `Firestore Database` → `artifacts` → `rotinas-ti-app` → `printers`
   - Deve haver documentos com as impressoras

2. **Credenciais do Firebase**: Certifique-se de que o `config.json` tem as credenciais corretas

3. **Regras do Firestore**: Verifique se as regras permitem leitura/escrita na coleção `printers`

4. **Console do navegador**: Abra o DevTools (F12) e verifique se há erros no console
