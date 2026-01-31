# Configuração do Google Sign-In

## Passos para Configurar

### 1. Firebase Console

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá em **Authentication** > **Sign-in method**
4. Ative o provedor **Google**
5. Copie o **Web Client ID** (você precisará dele no próximo passo)

### 2. Configurar o Web Client ID

Abra o arquivo `app/services/auth.ts` e adicione o Web Client ID na função `configureGoogleSignIn`:

```typescript
export function configureGoogleSignIn() {
  GoogleSignin.configure({
    webClientId: "SEU_WEB_CLIENT_ID_AQUI.apps.googleusercontent.com",
  })
}
```

O Web Client ID pode ser encontrado em:
- Firebase Console > Project Settings > General > Web API Key
- Ou em Google Cloud Console > APIs & Services > Credentials

### 3. Configuração Android

O arquivo `android/app/google-services.json` já deve estar configurado. Se não estiver:

1. Baixe o `google-services.json` do Firebase Console
2. Coloque em `android/app/google-services.json`

### 4. Configuração iOS (se aplicável)

1. Baixe o `GoogleService-Info.plist` do Firebase Console
2. Adicione ao projeto iOS
3. Configure o URL Scheme no `Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.googleusercontent.apps.YOUR_CLIENT_ID</string>
    </array>
  </dict>
</array>
```

### 5. Testar

Após configurar, rode o projeto:

```bash
npm run android
# ou
npm run ios
```

## Funcionalidades Implementadas

- ✅ Login com Google usando Firebase Authentication
- ✅ Integração com `@react-native-google-signin/google-signin`
- ✅ Feedback visual durante o processo de login
- ✅ Tratamento de erros
- ✅ Salvamento do token e email do usuário

## Fluxo de Autenticação

1. Usuário clica no botão "Continuar com Google"
2. Abre o fluxo de autenticação do Google
3. Usuário seleciona/autentica sua conta Google
4. Firebase recebe o token e autentica o usuário
5. App salva o token e email no contexto de autenticação
6. Usuário é direcionado para a tela principal

## Arquivos Modificados

- `app/screens/LoginScreen.tsx` - Implementação do botão e lógica de login
- `app/services/auth.ts` - Serviço de autenticação com Google (novo)

## Troubleshooting

### Erro: "Developer Error"
- Verifique se o SHA-1 do app está registrado no Firebase Console
- Gere o SHA-1 com: `cd android && ./gradlew signingReport`

### Erro: "SIGN_IN_FAILED" 
- Verifique se o Web Client ID está correto
- Confirme que o provedor Google está ativo no Firebase

### Erro: "Network Error"
- Verifique a conexão com internet
- Confirme que o Google Play Services está atualizado (Android)
