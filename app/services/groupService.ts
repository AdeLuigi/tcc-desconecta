import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, arrayUnion, query, where } from "@react-native-firebase/firestore"
import { getUserData } from "./userService"
import { NotFoundError, PermissionError, ConflictError, NetworkError } from "@/domain/errors"
import { GroupCode } from "@/domain/GroupCode"

/**
 * Verifica se um código de grupo já existe
 */
async function groupCodeExists(code: string): Promise<boolean> {
  try {
    const db = getFirestore()
    const groupsRef = collection(db, "grupos")
    const q = query(groupsRef, where("codigoGrupo", "==", code))
    const snapshot = await getDocs(q)
    return !snapshot.empty
  } catch (error) {
    console.error("Erro ao verificar código do grupo:", error)
    return false
  }
}

/**
 * Gera um código único para o grupo usando crypto (seguro)
 */
async function generateUniqueGroupCode(): Promise<string> {
  let code = GroupCode.generate().toString()
  let attempts = 0
  const maxAttempts = 10

  while (await groupCodeExists(code) && attempts < maxAttempts) {
    code = GroupCode.generate().toString()
    attempts++
  }

  if (attempts >= maxAttempts) {
    throw new Error("Não foi possível gerar um código único para o grupo")
  }

  return code
}

/**
 * Interface do grupo no Firestore
 */
export interface GroupMember {
  userId: string
  cargo: "administrador" | "membro"
  nome: string
}

export interface RankingMember {
  userId: string
  pontos: number
  nome: string
}

export type GroupType = "screenTime" | "screenTimeForApps" | "checkin"

export interface Group {
  id: string
  nome: string
  descricao: string
  foto: string
  criado_em: string
  dataLimite?: string
  criterioRanking?: string
  groupType?: GroupType
  selectedApps?: string[]
  selectedSites?: string[]
  membros: GroupMember[]
  ranking_mensal: RankingMember[]
  codigoGrupo: string
}

/**
 * Busca todos os grupos em que o usuário é membro
 */
export async function getUserGroups(userId: string): Promise<Group[]> {
  try {
    const db = getFirestore()
    const q = query(
      collection(db, "grupos"),
      where("membrosIds", "array-contains", userId),
    )
    const snapshot = await getDocs(q)

    return snapshot.docs.map((docSnap: any) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        nome: data.nome || "",
        descricao: data.descricao || "",
        foto: data.foto || "",
        criado_em: data.criado_em || "",
        dataLimite: data.dataLimite || undefined,
        criterioRanking: data.criterioRanking || undefined,
        groupType: data.groupType || undefined,
        selectedApps: data.selectedApps || undefined,
        selectedSites: data.selectedSites || undefined,
        membros: data.membros || [],
        ranking_mensal: data.ranking_mensal || [],
        codigoGrupo: data.codigoGrupo || "",
      }
    })
  } catch (error) {
    throw new NetworkError("Erro ao buscar grupos do usuário.")
  }
}

/**
 * Busca um grupo específico por ID
 */
export async function getGroupById(groupId: string): Promise<Group | null> {
  const db = getFirestore()
  const groupRef = doc(db, "grupos", groupId)
  const groupDoc = await getDoc(groupRef)

  if (!groupDoc.exists()) return null

  const data = groupDoc.data()
  return {
    id: groupDoc.id,
    nome: data?.nome || "",
    descricao: data?.descricao || "",
    foto: data?.foto || "",
    criado_em: data?.criado_em || "",
    dataLimite: data?.dataLimite || undefined,
    criterioRanking: data?.criterioRanking || undefined,
    groupType: data?.groupType || undefined,
    selectedApps: data?.selectedApps || undefined,
    selectedSites: data?.selectedSites || undefined,
    membros: data?.membros || [],
    ranking_mensal: data?.ranking_mensal || [],
    codigoGrupo: data?.codigoGrupo || "",
  }
}

/**
 * Cria um novo grupo
 */
