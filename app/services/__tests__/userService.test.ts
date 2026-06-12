import { getDoc, setDoc, updateDoc } from "@react-native-firebase/firestore"
import auth from "@react-native-firebase/auth"
import { getUserData, updateUserData, syncUserWithFirestore } from "@/services/userService"

const mockGetDoc = jest.mocked(getDoc)
const mockSetDoc = jest.mocked(setDoc)
const mockUpdateDoc = jest.mocked(updateDoc)
const mockAuth = jest.mocked(auth)

/** Cria um DocumentSnapshot fake */
function makeDocSnapshot(id: string, data: object | null) {
  return {
    id,
    exists: () => data !== null,
    data: () => data ?? undefined,
  }
}

const FAKE_USER_DATA = {
  uid: "user-1",
  email: "test@test.com",
  nome: "Usuário Teste",
  photoURL: "",
  dataCriacao: "2025-01-01T00:00:00.000Z",
  configuracoes: {
    bloqueio_apps: false,
    limite_tela_ativo: false,
    limite_tela_minutos: 60,
    notificacoes: true,
    appsComLimite: [],
    sitesComLimite: [],
    limiteAppsNome: "",
    limitesDeApps: [],
  },
  premios_colecionaveis: [],
  streak: 0,
  desafiosAtivos: [],
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── getUserData ──────────────────────────────────────────────────────────────
describe("getUserData", () => {
  it("retorna os dados do usuário quando o documento existe", async () => {
    mockGetDoc.mockResolvedValueOnce(makeDocSnapshot("user-1", FAKE_USER_DATA) as any)

    const result = await getUserData("user-1")

    expect(result).not.toBeNull()
    expect(result?.uid).toBe("user-1")
    expect(result?.email).toBe("test@test.com")
    expect(result?.nome).toBe("Usuário Teste")
  })

  it("retorna null quando o documento não existe", async () => {
    mockGetDoc.mockResolvedValueOnce(makeDocSnapshot("user-999", null) as any)
    const result = await getUserData("user-999")
    expect(result).toBeNull()
  })

  it("retorna null (não lança erro) quando Firestore falha", async () => {
    mockGetDoc.mockRejectedValueOnce(new Error("Offline"))
    const result = await getUserData("user-1")
    expect(result).toBeNull()
  })
})

// ─── updateUserData ───────────────────────────────────────────────────────────
describe("updateUserData", () => {
  it("retorna true quando o update é bem-sucedido", async () => {
    mockUpdateDoc.mockResolvedValueOnce(undefined)
    const result = await updateUserData("user-1", { nome: "Novo Nome" })
    expect(result).toBe(true)
  })

  it("chama updateDoc uma única vez com os dados corretos", async () => {
    mockUpdateDoc.mockResolvedValueOnce(undefined)

    await updateUserData("user-1", { nome: "Novo Nome", streak: 5 })

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1)
    const [, data] = mockUpdateDoc.mock.calls[0]
    expect(data).toMatchObject({ nome: "Novo Nome", streak: 5 })
  })

  it("retorna false (não lança erro) quando Firestore falha", async () => {
    mockUpdateDoc.mockRejectedValueOnce(new Error("Offline"))
    const result = await updateUserData("user-1", { nome: "X" })
    expect(result).toBe(false)
  })
})

// ─── syncUserWithFirestore ────────────────────────────────────────────────────
describe("syncUserWithFirestore", () => {
  it("retorna null quando não há usuário autenticado", async () => {
    mockAuth.mockReturnValue({ currentUser: null } as any)

    const result = await syncUserWithFirestore()
    expect(result).toBeNull()
  })

  it("retorna dados existentes sem criar novo documento quando usuário já existe", async () => {
    mockAuth.mockReturnValue({
      currentUser: {
        uid: "user-1",
        email: "test@test.com",
        displayName: "Test User",
        photoURL: "",
      },
    } as any)

    mockGetDoc.mockResolvedValueOnce(makeDocSnapshot("user-1", FAKE_USER_DATA) as any)

    const result = await syncUserWithFirestore()

    expect(result).not.toBeNull()
    expect((result as any).email).toBe("test@test.com")
    expect(mockSetDoc).not.toHaveBeenCalled()
  })

  it("cria documento e retorna dados quando usuário é novo", async () => {
    mockAuth.mockReturnValue({
      currentUser: {
        uid: "new-user",
        email: "new@test.com",
        displayName: "New User",
        photoURL: "",
      },
    } as any)

    mockGetDoc.mockResolvedValueOnce(makeDocSnapshot("new-user", null) as any)
    mockSetDoc.mockResolvedValueOnce(undefined)

    const result = await syncUserWithFirestore()

    expect(mockSetDoc).toHaveBeenCalledTimes(1)
    expect((result as any).uid).toBe("new-user")
    expect((result as any).email).toBe("new@test.com")
  })

  it("usa parte do email como nome quando displayName é null", async () => {
    mockAuth.mockReturnValue({
      currentUser: {
        uid: "user-sem-nome",
        email: "joao.silva@test.com",
        displayName: null,
        photoURL: "",
      },
    } as any)

    mockGetDoc.mockResolvedValueOnce(makeDocSnapshot("user-sem-nome", null) as any)
    mockSetDoc.mockResolvedValueOnce(undefined)

    const result = await syncUserWithFirestore()

    // O nome deve ser derivado do email (parte antes do @)
    expect((result as any).nome).toBe("joao.silva")
  })

  it("retorna null (não lança erro) quando Firestore falha", async () => {
    mockAuth.mockReturnValue({
      currentUser: {
        uid: "user-1",
        email: "test@test.com",
        displayName: "Test",
        photoURL: "",
      },
    } as any)

    mockGetDoc.mockRejectedValueOnce(new Error("Offline"))

    const result = await syncUserWithFirestore()
    expect(result).toBeNull()
  })
})
