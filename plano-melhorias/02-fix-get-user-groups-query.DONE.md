# Commit 02 — Fix getUserGroups com array-contains

**Mensagem de commit:** `perf: use array-contains to query user groups`

---

## Objetivo

`getUserGroups()` em `groupService.ts` atualmente busca **todos** os documentos da coleção `grupos` e filtra no cliente. Isso não escala: com 1.000 grupos cadastrados, cada chamada lê 1.000 documentos do Firestore.

A solução é adicionar um campo `membrosIds: string[]` ao documento de grupo e usar o operador `array-contains` do Firestore, que faz o filtro no servidor.

---

## Arquivos Afetados

- `app/services/groupService.ts` — função `getUserGroups()` e `createGroup()`
- Regras do Firestore (`firestore.rules`) — garantir que `membrosIds` não quebre regras existentes
- (Opcional) Script de migração para grupos já existentes

---

## Passos de Execução

### Passo 1 — Adicionar `membrosIds` na criação de grupo

Em `groupService.ts`, na função que cria um grupo (provavelmente `createGroup` ou similar), adicionar `membrosIds` ao documento salvo:

```typescript
// groupService.ts — ao criar um grupo
await addDoc(collection(db, "grupos"), {
  nome,
  codigo,
  adminId: userId,
  membros: [{ userId, cargo: "administrador", nome: displayName }],
  membrosIds: [userId],   // ← campo novo para query eficiente
  dataCriacao: serverTimestamp(),
  // ... demais campos
})
```

### Passo 2 — Manter `membrosIds` sincronizado ao adicionar/remover membros

Qualquer função que modifica `membros` deve também atualizar `membrosIds`:

```typescript
// Ao adicionar membro:
await updateDoc(groupRef, {
  membros: arrayUnion(newMember),
  membrosIds: arrayUnion(newMember.userId),   // ← sincronizar
})

// Ao remover membro:
await updateDoc(groupRef, {
  membros: arrayRemove(memberToRemove),
  membrosIds: arrayRemove(memberToRemove.userId),   // ← sincronizar
})
```

### Passo 3 — Reescrever `getUserGroups()`

```typescript
// groupService.ts — antes
export async function getUserGroups(userId: string) {
  const db = getFirestore()
  const groupsRef = collection(db, "grupos")
  const allGroupsSnapshot = await getDocs(groupsRef)      // ← lê tudo
  return allGroupsSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(group => group.membros?.some(m => m.userId === userId))  // ← filtra no cliente
}

// groupService.ts — depois
export async function getUserGroups(userId: string) {
  const db = getFirestore()
  const q = query(
    collection(db, "grupos"),
    where("membrosIds", "array-contains", userId)          // ← filtra no servidor
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}
```

### Passo 4 — Criar índice no Firestore (se necessário)

O operador `array-contains` em um único campo normalmente não requer índice composto. Porém, se houver ordenação (`orderBy`) na mesma query, será necessário criar um índice no Console do Firebase:

```
Console Firebase → Firestore → Índices → Adicionar índice composto
Coleção: grupos
Campos: membrosIds (Arrays), dataCriacao (Descendente)
```

### Passo 5 — (Opcional) Script de migração para dados existentes

Se o banco já tem documentos de grupo sem o campo `membrosIds`, rodar uma migração única:

```javascript
// scripts/migrate-membros-ids.js (Node.js com firebase-admin)
const admin = require("firebase-admin")
admin.initializeApp()
const db = admin.firestore()

async function migrate() {
  const snapshot = await db.collection("grupos").get()
  const batch = db.batch()
  snapshot.docs.forEach(doc => {
    const data = doc.data()
    if (!data.membrosIds) {
      const ids = (data.membros || []).map(m => m.userId)
      batch.update(doc.ref, { membrosIds: ids })
    }
  })
  await batch.commit()
  console.log(`Migrated ${snapshot.size} documents`)
}
migrate()
```

---

## Verificação

```bash
# 1. Verificar que getUserGroups() não usa getDocs sem where
grep -A 10 "getUserGroups" app/services/groupService.ts

# 2. Verificar que nenhum outro lugar faz fetch total de grupos
grep -n "collection(db, \"grupos\")" app/services/groupService.ts

# 3. Testar no app: entrar em Grupos de Amigos e confirmar que lista carrega corretamente
```

---

## Resultado Esperado

- `getUserGroups()` lê apenas os documentos dos grupos do usuário (N leituras, onde N = número de grupos do usuário).
- Performance melhora drasticamente à medida que a base de grupos cresce.
- Custo do Firestore reduzido proporcionalmente.