export async function createGroup(
  nome: string,
  descricao: string,
  foto: string,
  adminUserId: string,
  dataLimite?: string,
  criterioRanking?: string,
  groupType?: GroupType,
  selectedApps?: string[],
  selectedSites?: string[],
): Promise<string> {
  const userData = await getUserData(adminUserId)
  const userName = userData?.nome || "Admin"
  const codigoGrupo = await generateUniqueGroupCode()

  const newGroup = {
    nome,
    descricao,
    foto,
    criado_em: new Date().toISOString(),
    ...(dataLimite ? { dataLimite } : {}),
    ...(criterioRanking ? { criterioRanking } : {}),
    ...(groupType ? { groupType } : {}),
    ...(selectedApps && selectedApps.length > 0 ? { selectedApps } : {}),
    ...(selectedSites && selectedSites.length > 0 ? { selectedSites } : {}),
    codigoGrupo,
    membrosIds: [adminUserId],
    membros: [
      {
        userId: adminUserId,
        cargo: "administrador" as const,
        nome: userName,
      },
    ],
    ranking_mensal: [
      {
        userId: adminUserId,
        pontos: 0,
        nome: userName,
      },
    ],
  }

  const db = getFirestore()
  const groupsRef = collection(db, "grupos")
  const docRef = await addDoc(groupsRef, newGroup)
  return docRef.id
}

/**
 * Adiciona um membro ao grupo
 */
export async function addMemberToGroup(
  groupId: string,
  userId: string,
): Promise<void> {
  const db = getFirestore()
  const groupRef = doc(db, "grupos", groupId)
  await updateDoc(groupRef, {
    membrosIds: arrayUnion(userId),
    membros: arrayUnion({ userId, cargo: "membro" }),
    ranking_mensal: arrayUnion({ userId, pontos: 0 }),
  })
}

/**
 * Remove um membro do grupo
 */
export async function removeMemberFromGroup(
  groupId: string,
  userId: string,
): Promise<void> {
  const group = await getGroupById(groupId)
  if (!group) throw new NotFoundError("Grupo", groupId)

  const updatedMembros = group.membros.filter((m) => m.userId !== userId)
  const updatedRanking = group.ranking_mensal.filter((r) => r.userId !== userId)

  const db = getFirestore()
  const groupRef = doc(db, "grupos", groupId)
  await updateDoc(groupRef, {
    membrosIds: updatedMembros.map((m) => m.userId),
    membros: updatedMembros,
    ranking_mensal: updatedRanking,
  })
}

/**
 * Atualiza pontos de um usuário no ranking mensal
 */
export async function updateMemberPoints(
  groupId: string,
  userId: string,
  pontos: number,
): Promise<void> {
  const group = await getGroupById(groupId)
  if (!group) throw new NotFoundError("Grupo", groupId)

  const updatedRanking = group.ranking_mensal.map((member) =>
    member.userId === userId ? { ...member, pontos } : member,
  )

  const db = getFirestore()
  const groupRef = doc(db, "grupos", groupId)
  await updateDoc(groupRef, { ranking_mensal: updatedRanking })
}

/**
 * Busca um grupo pelo código
 */
export async function getGroupByCode(code: string): Promise<Group | null> {
  const db = getFirestore()
  const groupsRef = collection(db, "grupos")
  const q = query(groupsRef, where("codigoGrupo", "==", code.toUpperCase()))
  const snapshot = await getDocs(q)

  if (snapshot.empty) return null

  const docSnap = snapshot.docs[0]
  const data = docSnap.data()
  return {
    id: docSnap.id,
    nome: data.nome || "",
    descricao: data.descricao || "",
    foto: data.foto || "",
    criado_em: data.criado_em || "",
    membros: data.membros || [],
    ranking_mensal: data.ranking_mensal || [],
    codigoGrupo: data.codigoGrupo || "",
  }
}

/**
 * Adiciona o usuário a um grupo usando o código
 */
export async function joinGroupByCode(code: string, userId: string): Promise<Group> {
  const group = await getGroupByCode(code)
  if (!group) throw new NotFoundError("Grupo", code)

  const isAlreadyMember = group.membros.some((m) => m.userId === userId)
  if (isAlreadyMember) throw new ConflictError("Você já é membro deste grupo.")

  const userData = await getUserData(userId)
  const userName = userData?.nome || "Usuário"

  const db = getFirestore()
  const groupRef = doc(db, "grupos", group.id)
  await updateDoc(groupRef, {
    membrosIds: arrayUnion(userId),
    membros: arrayUnion({ userId, cargo: "membro", nome: userName }),
    ranking_mensal: arrayUnion({ userId, pontos: 0, nome: userName }),
  })

  return (await getGroupById(group.id)) ?? group
}

