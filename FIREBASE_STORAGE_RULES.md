# Firebase Storage Security Rules

Copie e cole estas regras no Firebase Console → Storage → Rules:

```
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Regra para uploads de fotos do feed
    match /feed/{groupId}/{fileName} {
      // Permite leitura para usuários autenticados
      allow read: if request.auth != null;
      
      // Permite escrita apenas para usuários autenticados
      allow write: if request.auth != null
                   && request.resource.size < 5 * 1024 * 1024 // Máximo 5MB
                   && request.resource.contentType.matches('image/.*'); // Apenas imagens
    }
    
    // Regra para uploads de fotos de grupos
    match /groups/{fileName} {
      // Permite leitura para usuários autenticados
      allow read: if request.auth != null;
      
      // Permite escrita apenas para usuários autenticados
      allow write: if request.auth != null
                   && request.resource.size < 5 * 1024 * 1024 // Máximo 5MB
                   && request.resource.contentType.matches('image/.*'); // Apenas imagens
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
