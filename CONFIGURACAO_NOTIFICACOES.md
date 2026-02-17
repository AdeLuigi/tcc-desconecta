# Configuração de Notificações Push

Este documento explica como configurar e usar o sistema de notificações push no app Desconecta.

## 📋 O que foi implementado

✅ Sistema de notificações push usando Firebase Cloud Messaging (FCM)
✅ Notificações automáticas quando uma postagem é criada em um grupo
✅ Gerenciamento de tokens FCM dos usuários
✅ Permissões configuradas para Android e iOS
✅ Respeita as configurações de notificação do usuário

## 🔧 Configuração Necessária no Firebase Console

Para que as notificações funcionem completamente, você precisa configurar o Firebase Cloud Messaging:

### 1. Configurar Firebase Cloud Messaging

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto **tcc-desconecta**
3. Vá em **Project Settings** (ícone de engrenagem) > **Cloud Messaging**

### 2. Configurar Chave do Servidor (Server Key)

#### Para Android:
- A chave já está configurada automaticamente através do `google-services.json`
- Não é necessário fazer nada adicional

#### Para iOS:
1. No Firebase Console, vá em **Project Settings** > **Cloud Messaging**
2. Na seção **Apple app configuration**, clique em **Upload** ao lado de "APNs Authentication Key"
3. Faça upload do arquivo `.p8` da Apple Developer Account
4. Insira o **Key ID** e o **Team ID**

### 3. Criar Cloud Function para Enviar Notificações (IMPORTANTE)

⚠️ **ATENÇÃO**: Atualmente, o sistema armazena notificações pendentes no Firestore na coleção `notificacoes_pendentes`. Você precisa criar uma Cloud Function para processar e enviar essas notificações.

#### Opção 1: Criar Cloud Function (Recomendado)

Crie uma Cloud Function que monitora a coleção `notificacoes_pendentes` e envia as notificações:

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.sendNotifications = functions.firestore
  .document('notificacoes_pendentes/{notificationId}')
  .onCreate(async (snap, context) => {
    const notification = snap.data();
    
    if (notification.processed) {
      return null;
    }

    const { tokens, title, body, data } = notification;

    const message = {
      notification: {
        title: title,
        body: body,
      },
      data: data,
      tokens: tokens,
    };

    try {
      const response = await admin.messaging().sendMulticast(message);
      console.log('Notificações enviadas com sucesso:', response.successCount);
      
      // Marcar como processada
      await snap.ref.update({ processed: true, processedAt: admin.firestore.FieldValue.serverTimestamp() });
      
      return response;
    } catch (error) {
      console.error('Erro ao enviar notificações:', error);
      await snap.ref.update({ processed: true, error: error.message });
      return null;
    }
  });
```

**Para implantar a Cloud Function:**

```bash
# Instalar Firebase CLI se ainda não tiver
npm install -g firebase-tools

# Login no Firebase
firebase login

# Inicializar Cloud Functions no projeto
firebase init functions

# Escolha: TypeScript ou JavaScript
# Instalar dependências

