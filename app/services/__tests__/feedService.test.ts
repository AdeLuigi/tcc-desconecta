import { getDocs, getDoc, addDoc } from "@react-native-firebase/firestore"
import { getGroupFeed, createFeedPost } from "@/services/feedService"
import { sendGroupNotification } from "@/services/notificationService"

jest.mock("@/services/notificationService", () => ({
  sendGroupNotification: jest.fn().mockResolvedValue(undefined),
}))

const mockGetDocs = jest.mocked(getDocs)
const mockGetDoc = jest.mocked(getDoc)
const mockAddDoc = jest.mocked(addDoc)
const mockSendGroupNotification = jest.mocked(sendGroupNotification)

/** Cria um QuerySnapshot fake */
function makeQuerySnapshot(docs: { id: string; data: object }[]) {
  const docSnaps = docs.map((d) => ({
    id: d.id,
    data: () => d.data,
    exists: () => true,
  }))
  return {
    empty: docs.length === 0,
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

const FAKE_POSTS = [
  {
    id: "post-1",
    data: {
      dataCriacao: "2025-05-26T10:00:00.000Z",
      descricao: "Primeiro post",
      foto: "",
      nome: "Usuário 1",
      tipoAtividade: "progresso",
      userId: "user-1",
      photoURL: "",
    },
  },
  {
    id: "post-2",
    data: {
      dataCriacao: "2025-05-26T11:00:00.000Z",
      descricao: "Segundo post",
      foto: "https://exemplo.com/foto.jpg",
      nome: "Usuário 2",
      tipoAtividade: "desafio_completo",
      userId: "user-2",
      photoURL: "https://exemplo.com/avatar.jpg",
    },
  },
]

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── getGroupFeed ─────────────────────────────────────────────────────────────
describe("getGroupFeed", () => {
  it("retorna todos os posts do feed", async () => {
    mockGetDocs.mockResolvedValueOnce(makeQuerySnapshot(FAKE_POSTS) as any)

    const result = await getGroupFeed("group-1")

    expect(result).toHaveLength(2)
    expect(result[0].id).toBe("post-1")
    expect(result[0].descricao).toBe("Primeiro post")
    expect(result[0].tipoAtividade).toBe("progresso")
  })

  it("mapeia corretamente todos os campos de um post", async () => {
    mockGetDocs.mockResolvedValueOnce(makeQuerySnapshot([FAKE_POSTS[1]]) as any)

    const [post] = await getGroupFeed("group-1")

    expect(post.id).toBe("post-2")
    expect(post.dataCriacao).toBe("2025-05-26T11:00:00.000Z")
    expect(post.foto).toBe("https://exemplo.com/foto.jpg")
    expect(post.nome).toBe("Usuário 2")
    expect(post.tipoAtividade).toBe("desafio_completo")
    expect(post.userId).toBe("user-2")
    expect(post.photoURL).toBe("https://exemplo.com/avatar.jpg")
  })

  it("retorna array vazio quando o feed não tem posts", async () => {
    mockGetDocs.mockResolvedValueOnce(makeQuerySnapshot([]) as any)
    const result = await getGroupFeed("group-1")
    expect(result).toHaveLength(0)
  })

  it("retorna array vazio (não lança erro) quando Firestore falha", async () => {
    mockGetDocs.mockRejectedValueOnce(new Error("Offline"))
    const result = await getGroupFeed("group-1")
    expect(result).toHaveLength(0)
  })

  it("preenche campos ausentes com valores padrão", async () => {
    // Post sem campos opcionais
    mockGetDocs.mockResolvedValueOnce(
      makeQuerySnapshot([{ id: "post-min", data: { userId: "user-1" } }]) as any,
    )

    const [post] = await getGroupFeed("group-1")

    expect(post.descricao).toBe("")
    expect(post.nome).toBe("")
    expect(post.foto).toBe("")
    expect(post.photoURL).toBe("")
    expect(post.tipoAtividade).toBe("progresso") // valor padrão
  })
})

// ─── createFeedPost ───────────────────────────────────────────────────────────
describe("createFeedPost", () => {
  beforeEach(() => {
    // addDoc para o post retorna id
    mockAddDoc.mockResolvedValue({ id: "new-post-id" } as any)
    // getDoc para buscar dados do grupo (usado para enviar notificação)
    mockGetDoc.mockResolvedValue(
      makeDocSnapshot("group-1", { nome: "Grupo Teste", membros: [] }) as any,
    )
  })

  it("retorna o id do post criado", async () => {
    const result = await createFeedPost(
      "group-1",
      "user-1",
      "Usuário 1",
      "Descrição do post",
      "progresso",
    )
    expect(result).toBe("new-post-id")
  })

  it("salva todos os campos obrigatórios no Firestore", async () => {
    await createFeedPost("group-1", "user-1", "Usuário 1", "Descrição", "progresso")

    expect(mockAddDoc).toHaveBeenCalledTimes(1)
    const [, postData] = mockAddDoc.mock.calls[0]

    expect(postData.descricao).toBe("Descrição")
    expect(postData.userId).toBe("user-1")
    expect(postData.nome).toBe("Usuário 1")
    expect(postData.tipoAtividade).toBe("progresso")
    expect(postData.dataCriacao).toBeTruthy()
  })

  it("inclui foto quando fornecida", async () => {
    await createFeedPost(
      "group-1", "user-1", "Nome", "Desc", "progresso",
      "https://example.com/foto.jpg"
    )

    const [, postData] = mockAddDoc.mock.calls[0]
    expect(postData.foto).toBe("https://example.com/foto.jpg")
  })

  it("envia notificação para os membros do grupo", async () => {
    await createFeedPost("group-1", "user-1", "Usuário 1", "Descrição", "progresso")

    expect(mockSendGroupNotification).toHaveBeenCalledTimes(1)
  })

  it("retorna o id do post mesmo quando notificação falha", async () => {
    // Notificação lança erro, mas o post já foi criado
    mockSendGroupNotification.mockRejectedValueOnce(new Error("FCM error"))

    const result = await createFeedPost("group-1", "user-1", "Nome", "Desc", "progresso")

    // Post foi criado com sucesso
    expect(result).toBe("new-post-id")
  })

  it("retorna null (não lança erro) quando Firestore falha ao criar post", async () => {
    mockAddDoc.mockRejectedValueOnce(new Error("Offline"))

    const result = await createFeedPost("group-1", "user-1", "Nome", "Desc", "progresso")

    expect(result).toBeNull()
  })
})