/**
 * Sair de um grupo (usuário remove a si mesmo)
 */
export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  const group = await getGroupById(groupId)
  if (!group) throw new NotFoundError("Grupo", groupId)

  if (group.membros.length === 1) {
    const db = getFirestore()
    await deleteDoc(doc(db, "grupos", groupId))
    return
  }

  const userMember = group.membros.find((m) => m.userId === userId)
  const isAdmin = userMember?.cargo === "administrador"

  if (isAdmin) {
    const adminCount = group.membros.filter((m) => m.cargo === "administrador").length
    if (adminCount === 1) {
      throw new PermissionError("Você é o único administrador. Promova outro membro antes de sair.")
    }
  }

  await removeMemberFromGroup(groupId, userId)
}

/**
 * Conceder cargo de administrador a um membro
 */
export async function grantAdminRole(
  groupId: string,
  userId: string,
  adminUserId: string,
): Promise<void> {
  const group = await getGroupById(groupId)
  if (!group) throw new NotFoundError("Grupo", groupId)

  const adminMember = group.membros.find((m) => m.userId === adminUserId)
  if (!adminMember || adminMember.cargo !== "administrador") {
    throw new PermissionError("Você não tem permissão para conceder administrador.")
  }

  const targetMember = group.membros.find((m) => m.userId === userId)
  if (!targetMember) throw new NotFoundError("Membro")

  if (targetMember.cargo === "administrador") {
    throw new ConflictError("Este usuário já é administrador.")
  }

  const updatedMembros = group.membros.map((m) =>
    m.userId === userId ? { ...m, cargo: "administrador" as const } : m,
  )

  const db = getFirestore()
  await updateDoc(doc(db, "grupos", groupId), { membros: updatedMembros })
}

/**
 * Atualizar descrição do grupo (apenas admin)
 */
export async function updateGroupDescription(
  groupId: string,
  newDescription: string,
  userId: string,
): Promise<void> {
  const group = await getGroupById(groupId)
  if (!group) throw new NotFoundError("Grupo", groupId)

  const userMember = group.membros.find((m) => m.userId === userId)
  if (!userMember || userMember.cargo !== "administrador") {
    throw new PermissionError("Apenas administradores podem editar a descrição.")
  }

  const db = getFirestore()
  await updateDoc(doc(db, "grupos", groupId), { descricao: newDescription.trim() })
}

/**
 * Atualizar foto do grupo (apenas admin)
 */
export async function updateGroupPhoto(
  groupId: string,
  newPhotoURL: string,
  userId: string,
): Promise<void> {
  const group = await getGroupById(groupId)
  if (!group) throw new NotFoundError("Grupo", groupId)

  const userMember = group.membros.find((m) => m.userId === userId)
  if (!userMember || userMember.cargo !== "administrador") {
    throw new PermissionError("Apenas administradores podem editar a foto.")
  }

  const db = getFirestore()
  await updateDoc(doc(db, "grupos", groupId), { foto: newPhotoURL })
}

/**
 * Atualizar nome do grupo (apenas admin)
 */
export async function updateGroupName(
  groupId: string,
  newName: string,
  userId: string,
): Promise<void> {
  const group = await getGroupById(groupId)
  if (!group) throw new NotFoundError("Grupo", groupId)

  const userMember = group.membros.find((m) => m.userId === userId)
  if (!userMember || userMember.cargo !== "administrador") {
    throw new PermissionError("Apenas administradores podem editar o nome.")
  }

  const db = getFirestore()
  await updateDoc(doc(db, "grupos", groupId), { nome: newName.trim() })
}

/**
 * Verifica se um usuário é administrador do grupo
 */
export function isUserAdmin(group: Group, userId: string): boolean {
  const userMember = group.membros.find((m) => m.userId === userId)
  return userMember?.cargo === "administrador"
}
