# Firebase Storage Security Rules

Copie e cole estas regras no Firebase Console → Storage → Rules:

```
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Regra para uploads de fotos do feed
    match /feed/{groupId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
    
    // Regra para uploads de fotos de grupos
    match /groups/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
    
    // Regra para fotos de perfil
    match /profile/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
    
    // Regra para imagens de desafios (apenas admin pode fazer upload)
    match /desafios/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && request.auth.token.email == 'adeluigi@ic.ufrj.br'
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
    
    // Regra geral: negar acesso por padrão
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## Como aplicar as regras:

1. Acesse o Firebase Console
2. Vá em Storage
3. Clique na aba "Rules"
4. Cole as regras acima
5. Clique em "Publish"
