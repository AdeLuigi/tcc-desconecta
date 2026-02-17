import auth from "@react-native-firebase/auth"
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, arrayUnion } from "@react-native-firebase/firestore"

/**
 * Interface do usuário no Firestore
 */
export interface UserData {
  uid: string
  email: string
  nome: string
  photoURL: string
  descricao?: string
  dataCriacao: string
  fcmToken?: string // Token para notificações push
  configuracoes: {
    bloqueio_apps: boolean
    limite_tela_minutos: number
    notificacoes: boolean
  }
  premios_colecionaveis: string[]
  streak: number
  desafiosAtivos?: Array<{
    uuid: string
    imagem: string
    nome?: string
    progresso?: number
  }>
}

/**
 * Valores padrão para um novo usuário
 */
const DEFAULT_USER_DATA = {
  descricao: "",
  configuracoes: {
    bloqueio_apps: false,
    limite_tela_minutos: 180,
    notificacoes: true,
  },
  premios_colecionaveis: [],
  streak: 0,
  desafiosAtivos: [],
}

/**
 * Sincroniza o usuário com o Firestore após login
 * Se o usuário não existir, cria um novo documento
 * Se já existir, apenas busca os dados
 */
export async function syncUserWithFirestore(): Promise<UserData | null> {
  try {
    const currentUser = auth().currentUser

    if (!currentUser) {
      console.error("Nenhum usuário autenticado")
      return null
    }

    const { uid, email, displayName, photoURL } = currentUser

    if (!email) {
      console.error("Usuário sem email")
      return null
    }

    const db = getFirestore()
    const userRef = doc(db, "usuarios", uid)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      // Usuário já existe, retorna os dados
      const userData = userDoc.data() as UserData
      return userData
    } else {
      // Usuário novo, cria documento
      const newUserData: UserData = {
        uid,
        email,
        nome: displayName || email.split("@")[0],
        photoURL: photoURL || "",
        dataCriacao: new Date().toISOString(),
        ...DEFAULT_USER_DATA,
      }

      await setDoc(userRef, newUserData)
      return newUserData
    }
  } catch (error) {
    console.error("Erro ao sincronizar usuário com Firestore:", error)
    return null
  }
}

/**
 * Busca os dados do usuário do Firestore
 */
export async function getUserData(uid: string): Promise<UserData | null> {
  try {
    const db = getFirestore()
    const userRef = doc(db, "usuarios", uid)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      return userDoc.data() as UserData
    }

    return null
  } catch (error) {
    console.error("Erro ao buscar dados do usuário:", error)
    return null
  }
}

/**
 * Atualiza os dados do usuário no Firestore
 */
export async function updateUserData(
  uid: string,
  data: Partial<UserData>,
): Promise<boolean> {
  try {
    const db = getFirestore()
    const userRef = doc(db, "usuarios", uid)
    await updateDoc(userRef, data)
    return true
  } catch (error) {
    console.error("Erro ao atualizar dados do usuário:", error)
    return false
  }
}

/**
 * Atualiza as configurações do usuário
 */
export async function updateUserSettings(
  uid: string,
  settings: Partial<UserData["configuracoes"]>,
): Promise<boolean> {
  try {
    const db = getFirestore()
    const userRef = doc(db, "usuarios", uid)
    const currentData = await getDoc(userRef)

    if (!currentData.exists()) {
      console.error("Usuário não encontrado")
      return false
    }

    const currentSettings = currentData.data()?.configuracoes || {}

    await updateDoc(userRef, {
      configuracoes: {
        ...currentSettings,
        ...settings,
      },
    })

    return true
  } catch (error) {
    console.error("Erro ao atualizar configurações:", error)
    return false
  }
}

/**
 * Atualiza o streak do usuário
 */
export async function updateUserStreak(uid: string, streak: number): Promise<boolean> {
  try {
    const db = getFirestore()
    const userRef = doc(db, "usuarios", uid)
    await updateDoc(userRef, { streak })
    return true
  } catch (error) {
    console.error("Erro ao atualizar streak:", error)
    return false
  }
}

/**
 * Adiciona um prêmio à coleção do usuário
 */
export async function addPremioColecao(uid: string, premioId: string): Promise<boolean> {
  try {
    const db = getFirestore()
    const userRef = doc(db, "usuarios", uid)
    await updateDoc(userRef, {
      premios_colecionaveis: arrayUnion(premioId),
    })
    return true
  } catch (error) {
    console.error("Erro ao adicionar prêmio:", error)
    return false
  }
}