# Implantar
firebase deploy --only functions
```

#### Opção 2: Usar API HTTP do FCM (Alternativa Simples)

Se você não quiser usar Cloud Functions, pode implementar o envio direto usando a API HTTP do FCM. Para isso, você precisaria:

1. Obter a **Server Key** no Firebase Console
2. Modificar o `notificationService.ts` para fazer chamadas HTTP diretamente
3. **⚠️ ATENÇÃO**: Não é recomendado expor a Server Key no código do cliente por questões de segurança

## 🚀 Como Funciona

### 1. Login do Usuário
Quando um usuário faz login:
- O app solicita permissão para notificações
- Obtém o token FCM do dispositivo
- Salva o token no Firestore no documento do usuário (`usuarios/{userId}`)

### 2. Criação de Postagem
Quando um usuário cria uma postagem em um grupo:
1. A postagem é salva no Firestore
2. O sistema busca todos os membros do grupo
3. Filtra os membros que:
   - Têm token FCM registrado
   - Têm notificações habilitadas (`configuracoes.notificacoes = true`)
   - Não são o autor da postagem
4. Cria um documento em `notificacoes_pendentes` com:
   - Lista de tokens dos destinatários
   - Título: "Nova postagem em {Nome do Grupo}"
   - Corpo: "{Nome do Autor}: {Descrição da Postagem}"
   - Dados adicionais (tipo, groupId, authorUserId)

### 3. Envio da Notificação
- A Cloud Function detecta o novo documento em `notificacoes_pendentes`
- Envia a notificação para todos os tokens usando `admin.messaging().sendMulticast()`
- Marca o documento como processado

### 4. Recebimento da Notificação
- **App em Foreground**: Mostra um Alert
- **App em Background**: Aparece na bandeja de notificações
- **App Fechado**: Aparece na bandeja de notificações

## 📱 Testando as Notificações

### Teste 1: Verificar Token FCM

Após fazer login, verifique no console se o token foi salvo:
```javascript
console.log('Token FCM salvo com sucesso')
```

Você pode visualizar o token no Firestore Console em `usuarios/{userId}` no campo `fcmToken`.

### Teste 2: Criar uma Postagem

1. Entre em um grupo que tenha pelo menos 2 membros
2. Crie uma nova postagem
3. Verifique no Firestore Console se foi criado um documento em `notificacoes_pendentes`
4. Se a Cloud Function estiver configurada, o outro membro receberá a notificação

### Teste 3: Enviar Notificação Manual

Você pode testar enviando uma notificação manual pelo Firebase Console:
1. Vá em **Firebase Console** > **Cloud Messaging**
2. Clique em **Send your first message**
3. Digite um título e mensagem
4. Clique em **Send test message**
5. Cole um token FCM de teste (copie do Firestore)

## 🔒 Permissões

### Android
- `android.permission.POST_NOTIFICATIONS` (Android 13+): Já configurada no `AndroidManifest.xml`
- O app solicita a permissão em runtime quando o usuário faz login

### iOS
- Permissões solicitadas em runtime quando o usuário faz login
- Não requer configuração adicional no `Info.plist`

## 🎨 Estrutura do Código

### Arquivos Criados/Modificados

1. **app/services/notificationService.ts** (NOVO)
   - `requestNotificationPermission()`: Solicita permissão
   - `getFCMToken()`: Obtém token FCM
   - `saveFCMToken()`: Salva token no Firestore
   - `removeFCMToken()`: Remove token ao fazer logout
   - `initializeNotifications()`: Inicializa sistema de notificações
   - `sendGroupNotification()`: Envia notificação para membros do grupo
   - `setupNotificationListeners()`: Configura listeners de notificações

2. **app/services/feedService.ts** (MODIFICADO)
   - `createFeedPost()`: Agora envia notificações após criar postagem

3. **app/services/userService.ts** (MODIFICADO)
   - `UserData`: Interface atualizada com campo `fcmToken`

4. **app/screens/LoginScreen.tsx** (MODIFICADO)
   - Inicializa notificações após login bem-sucedido
   - Configura listeners de notificações

5. **android/app/src/main/AndroidManifest.xml** (MODIFICADO)
   - Adicionada permissão `POST_NOTIFICATIONS`

## 📊 Estrutura do Firestore

### Collection: `usuarios`
```typescript
{
  uid: string
  email: string
  nome: string
  photoURL: string
  fcmToken?: string  // NOVO - Token FCM do dispositivo
  configuracoes: {
    notificacoes: boolean  // Controla se o usuário quer receber notificações
    // ... outras configs
  }
}
```

### Collection: `notificacoes_pendentes`
```typescript
{
  tokens: string[]  // Lista de tokens FCM dos destinatários
  title: string     // Título da notificação
  body: string      // Corpo da notificação
  data: {
    type: 'new_post'
    groupId: string
    authorUserId: string
  }
  createdAt: string
  processed: boolean
  processedAt?: string
  error?: string
}
```

## 🐛 Troubleshooting

### Notificações não estão sendo recebidas

1. **Verificar token FCM**
   - Confirme que o token está salvo no Firestore
   - Veja no console: `console.log('Token FCM:', token)`

2. **Verificar permissões**
   - Verifique se o usuário concedeu permissão para notificações
   - Android: Vá em Configurações > Apps > Desconecta > Notificações
   - iOS: Vá em Ajustes > Notificações > Desconecta

3. **Verificar Cloud Function**
   - Confirme que a Cloud Function está implantada e rodando
   - Veja os logs: `firebase functions:log`

4. **Verificar Firestore Rules**
   - Certifique-se de que a coleção `notificacoes_pendentes` tem permissões adequadas

5. **Verificar configuração do usuário**
   - Confirme que `configuracoes.notificacoes` está `true` no documento do usuário

## 📝 Próximos Passos

Para melhorar o sistema de notificações, considere:

- [ ] Adicionar diferentes tipos de notificações (comentários, menções, etc.)
- [ ] Implementar notificações programadas (lembretes de desafios)
- [ ] Adicionar sons e badges personalizados
- [ ] Implementar deep linking para abrir o app na tela correta
- [ ] Adicionar histórico de notificações no app
- [ ] Implementar notificações agrupadas por grupo
- [ ] Adicionar opções de personalização de notificações

## ⚠️ Importante

**VOCÊ PRECISA CONFIGURAR A CLOUD FUNCTION** para que as notificações sejam enviadas. Sem a Cloud Function, as notificações serão apenas armazenadas no Firestore mas não serão enviadas aos usuários.

Siga as instruções na seção "Criar Cloud Function para Enviar Notificações" acima.

---

**Data de Implementação**: 17/02/2026
**Versão**: 1.0
