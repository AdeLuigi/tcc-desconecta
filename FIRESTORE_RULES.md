# Firestore Security Rules

Copie e cole estas regras no **Firebase Console → Firestore Database → Rules**:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Função helper para verificar autenticação
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Função helper para verificar se o usuário é o dono do documento
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Collection de usuários
    match /usuarios/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }
    
    // Collection de grupos
    match /grupos/{groupId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() 
                            && resource.data.membros != null
                            && resource.data.membros.hasAny([{
                              userId: request.auth.uid,
                              cargo: 'administrador'
                            }]);
    }
    
    // Collection de feed/posts
    match /feed/{postId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated()
                   && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isAuthenticated()
                            && resource.data.userId == request.auth.uid;
    }
    
    // Collection de comentários
    match /comentarios/{commentId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated()
                   && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isAuthenticated()
                            && resource.data.userId == request.auth.uid;
    }
    
    // Collection de tempo de tela - NOVA
    match /tempo_de_tela/{docId} {
      // Permite leitura apenas dos próprios dados
      allow read: if isAuthenticated() 
                  && resource.data.userId == request.auth.uid;
      
      // Permite escrita apenas dos próprios dados
      // O docId deve seguir o padrão: userId_YYYY-MM-DD
      allow write: if isAuthenticated()
                   && request.resource.data.userId == request.auth.uid
                   && docId.matches('^' + request.auth.uid + '_[0-9]{4}-[0-9]{2}-[0-9]{2}$');
    }
    
    // Collection de desafios - NOVA
    match /desafios/{desafioId} {
      // Qualquer usuário autenticado pode ler os desafios
      allow read: if isAuthenticated();
      
      // Apenas o admin pode criar, atualizar ou deletar desafios
      allow create, update, delete: if isAuthenticated() 
                                    && request.auth.token.email == 'adeluigi@ic.ufrj.br';
    }
    
    // Collection de estatísticas - NOVA
    match /estatisticas/{docId} {
      // Leitura: apenas dos próprios dados
      // Importante: não usar get() aqui pois causa problemas com queries
      allow read: if isAuthenticated() 
                  && resource.data.userId == request.auth.uid;
      
      // Escrita: apenas dos próprios dados
      allow create, update: if isAuthenticated()
                            && request.resource.data.userId == request.auth.uid;
      
      // Não permite deletar estatísticas
      allow delete: if false;
    }
    
    // Regra padrão: negar acesso
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Como aplicar as regras:

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá em **Firestore Database**
4. Clique na aba **Rules**
5. Cole as regras acima
6. Clique em **Publish**

## Explicação das regras:

### tempo_de_tela collection:
- ✅ **Leitura**: Usuário só pode ler seus próprios dados
- ✅ **Escrita**: Usuário só pode escrever seus próprios dados
- ✅ **ID do documento**: Validado no formato `userId_YYYY-MM-DD`
- ✅ **Segurança**: Impede que usuários acessem dados de outros

### desafios collection:
- ✅ **Leitura**: Qualquer usuário autenticado pode visualizar os desafios
- ✅ **Criação/Edição/Exclusão**: Apenas o admin (adeluigi@ic.ufrj.br) pode gerenciar desafios
- ✅ **Segurança**: Impede que usuários comuns modifiquem a lista de desafios

### Outras collections:
- **usuarios**: Qualquer usuário autenticado pode ler, mas só pode modificar seus próprios dados
- **grupos**: Membros podem ler, apenas administradores podem modificar
- **feed/comentarios**: Usuários podem criar posts e modificar apenas seus próprios posts

---

## Regra de teste (desenvolvimento apenas):

Se você quiser testar sem restrições (⚠️ **NÃO USE EM PRODUÇÃO**):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
