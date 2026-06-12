# Commit T03 — Testes de Services

**Mensagem de commit:** `test: add unit tests for services`

---

## Objetivo

Cobrir os services com testes unitários usando Firebase mockado. Estes testes documentam o comportamento atual e atuam como rede de segurança para as refatorações dos commits 02, 06 e 07 do plano arquitetural.

---

## Arquivos a Criar

- `app/services/__tests__/groupService.test.ts`
- `app/services/__tests__/userService.test.ts`
- `app/services/__tests__/screenTime.test.ts`
- `app/services/__tests__/feedService.test.ts`

---

## `app/services/__tests__/groupService.test.ts`

```typescript
import { getDocs, getDoc, addDoc } from "@react-native-firebase/firestore"
import {
  getUserGroups,
  getGroupById,
  createGroup,
} from "@/services/groupService"
import { getUserData } from "@/services/userService"

// Mock getUserData pois createGroup depende dele
jest.mock("@/services/userService", () => ({
  getUserData: jest.fn(),
}))

const mockGetDocs = jest.mocked(getDocs)
const mockGetDoc = jest.mocked(getDoc)
const mockAddDoc = jest.mocked(addDoc)
const mockGetUserData = jest.mocked(getUserData)

/** Helper: cria um snapshot de coleção fake */
function makeQuerySnapshot(docs: { id: string; data: object }[]) {
  return {
    empty: docs.length === 0,
    size: docs.length,
    docs: docs.map((d) => ({
      id: d.id,
      data: () => d.data,
      exists: () => true,
    })),
    forEach: (cb: (doc: any) => void) =>
      docs.forEach((d) =>
        cb({ id: d.id, data: () => d.data, exists: () => true })
      ),
  }
}

/** Helper: cria um DocumentSnapshot fake */
function makeDocSnapshot(id: string, data: object | null) {
  return {
    id,
    exists: () => data !== null,
    data: () => data,
  }
}

const FAKE_GROUP = {
  nome: "Grupo Teste",
  descricao: "Descrição",
  foto: "",
  criado_em: "2025-01-01T00:00:00.000Z",
  codigoGrupo: "ABC123",
  membros: [
    { userId: "user-1", cargo: "administrador", nome: "Admin" },
    { userId: "user-2", cargo: "membro", nome: "Membro" },
  ],
  ranking_mensal: [],
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── getUserGroups ────────────────────────────────────────────────────────────
describe("getUserGroups", () => {
  it("retorna apenas os grupos onde o userId está nos membros", async () => {
    mockGetDocs.mockResolvedValueOnce(
      makeQuerySnapshot([
        { id: "group-1", data: FAKE_GROUP },
        {
          id: "group-2",
          data: { ...FAKE_GROUP, membros: [{ userId: "outro-user", cargo: "membro", nome: "X" }] },
        },
      ]) as any
    )

    const result = await getUserGroups("user-1")

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("group-1")
    expect(result[0].nome).toBe("Grupo Teste")
  })

  it("retorna array vazio quando usuário não é membro de nenhum grupo", async () => {
    mockGetDocs.mockResolvedValueOnce(
      makeQuerySnapshot([
        {
          id: "group-1",
          data: { ...FAKE_GROUP, membros: [{ userId: "outro-user", cargo: "membro" }] },
        },
      ]) as any
    )

    const result = await getUserGroups("user-nao-membro")
    expect(result).toHaveLength(0)
  })

  it("retorna array vazio quando a coleção está vazia", async () => {
    mockGetDocs.mockResolvedValueOnce(makeQuerySnapshot([]) as any)
    const result = await getUserGroups("user-1")
    expect(result).toHaveLength(0)
  })

  it("retorna array vazio quando Firestore lança erro", async () => {
    mockGetDocs.mockRejectedValueOnce(new Error("Firestore offline"))
    const result = await getUserGroups("user-1")
    expect(result).toHaveLength(0)
  })
})

// ─── getGroupById ─────────────────────────────────────────────────────────────
describe("getGroupById", () => {
  it("retorna o grupo quando documento existe", async () => {
    mockGetDoc.mockResolvedValueOnce(makeDocSnapshot("group-1", FAKE_GROUP) as any)

    const result = await getGroupById("group-1")

    expect(result).not.toBeNull()
    expect(result?.id).toBe("group-1")
    expect(result?.nome).toBe("Grupo Teste")
    expect(result?.membros).toHaveLength(2)
  })

  it("retorna null quando documento não existe", async () => {
    mockGetDoc.mockResolvedValueOnce(makeDocSnapshot("group-999", null) as any)
    const result = await getGroupById("group-999")
    expect(result).toBeNull()
  })

  it("retorna null quando Firestore lança erro", async () => {
    mockGetDoc.mockRejectedValueOnce(new Error("Firestore error"))
    const result = await getGroupById("group-1")
    expect(result).toBeNull()
  })
})

// ─── createGroup ──────────────────────────────────────────────────────────────
describe("createGroup", () => {
  beforeEach(() => {
    // getUserData retorna dados do admin
    mockGetUserData.mockResolvedValue({
      uid: "user-1",
      nome: "Admin Teste",
      email: "admin@test.com",
    } as any)

    // Simular que nenhum código de grupo existe ainda (para generateUniqueGroupCode)
    mockGetDocs.mockResolvedValue(makeQuerySnapshot([]) as any)

    // addDoc retorna id do novo grupo
    mockAddDoc.mockResolvedValue({ id: "new-group-id" } as any)
  })

  it("retorna o id do grupo criado", async () => {
    const result = await createGroup(
      "Meu Grupo",
      "Descrição",
      "",
      "user-1"
    )

    expect(result).toBe("new-group-id")
  })

  it("chama addDoc com os campos corretos", async () => {
    await createGroup("Meu Grupo", "Descrição", "", "user-1")

    expect(mockAddDoc).toHaveBeenCalledTimes(1)
    const [, docData] = mockAddDoc.mock.calls[0]

    expect(docData.nome).toBe("Meu Grupo")
    expect(docData.descricao).toBe("Descrição")
    expect(docData.membros).toHaveLength(1)
    expect(docData.membros[0].cargo).toBe("administrador")
    expect(docData.codigoGrupo).toHaveLength(6)
  })

  it("retorna null quando Firestore lança erro", async () => {
    mockAddDoc.mockRejectedValueOnce(new Error("Firestore error"))
    const result = await createGroup("Grupo", "Desc", "", "user-1")
    expect(result).toBeNull()
  })
})
```

