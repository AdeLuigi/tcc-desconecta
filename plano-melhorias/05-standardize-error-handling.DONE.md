# Commit 05 — Padronizar Error Handling

**Mensagem de commit:** `refactor: standardize error handling across services`

---

## Objetivo

Atualmente existem pelo menos 3 estratégias de tratamento de erro em uso simultâneo nos services (`throw error`, `return null`, `return false`). Definir um conjunto de erros tipados e uma convenção única: **services lançam exceções tipadas; hooks/use cases decidem como apresentar o erro ao usuário.**

---

## Arquivos Afetados

- **Criar:** `app/domain/errors.ts`
- **Modificar:** `app/services/groupService.ts`
- **Modificar:** `app/services/challengeService.ts`
- **Modificar:** `app/services/userService.ts`
- **Modificar:** `app/services/notificationService.ts`
- **Modificar:** `app/services/screenTime.ts`
- **Modificar:** (todas as telas que hoje tratam erros diretamente de services)

---

## Passos de Execução

### Passo 1 — Criar `app/domain/errors.ts`

```typescript
// app/domain/errors.ts

/** Erro de regra de negócio — input inválido ou violação de domínio */
export class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DomainError"
  }
}

/** Entidade requisitada não encontrada */
export class NotFoundError extends DomainError {
  constructor(entity: string, id?: string) {
    super(id ? `${entity} "${id}" não encontrado` : `${entity} não encontrado`)
    this.name = "NotFoundError"
  }
}

/** Operação não permitida para este usuário */
export class PermissionError extends DomainError {
  constructor(message = "Permissão negada") {
    super(message)
    this.name = "PermissionError"
  }
}

/** Conflito de estado (ex: usuário já é membro do grupo) */
export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message)
    this.name = "ConflictError"
  }
}

/** Erro de infraestrutura/rede — não é culpa do usuário */
export class NetworkError extends Error {
  constructor(message = "Falha de conexão. Tente novamente.") {
    super(message)
    this.name = "NetworkError"
  }
}

/** Helpers para verificação de tipo */
export const isDomainError = (e: unknown): e is DomainError => e instanceof DomainError
export const isNetworkError = (e: unknown): e is NetworkError => e instanceof NetworkError
```

### Passo 2 — Aplicar nos services: padrão de lançamento

**Regra:** services sempre `throw` — nunca `return null` ou `return false` para indicar falha.

**Exemplo — `groupService.ts`:**

```typescript
// groupService.ts — antes (padrão misto)
export async function joinGroup(userId: string, code: string) {
  try {
    const group = await findGroupByCode(code)
    if (!group) return null                              // ← anti-padrão
    // ...
  } catch (e) {
    console.error(e)
    return false                                         // ← anti-padrão
  }
}

// groupService.ts — depois (padrão único: throw)
import { NotFoundError, ConflictError } from "@/domain/errors"

export async function joinGroup(userId: string, code: string): Promise<Group> {
  const group = await findGroupByCode(code)
  if (!group) throw new NotFoundError("Grupo", code)

  const jaEMembro = group.membros.some(m => m.userId === userId)
  if (jaEMembro) throw new ConflictError("Usuário já é membro deste grupo")

  await addMemberToGroup(group.id, { userId, cargo: "membro" })
  return group
}
```

### Passo 3 — Tratar erros tipados nas telas/hooks

As telas deixam de tratar erros com `return null`/`return false` e passam a usar `try/catch` com os tipos:

```typescript
// Em qualquer tela que chama joinGroup:
import { isDomainError, isNetworkError } from "@/domain/errors"

const handleJoinGroup = async (code: string) => {
  try {
    await joinGroup(userId, code)
    navigate("PaginaDoGrupo", { ... })
  } catch (error) {
    if (isDomainError(error)) {
      Alert.alert("Erro", error.message)         // mensagem amigável ao usuário
    } else if (isNetworkError(error)) {
      Alert.alert("Sem conexão", error.message)
    } else {
      console.error("Erro inesperado:", error)
      Alert.alert("Erro", "Ocorreu um problema inesperado.")
    }
  }
}
```

### Passo 4 — Remover `console.error` + `return null/false` dos services

Percorrer cada service e substituir o padrão:

```bash
# Encontrar todos os casos problemáticos
grep -n "return null\|return false\|console.error" \
  app/services/groupService.ts \
  app/services/challengeService.ts \
  app/services/userService.ts \
  app/services/notificationService.ts \
  app/services/screenTime.ts
```

Para cada ocorrência:
- Se é um erro de negócio → `throw new DomainError("...")`
- Se é "não encontrado" → `throw new NotFoundError("Entidade")`
- Se é erro de rede/infraestrutura → `throw new NetworkError()`
- `console.error` pode ser mantido antes do `throw` para logging, mas nunca como substituto

---

## Verificação

```bash
# 1. Confirmar que domain/errors.ts existe
ls app/domain/errors.ts

# 2. Verificar que services não retornam mais null/false para indicar falha
grep -n "return null\|return false" app/services/*.ts

# 3. Checar tipos
npx tsc --noEmit

# 4. Testar fluxo de erro: tentar entrar em grupo com código inválido
# → deve exibir Alert com mensagem "Grupo não encontrado"
```

---

## Resultado Esperado

- Um único arquivo `app/domain/errors.ts` com todos os erros tipados do sistema.
- Services sempre lançam exceções; nunca retornam `null` ou `false` para indicar falha.
- Telas exibem mensagens de erro amigáveis baseadas no tipo de exceção.
- Mais fácil de testar (esperar um `throw` é mais simples que checar `=== null`).
