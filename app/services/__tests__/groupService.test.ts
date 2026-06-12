import { getDocs, getDoc, addDoc } from "@react-native-firebase/firestore"
import {
  getUserGroups,
  getGroupById,
  createGroup,
} from "@/services/groupService"
import { getUserData } from "@/services/userService"

jest.mock("@/services/userService", () => ({
  getUserData: jest.fn(),
}))

const mockGetDocs = jest.mocked(getDocs)
const mockGetDoc = jest.mocked(getDoc)
const mockAddDoc = jest.mocked(addDoc)
const mockGetUserData = jest.mocked(getUserData)

/** Cria um QuerySnapshot fake com os documentos fornecidos */
function makeQuerySnapshot(docs: { id: string; data: object }[]) {
  const docSnaps = docs.map((d) => ({
    id: d.id,
    data: () => d.data,
    exists: () => true,
  }))
  return {
    empty: docs.length === 0,
    size: docs.length,
    docs: docSnaps,
    forEach: (cb: (doc: (typeof docSnaps)[number]) => void) => docSnaps.forEach(cb),
  }
}

/** Cria um DocumentSnapshot fake */
function makeDocSnapshot(id: string, data: object | null) {
  return {
    id,
    exists: () => data !== null,
    data: () => data ?? undefined,
  }
}

const FAKE_GROUP_DATA = {
  nome: "Grupo Teste",
  descricao: "Descrição do grupo",
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
        { id: "group-1", data: FAKE_GROUP_DATA },
        {
          id: "group-2",
          data: {
            ...FAKE_GROUP_DATA,
            membros: [{ userId: "outro-user", cargo: "membro", nome: "X" }],
          },
        },
      ]) as any,
    )

    const result = await getUserGroups("user-1")

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("group-1")
    expect(result[0].nome).toBe("Grupo Teste")
    expect(result[0].codigoGrupo).toBe("ABC123")
  })

  it("retorna array vazio quando usuário não é membro de nenhum grupo", async () => {
    mockGetDocs.mockResolvedValueOnce(
      makeQuerySnapshot([
        {
          id: "group-1",
          data: {
            ...FAKE_GROUP_DATA,
            membros: [{ userId: "outro-user", cargo: "membro", nome: "X" }],
          },
        },
      ]) as any,
    )

    const result = await getUserGroups("user-sem-grupos")
    expect(result).toHaveLength(0)
  })

  it("retorna array vazio quando a coleção está vazia", async () => {
    mockGetDocs.mockResolvedValueOnce(makeQuerySnapshot([]) as any)
    const result = await getUserGroups("user-1")
    expect(result).toHaveLength(0)
  })

  it("retorna múltiplos grupos quando usuário é membro em vários", async () => {
    const userId = "user-em-dois-grupos"
    mockGetDocs.mockResolvedValueOnce(
      makeQuerySnapshot([
        {
          id: "group-1",
          data: { ...FAKE_GROUP_DATA, membros: [{ userId, cargo: "administrador", nome: "X" }] },
        },
        {
          id: "group-2",
          data: { ...FAKE_GROUP_DATA, membros: [{ userId, cargo: "membro", nome: "X" }] },
        },
      ]) as any,
    )

    const result = await getUserGroups(userId)
    expect(result).toHaveLength(2)
  })

  it("retorna array vazio (não lança erro) quando Firestore falha", async () => {
    mockGetDocs.mockRejectedValueOnce(new Error("Firestore offline"))
    const result = await getUserGroups("user-1")
    expect(result).toHaveLength(0)
  })
})

// ─── getGroupById ─────────────────────────────────────────────────────────────
describe("getGroupById", () => {
  it("retorna o grupo com todos os campos quando o documento existe", async () => {
    mockGetDoc.mockResolvedValueOnce(makeDocSnapshot("group-1", FAKE_GROUP_DATA) as any)

    const result = await getGroupById("group-1")

    expect(result).not.toBeNull()
    expect(result?.id).toBe("group-1")
    expect(result?.nome).toBe("Grupo Teste")
    expect(result?.membros).toHaveLength(2)
    expect(result?.codigoGrupo).toBe("ABC123")
  })

  it("retorna null quando o documento não existe", async () => {
    mockGetDoc.mockResolvedValueOnce(makeDocSnapshot("group-999", null) as any)
    const result = await getGroupById("group-999")
    expect(result).toBeNull()
  })

  it("retorna null (não lança erro) quando Firestore falha", async () => {
    mockGetDoc.mockRejectedValueOnce(new Error("Firestore error"))
    const result = await getGroupById("group-1")
    expect(result).toBeNull()
  })

  it("preenche campos ausentes com valores padrão", async () => {
    // Documento com apenas campos obrigatórios (sem foto, dataLimite, etc.)
    mockGetDoc.mockResolvedValueOnce(
      makeDocSnapshot("group-1", { nome: "Grupo Mínimo", codigoGrupo: "XYZ999" }) as any,
    )

    const result = await getGroupById("group-1")

    expect(result).not.toBeNull()
    expect(result?.membros).toEqual([])
    expect(result?.ranking_mensal).toEqual([])
    expect(result?.descricao).toBe("")
    expect(result?.dataLimite).toBeUndefined()
  })
})

// ─── createGroup ──────────────────────────────────────────────────────────────
describe("createGroup", () => {
  beforeEach(() => {
    mockGetUserData.mockResolvedValue({
      uid: "user-1",
      nome: "Admin Teste",
      email: "admin@test.com",
    } as any)

    // Simular que nenhum código de grupo existe ainda
    mockGetDocs.mockResolvedValue(makeQuerySnapshot([]) as any)

    mockAddDoc.mockResolvedValue({ id: "new-group-id" } as any)
  })

  it("retorna o id do grupo recém-criado", async () => {
    const result = await createGroup("Meu Grupo", "Descrição", "", "user-1")
    expect(result).toBe("new-group-id")
  })

  it("inclui o criador como administrador nos membros", async () => {
    await createGroup("Meu Grupo", "Descrição", "", "user-1")

    const [, docData] = mockAddDoc.mock.calls[0]
    expect(docData.membros).toHaveLength(1)
    expect(docData.membros[0].userId).toBe("user-1")
    expect(docData.membros[0].cargo).toBe("administrador")
  })

  it("gera um código de grupo com 6 caracteres", async () => {
    await createGroup("Meu Grupo", "Descrição", "", "user-1")

    const [, docData] = mockAddDoc.mock.calls[0]
    expect(docData.codigoGrupo).toHaveLength(6)
  })

  it("inclui dataLimite quando fornecida", async () => {
    await createGroup("Meu Grupo", "Desc", "", "user-1", "2025-12-31")

    const [, docData] = mockAddDoc.mock.calls[0]
    expect(docData.dataLimite).toBe("2025-12-31")
  })

  it("não inclui dataLimite quando não fornecida", async () => {
    await createGroup("Meu Grupo", "Desc", "", "user-1")

    const [, docData] = mockAddDoc.mock.calls[0]
    expect(docData.dataLimite).toBeUndefined()
  })

  it("retorna null (não lança erro) quando Firestore falha", async () => {
    mockAddDoc.mockRejectedValueOnce(new Error("Firestore error"))
    const result = await createGroup("Grupo", "Desc", "", "user-1")
    expect(result).toBeNull()
  })
})
