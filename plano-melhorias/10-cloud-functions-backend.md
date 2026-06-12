# Commit 10 — Mover Operações Multi-Documento para Cloud Functions

**Mensagem de commit:** `feat: move multi-document ops to Cloud Functions`

---

## Objetivo

Operações que envolvem múltiplos documentos do Firestore (atualizar ranking, calcular streak, pontuar desafios, enviar notificações push server-side) devem ser **Cloud Functions** por dois motivos:

1. **Consistência:** updates atômicos em múltiplos documentos não são confiáveis no cliente (o app pode fechar durante a operação).
2. **Segurança:** o cliente não deve ter acesso de escrita direto em campos de ranking/pontuação — isso facilita fraude.

O diretório `functions/` já existe no projeto mas está subutilizado.

---

## Arquivos Afetados

**Criar (dentro de `functions/src/`):**
- `functions/src/triggers/onActivityRegistered.ts`
- `functions/src/triggers/onChallengeCompleted.ts`
- `functions/src/triggers/onGroupMemberJoined.ts`
- `functions/src/callable/sendGroupNotification.ts`
- `functions/src/index.ts` (atualizar exports)

**Modificar:**
- `app/services/feedService.ts` — remover disparo de notificação, usar callable function
- `app/services/challengeService.ts` — remover atualização de ranking inline
- `firestore.rules` — restringir escrita em campos de ranking ao service account

---

## Passos de Execução

### Passo 1 — Verificar estrutura atual de `functions/`

```bash
ls functions/src/
cat functions/package.json
```

Certificar que o projeto de functions usa TypeScript (`tsconfig.json` presente) e que `firebase-admin` e `firebase-functions` estão no `package.json`.

### Passo 2 — Cloud Function: `onActivityRegistered` (atualizar ranking)

Disparada quando um documento de atividade é criado em `grupos/{groupId}/atividades/{activityId}`:

```typescript
// functions/src/triggers/onActivityRegistered.ts
import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

export const onActivityRegistered = functions.firestore
  .document("grupos/{groupId}/atividades/{activityId}")
  .onCreate(async (snap, context) => {
    const { groupId } = context.params
    const activity = snap.data()
    const { userId, minutosDesconectado, data } = activity

    const db = admin.firestore()
    const rankingRef = db.doc(`grupos/${groupId}/ranking/${userId}`)

    await db.runTransaction(async (tx) => {
      const rankingSnap = await tx.get(rankingRef)
      const current = rankingSnap.exists ? rankingSnap.data()! : { total: 0, streak: 0 }

      tx.set(rankingRef, {
        userId,
        total: current.total + minutosDesconectado,
        streak: calculateStreak(current, data),
        ultimaAtividade: data,
      }, { merge: true })
    })
  })

function calculateStreak(current: any, today: string): number {
  if (!current.ultimaAtividade) return 1
  const lastDate = new Date(current.ultimaAtividade)
  const todayDate = new Date(today)
  const diffDays = Math.floor(
    (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  if (diffDays === 1) return current.streak + 1  // dia consecutivo
  if (diffDays === 0) return current.streak       // mesmo dia, não incrementa
  return 1                                         // quebrou o streak
}
```

### Passo 3 — Cloud Function: `onChallengeCompleted` (pontuar desafio)

```typescript
// functions/src/triggers/onChallengeCompleted.ts
import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

export const onChallengeCompleted = functions.firestore
  .document("desafios/{challengeId}/participantes/{userId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data()
    const after = change.after.data()

    // Só processar quando o status muda para "concluido"
    if (before.status === after.status || after.status !== "concluido") return

    const { challengeId, userId } = context.params
    const db = admin.firestore()

    // Buscar o desafio para obter a pontuação
    const challengeSnap = await db.doc(`desafios/${challengeId}`).get()
    if (!challengeSnap.exists) return
    const challenge = challengeSnap.data()!

    // Incrementar pontuação do usuário
    await db.doc(`usuarios/${userId}`).update({
      pontuacao: admin.firestore.FieldValue.increment(challenge.pontos ?? 10)
    })
  })
```