---

## `app/services/__tests__/userService.test.ts`

```typescript
import { getDoc, setDoc, updateDoc } from "@react-native-firebase/firestore"
import auth from "@react-native-firebase/auth"
import { getUserData, updateUserData } from "@/services/userService"

const mockGetDoc = jest.mocked(getDoc)
const mockSetDoc = jest.mocked(setDoc)
const mockUpdateDoc = jest.mocked(updateDoc)
const mockAuth = jest.mocked(auth)

function makeDocSnapshot(id: string, data: object | null) {
  return {
    id,
    exists: () => data !== null,
    data: () => data,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── getUserData ──────────────────────────────────────────────────────────────
describe("getUserData", () => {
  it("retorna dados do usuário quando documento existe", async () => {
    const fakeUser = { uid: "user-1", email: "test@test.com", nome: "Teste" }
    mockGetDoc.mockResolvedValueOnce(makeDocSnapshot("user-1", fakeUser) as any)

    const result = await getUserData("user-1")

    expect(result).not.toBeNull()
    expect(result?.email).toBe("test@test.com")
  })

  it("retorna null quando usuário não existe", async () => {
    mockGetDoc.mockResolvedValueOnce(makeDocSnapshot("user-999", null) as any)
    const result = await getUserData("user-999")
    expect(result).toBeNull()
  })

  it("retorna null quando Firestore lança erro", async () => {
    mockGetDoc.mockRejectedValueOnce(new Error("Offline"))
    const result = await getUserData("user-1")
    expect(result).toBeNull()
  })
})

// ─── updateUserData ───────────────────────────────────────────────────────────
describe("updateUserData", () => {
  it("retorna true quando update é bem-sucedido", async () => {
    mockUpdateDoc.mockResolvedValueOnce(undefined)
    const result = await updateUserData("user-1", { nome: "Novo Nome" })
    expect(result).toBe(true)
  })

  it("chama updateDoc com os dados corretos", async () => {
    mockUpdateDoc.mockResolvedValueOnce(undefined)
    await updateUserData("user-1", { nome: "Novo Nome", streak: 5 })

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1)
    const [, data] = mockUpdateDoc.mock.calls[0]
    expect(data).toMatchObject({ nome: "Novo Nome", streak: 5 })
  })

  it("retorna false quando Firestore lança erro", async () => {
    mockUpdateDoc.mockRejectedValueOnce(new Error("Offline"))
    const result = await updateUserData("user-1", { nome: "X" })
    expect(result).toBe(false)
  })
})

// ─── syncUserWithFirestore ────────────────────────────────────────────────────
describe("syncUserWithFirestore", () => {
  it("retorna null quando não há usuário autenticado", async () => {
    ;(mockAuth as jest.Mock).mockReturnValue({ currentUser: null })
    const { syncUserWithFirestore } = await import("@/services/userService")
    const result = await syncUserWithFirestore()
    expect(result).toBeNull()
  })

  it("retorna dados existentes quando usuário já tem documento", async () => {
    const fakeCurrentUser = {
      uid: "user-1",
      email: "test@test.com",
      displayName: "Test User",
      photoURL: "",
    }
    ;(mockAuth as jest.Mock).mockReturnValue({ currentUser: fakeCurrentUser })

    const fakeUserData = { uid: "user-1", email: "test@test.com", nome: "Test User" }
    mockGetDoc.mockResolvedValueOnce(makeDocSnapshot("user-1", fakeUserData) as any)

    const { syncUserWithFirestore } = await import("@/services/userService")
    const result = await syncUserWithFirestore()

    expect(result?.email).toBe("test@test.com")
    expect(mockSetDoc).not.toHaveBeenCalled()
  })

  it("cria documento quando usuário é novo", async () => {
    const fakeCurrentUser = {
      uid: "new-user",
      email: "new@test.com",
      displayName: "New User",
      photoURL: "",
    }
    ;(mockAuth as jest.Mock).mockReturnValue({ currentUser: fakeCurrentUser })
    mockGetDoc.mockResolvedValueOnce(makeDocSnapshot("new-user", null) as any)
    mockSetDoc.mockResolvedValueOnce(undefined)

    const { syncUserWithFirestore } = await import("@/services/userService")
    const result = await syncUserWithFirestore()

    expect(mockSetDoc).toHaveBeenCalledTimes(1)
    expect(result?.uid).toBe("new-user")
  })
})
```

