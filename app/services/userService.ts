import auth from "@react-native-firebase/auth"
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, arrayUnion } from "@react-native-firebase/firestore"
import { NetworkError, NotFoundError } from "@/domain/errors"

/**
 * Interface do usuário no Firestore
 */
export interface LimiteConfig {
  nome: string
  emoji: string
  appsComLimite: string[] // package names
  sitesComLimite: string[]
  limiteMinutos: number
  diasAtivos: string[] // ex: ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"]
}

export interface UserData {
  uid: string
  email: string
  nome: string
  photoURL: string
  descricao?: string
  dataNascimento?: string
  dataCriacao: string
  fcmToken?: string // Token para notificações push
  configuracoes: {
    bloqueio_apps: boolean
    limite_tela_ativo: boolean
    limite_tela_minutos: number
    notificacoes: boolean
    appsComLimite: string[] // package names (legado, mantido por compatibilidade)
    sitesComLimite: string[]
    limiteAppsNome: string
    limitesDeApps?: LimiteConfig[]
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
  dataNascimento: "",
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

/**
 * Sincroniza o usuário com o Firestore após login
 * Se o usuário não existir, cria um novo documento
 * Se já existir, apenas busca os dados
 */
export async function syncUserWithFirestore(): Promise<UserData | null> {
  const currentUser = auth().currentUser
  if (!currentUser) return null

  const { uid, email, displayName, photoURL } = currentUser
  if (!email) return null

  const db = getFirestore()
  const userRef = doc(db, "usuarios", uid)
  const userDoc = await getDoc(userRef)

  if (userDoc.exists()) {
    return userDoc.data() as UserData
  }

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

/**
 * Busca os dados do usuário do Firestore
 */
export async function getUserData(uid: string): Promise<UserData | null> {
  const db = getFirestore()
  const userRef = doc(db, "usuarios", uid)
  const userDoc = await getDoc(userRef)
  if (!userDoc.exists()) return null
  return userDoc.data() as UserData
}

/**
 * Atualiza os dados do usuário no Firestore
 */
export async function updateUserData(
  uid: string,
  data: Partial<UserData>,
): Promise<void> {
  const db = getFirestore()
  const userRef = doc(db, "usuarios", uid)
  await updateDoc(userRef, data as Record<string, unknown>)
}

/**
 * Atualiza as configurações do usuário
 */
export async function updateUserSettings(
  uid: string,
  settings: Partial<UserData["configuracoes"]>,
): Promise<void> {
  const db = getFirestore()
  const userRef = doc(db, "usuarios", uid)
  const currentData = await getDoc(userRef)

  if (!currentData.exists()) throw new NotFoundError("Usuário", uid)

  const currentSettings = currentData.data()?.configuracoes || {}
  await updateDoc(userRef, {
    configuracoes: { ...currentSettings, ...settings },
  })
}

/**
 * Atualiza o streak do usuário
 */
export async function updateUserStreak(uid: string, streak: number): Promise<void> {
  const db = getFirestore()
  const userRef = doc(db, "usuarios", uid)
  await updateDoc(userRef, { streak })
}

/**
 * Adiciona um prêmio à coleção do usuário
 */
export async function addPremioColecao(uid: string, premioId: string): Promise<void> {
  const db = getFirestore()
  const userRef = doc(db, "usuarios", uid)
  await updateDoc(userRef, { premios_colecionaveis: arrayUnion(premioId) })
}