### Passo 4 — Callable Function: `sendGroupNotification`

Substituir o disparo de notificação que está hoje em `feedService.ts` por uma callable function:

```typescript
// functions/src/callable/sendGroupNotification.ts
import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

interface SendGroupNotificationData {
  groupId: string
  senderId: string
  message: string
}

export const sendGroupNotification = functions.https.onCall(
  async (data: SendGroupNotificationData, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Login necessário")
    }

    const { groupId, senderId, message } = data
    const db = admin.firestore()

    // Buscar tokens FCM dos membros do grupo
    const groupSnap = await db.doc(`grupos/${groupId}`).get()
    if (!groupSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Grupo não encontrado")
    }

    const group = groupSnap.data()!
    const memberIds: string[] = (group.membrosIds ?? []).filter(
      (id: string) => id !== senderId
    )

    if (memberIds.length === 0) return { sent: 0 }

    // Buscar tokens dos membros
    const userDocs = await Promise.all(
      memberIds.map(id => db.doc(`usuarios/${id}`).get())
    )
    const tokens = userDocs
      .filter(d => d.exists && d.data()!.fcmToken)
      .map(d => d.data()!.fcmToken as string)

    if (tokens.length === 0) return { sent: 0 }

    // Enviar via FCM
    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: group.nome,
        body: message,
      },
      data: { groupId },
    })

    return { sent: response.successCount }
  }
)
```

### Passo 5 — Atualizar `functions/src/index.ts`

```typescript
// functions/src/index.ts
import * as admin from "firebase-admin"
admin.initializeApp()

export { onActivityRegistered } from "./triggers/onActivityRegistered"
export { onChallengeCompleted } from "./triggers/onChallengeCompleted"
export { sendGroupNotification } from "./callable/sendGroupNotification"
```

### Passo 6 — Atualizar `feedService.ts` no app

Substituir o envio de notificação direto por chamada à callable function:

```typescript
// feedService.ts — antes
import notificationService from "./notificationService"
await notificationService.sendGroupNotification(groupId, userId, descricao)

// feedService.ts — depois
import functions from "@react-native-firebase/functions"
await functions().httpsCallable("sendGroupNotification")({
  groupId,
  senderId: userId,
  message: descricao,
})
```

### Passo 7 — Atualizar `firestore.rules`

Restringir escrita em `ranking` e `pontuacao` para que apenas o service account (Cloud Functions) possa alterar:

```
// firestore.rules
match /grupos/{groupId}/ranking/{userId} {
  allow read: if request.auth != null && isMember(groupId);
  allow write: if false;  // apenas Cloud Functions via admin SDK
}

match /usuarios/{userId} {
  allow read: if request.auth.uid == userId;
  allow update: if request.auth.uid == userId
    && !request.resource.data.diff(resource.data).affectedKeys()
        .hasAny(["pontuacao"]);  // usuário não pode alterar própria pontuação
}
```

### Passo 8 — Deploy das functions

```bash
cd functions
npm install
npm run build

cd ..
firebase deploy --only functions
```

---

## Verificação

```bash
# 1. Verificar que as functions foram deployadas
firebase functions:list

# 2. Testar trigger: registrar uma atividade e verificar que o ranking foi atualizado
# (ver logs no Firebase Console → Functions → Logs)

# 3. Testar callable: criar um post no feed e verificar que a notificação chegou
# nos dispositivos dos outros membros do grupo

# 4. Testar regras do Firestore: tentar alterar pontuacao diretamente via app
# → deve ser rejeitado com "permission-denied"
```

---

## Resultado Esperado

- Ranking e streak calculados de forma consistente e à prova de fraude.
- Notificações push enviadas pelo servidor (tokens FCM não expostos entre clientes).
- Operações críticas são atômicas (via `runTransaction`) e sobrevivem a crashes do app.