---

## `app/services/__tests__/screenTime.test.ts`

```typescript
import { Platform, NativeModules } from "react-native"
import screenTimeService from "@/services/screenTime"

const mockHasPermission = jest.mocked(
  NativeModules.ScreenTimeModule.hasUsageStatsPermission
)

beforeEach(() => {
  jest.clearAllMocks()
  // Limpar o cache entre testes (acesso ao campo privado via cast)
  ;(screenTimeService as any)._permissionCache = null
})

// ─── hasPermission ────────────────────────────────────────────────────────────
describe("hasPermission", () => {
  it("retorna false em plataformas que não são Android", async () => {
    jest.spyOn(Platform, "OS", "get").mockReturnValue("ios")
    const result = await screenTimeService.hasPermission()
    expect(result).toBe(false)
    expect(mockHasPermission).not.toHaveBeenCalled()
    jest.spyOn(Platform, "OS", "get").mockReturnValue("android")
  })

  it("chama o módulo nativo na primeira vez", async () => {
    mockHasPermission.mockResolvedValueOnce(true)
    const result = await screenTimeService.hasPermission()
    expect(result).toBe(true)
    expect(mockHasPermission).toHaveBeenCalledTimes(1)
  })

  it("usa cache na segunda chamada dentro do TTL (30s)", async () => {
    mockHasPermission.mockResolvedValue(true)
    await screenTimeService.hasPermission()
    await screenTimeService.hasPermission()

    // Módulo nativo deve ter sido chamado apenas uma vez
    expect(mockHasPermission).toHaveBeenCalledTimes(1)
  })

  it("invalida cache após TTL de 30s", async () => {
    mockHasPermission.mockResolvedValue(true)

    // Primeira chamada
    await screenTimeService.hasPermission()

    // Simular passagem de 31 segundos
    ;(screenTimeService as any)._permissionCache.ts -= 31_000

    // Segunda chamada deve ir ao módulo nativo novamente
    await screenTimeService.hasPermission()

    expect(mockHasPermission).toHaveBeenCalledTimes(2)
  })

  it("retorna false e não armazena no cache quando módulo lança erro", async () => {
    mockHasPermission.mockRejectedValueOnce(new Error("Native error"))
    const result = await screenTimeService.hasPermission()
    expect(result).toBe(false)
    // Cache deve estar vazio (não deve ser preenchido com false)
    // Na próxima chamada, deve tentar o nativo novamente
    mockHasPermission.mockResolvedValueOnce(true)
    const result2 = await screenTimeService.hasPermission()
    expect(result2).toBe(true)
    expect(mockHasPermission).toHaveBeenCalledTimes(2)
  })
})

// ─── requestPermission ────────────────────────────────────────────────────────
describe("requestPermission", () => {
  it("não faz nada em plataformas que não são Android", () => {
    jest.spyOn(Platform, "OS", "get").mockReturnValue("ios")
    screenTimeService.requestPermission()
    expect(NativeModules.ScreenTimeModule.requestUsageStatsPermission).not.toHaveBeenCalled()
    jest.spyOn(Platform, "OS", "get").mockReturnValue("android")
  })

  it("invalida o cache de permissão ao ser chamado", async () => {
    // Popular o cache
    mockHasPermission.mockResolvedValue(true)
    await screenTimeService.hasPermission()

    // Invalidar via requestPermission
    screenTimeService.requestPermission()

    expect((screenTimeService as any)._permissionCache).toBeNull()
  })
})
```

