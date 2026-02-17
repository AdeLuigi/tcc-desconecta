# 🔔 Sistema de Notificações Push - Guia Rápido

## ✅ O que foi implementado

O sistema de notificações push foi implementado com sucesso! Agora, sempre que um usuário criar uma postagem em um grupo, todos os outros membros receberão uma notificação.

## 📦 Instalação Concluída

- ✅ Pacote `@react-native-firebase/messaging` instalado
- ✅ Serviço de notificações criado
- ✅ Integração com criação de postagens
- ✅ Gerenciamento de tokens FCM
- ✅ Permissões configuradas (Android e iOS)

## ⚠️ PRÓXIMOS PASSOS IMPORTANTES

### 1. Rebuild do App Android

Como adicionamos uma nova dependência nativa, você precisa fazer rebuild do app:

```bash
# Limpar build anterior
cd android && ./gradlew clean && cd ..

# Rebuild do app
npx expo run:android
```

### 2. Configurar Firebase Cloud Function

**IMPORTANTE**: As notificações estão sendo armazenadas no Firestore, mas precisam ser enviadas por uma Cloud Function.

#### Passo a Passo:

1. **Instalar Firebase CLI** (se ainda não tiver):
```bash
npm install -g firebase-tools
```

2. **Fazer login no Firebase**:
```bash
firebase login
```

3. **Inicializar Cloud Functions no projeto**:
```bash
firebase init functions
```
- Selecione seu projeto Firebase
- Escolha JavaScript ou TypeScript
- Instale as dependências quando solicitado

4. **Copiar o código da Cloud Function**:
- Abra o arquivo `firebase-functions-example.js` (criado na raiz do projeto)
- Copie o conteúdo
- Cole no arquivo `functions/index.js` (ou `functions/src/index.ts`)

5. **Instalar dependências no diretório functions**:
```bash
cd functions
npm install firebase-admin firebase-functions
cd ..
```

6. **Deploy da Cloud Function**:
```bash
firebase deploy --only functions
```

### 3. Configurar APNs para iOS (se necessário)

Se você planeja usar iOS, precisa configurar o APNs:
1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Vá em **Project Settings** > **Cloud Messaging**
3. Na seção **Apple app configuration**, faça upload da chave APNs (.p8)

## 🧪 Como Testar

### Teste Básico:

1. **Login**: Faça login no app com dois usuários diferentes em dois dispositivos
2. **Criar Grupo**: Crie um grupo e adicione ambos os usuários
3. **Criar Postagem**: Com o primeiro usuário, crie uma postagem no grupo
4. **Verificar**: O segundo usuário deve receber uma notificação

### Verificar no Firebase Console:

1. Acesse o Firestore Console
2. Navegue até `usuarios/{userId}`
3. Verifique se o campo `fcmToken` existe
4. Navegue até `notificacoes_pendentes`
5. Você deve ver os documentos sendo criados e marcados como `processed: true`

## 📁 Arquivos Criados/Modificados

### Novos Arquivos:
- `app/services/notificationService.ts` - Serviço de notificações
- `CONFIGURACAO_NOTIFICACOES.md` - Documentação completa
- `firebase-functions-example.js` - Exemplo de Cloud Function
- `GUIA_RAPIDO_NOTIFICACOES.md` - Este arquivo

### Arquivos Modificados:
- `app/services/feedService.ts` - Envia notificações ao criar posts
- `app/services/userService.ts` - Interface UserData com fcmToken
- `app/screens/LoginScreen.tsx` - Inicializa notificações no login
- `android/app/src/main/AndroidManifest.xml` - Permissão de notificações
- `package.json` - Nova dependência firebase/messaging

## 🎯 Funcionalidades

### O que acontece automaticamente:

1. **No Login**:
   - Solicita permissão para notificações
   - Obtém e salva o token FCM
   - Configura listeners

2. **Ao Criar Postagem**:
   - Cria a postagem normalmente
   - Busca membros do grupo
   - Filtra quem tem notificações habilitadas
   - Cria documento em `notificacoes_pendentes`
   - Cloud Function envia as notificações

3. **Ao Receber Notificação**:
   - **App Aberto**: Mostra Alert
   - **App em Background**: Aparece na bandeja
   - **App Fechado**: Aparece na bandeja

## ⚙️ Configurações do Usuário

Os usuários podem desabilitar notificações:
- Campo: `usuarios/{userId}/configuracoes/notificacoes`
- Valor padrão: `true`

Se um usuário desabilitar notificações, ele não receberá, mesmo tendo token FCM válido.

## 🐛 Solução de Problemas

### "Notificações não estão chegando"

1. Verifique se a Cloud Function foi deployada:
   ```bash
   firebase functions:log
   ```

2. Verifique no Firestore se há documentos em `notificacoes_pendentes` com `processed: false`

3. Verifique se o usuário tem `fcmToken` salvo:
   - Firestore Console > `usuarios/{userId}` > campo `fcmToken`

4. Verifique as permissões do app:
   - Android: Configurações > Apps > Desconecta > Notificações
   - iOS: Ajustes > Notificações > Desconecta

### "Erro ao fazer rebuild Android"

```bash
cd android
./gradlew clean
rm -rf .gradle
cd ..
npx expo run:android
```

## 📚 Documentação Completa

Para mais detalhes, consulte:
- **CONFIGURACAO_NOTIFICACOES.md** - Documentação completa e detalhada
- **firebase-functions-example.js** - Código completo da Cloud Function com comentários

## 🎉 Pronto!

Após seguir estes passos, seu sistema de notificações estará funcionando completamente!

---

**Dúvidas ou problemas?** Consulte a documentação completa em `CONFIGURACAO_NOTIFICACOES.md`