---

## `app/services/__tests__/feedService.test.ts`

```typescript
import { getDocs, addDoc } from "@react-native-firebase/firestore"
import { getGroupFeed, createFeedPost } from "@/services/feedService"

jest.mock("@/services/notificationService", () => ({
  sendGroupNotification: jest.fn().mockResolvedValue(undefined),
}))

const mockGetDocs = jest.mocked(getDocs)
const mockAddDoc = jest.mocked(addDoc)

function makeQuerySnapshot(docs: { id: string; data: object }[]) {
  return {
    empty: docs.length === 0,
    docs: docs.map((d) => ({ id: d.id, data: () => d.data })),
    forEach: (cb: (doc: any) => void) =>
      docs.forEach((d) => cb({ id: d.id, data: () => d.data })),
  }
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── getGroupFeed ─────────────────────────────────────────────────────────────
describe("getGroupFeed", () => {
  it("retorna posts do feed em ordem", async () => {
    const fakePosts = [
      {
        id: "post-1",
        data: {
          dataCriacao: "2025-05-26T10:00:00.000Z",
          descricao: "Post 1",
          nome: "Usuário 1",
          tipoAtividade: "progresso",
          userId: "user-1",
        },
      },
      {
        id: "post-2",
        data: {
          dataCriacao: "2025-05-26T11:00:00.000Z",
          descricao: "Post 2",
          nome: "Usuário 2",
          tipoAtividade: "desafio_completo",
          userId: "user-2",
        },
      },
    ]
    mockGetDocs.mockResolvedValueOnce(makeQuerySnapshot(fakePosts) as any)

    const result = await getGroupFeed("group-1")

    expect(result).toHaveLength(2)
    expect(result[0].descricao).toBe("Post 1")
    expect(result[0].tipoAtividade).toBe("progresso")
  })

  it("retorna array vazio quando feed está vazio", async () => {
    mockGetDocs.mockResolvedValueOnce(makeQuerySnapshot([]) as any)
    const result = await getGroupFeed("group-1")
    expect(result).toHaveLength(0)
  })

  it("retorna array vazio quando Firestore lança erro", async () => {
    mockGetDocs.mockRejectedValueOnce(new Error("Offline"))
    const result = await getGroupFeed("group-1")
    expect(result).toHaveLength(0)
  })
})

// ─── createFeedPost ───────────────────────────────────────────────────────────
describe("createFeedPost", () => {
  it("retorna o id do post criado", async () => {
    mockAddDoc.mockResolvedValueOnce({ id: "new-post-id" } as any)

    const result = await createFeedPost(
      "group-1", "user-1", "Usuário 1",
      "Descrição do post", "progresso"
    )

    expect(result).toBe("new-post-id")
  })

  it("chama addDoc com os campos obrigatórios", async () => {
    mockAddDoc.mockResolvedValueOnce({ id: "new-post-id" } as any)

    await createFeedPost(
      "group-1", "user-1", "Usuário 1",
      "Descrição do post", "progresso"
    )

    expect(mockAddDoc).toHaveBeenCalledTimes(1)
    const [, postData] = mockAddDoc.mock.calls[0]
    expect(postData.descricao).toBe("Descrição do post")
    expect(postData.userId).toBe("user-1")
    expect(postData.nome).toBe("Usuário 1")
    expect(postData.tipoAtividade).toBe("progresso")
    expect(postData.dataCriacao).toBeTruthy()
  })

  it("retorna null quando Firestore lança erro", async () => {
    mockAddDoc.mockRejectedValueOnce(new Error("Offline"))
    const result = await createFeedPost("g", "u", "N", "D", "progresso")
    expect(result).toBeNull()
  })
})
```

---

## Verificação

```bash
# Rodar todos os service tests
npx jest app/services/__tests__/ --verbose

# Checar cobertura dos services
npx jest app/services/ --coverage --coverageDirectory=coverage/services
```
