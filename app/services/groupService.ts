import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, arrayUnion, query, where } from "@react-native-firebase/firestore"
import { getUserData } from "./userService"

/**
 * Gera um código alfanumérico de 6 caracteres
 */
function generateGroupCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return code
}

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
 * Gera um código único para o grupo
 */
async function generateUniqueGroupCode(): Promise<string> {
  let code = generateGroupCode()
  let attempts = 0
  const maxAttempts = 10

  while (await groupCodeExists(code) && attempts < maxAttempts) {
    code = generateGroupCode()
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

export interface Group {
  id: string
  nome: string
  descricao: string
  foto: string
  criado_em: string
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
    const groupsRef = collection(db, "grupos")
    
    // Firestore tem limitações com array-contains em objetos,
    // então buscamos todos os grupos e filtramos manualmente
    const allGroupsSnapshot = await getDocs(groupsRef)
    
    const groups: Group[] = []
    
    allGroupsSnapshot.forEach((docSnap: any) => {
      const data = docSnap.data()
      const membros = data.membros || []
      
      // Verifica se o usuário está nos membros
      const isMember = membros.some((membro: GroupMember) => membro.userId === userId)
      
      if (isMember) {
        groups.push({
          id: docSnap.id,
          nome: data.nome || "",
          descricao: data.descricao || "",
          foto: data.foto || "",
          criado_em: data.criado_em || "",
          membros: data.membros || [],
          ranking_mensal: data.ranking_mensal || [],
          codigoGrupo: data.codigoGrupo || "",
        })
      }
    })

    return groups
  } catch (error) {
    console.error("Erro ao buscar grupos do usuário:", error)
    return []
  }
}

/**
 * Busca um grupo específico por ID
 */
export async function getGroupById(groupId: string): Promise<Group | null> {
  try {
    const db = getFirestore()
    const groupRef = doc(db, "grupos", groupId)
    const groupDoc = await getDoc(groupRef)

    if (groupDoc.exists()) {
      const data = groupDoc.data()
      return {
        id: groupDoc.id,
        nome: data?.nome || "",
        descricao: data?.descricao || "",
        foto: data?.foto || "",
        criado_em: data?.criado_em || "",
        membros: data?.membros || [],
        ranking_mensal: data?.ranking_mensal || [],
        codigoGrupo: data?.codigoGrupo || "",
      }
    }

    return null
  } catch (error) {
    console.error("Erro ao buscar grupo:", error)
    return null
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
): Promise<string | null> {
  try {
    // Buscar dados do usuário para obter o nome
    const userData = await getUserData(adminUserId)
    const userName = userData?.nome || "Admin"

    // Gerar código único para o grupo
    const codigoGrupo = await generateUniqueGroupCode()

    const newGroup = {
      nome,
      descricao,
      foto,
      criado_em: new Date().toISOString(),
      codigoGrupo,
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
  } catch (error) {
    console.error("Erro ao criar grupo:", error)
    return null
  }
}

/**
 * Adiciona um membro ao grupo
 */
export async function addMemberToGroup(
  groupId: string,
  userId: string,
): Promise<boolean> {
  try {
    const db = getFirestore()
    const groupRef = doc(db, "grupos", groupId)
    
    await updateDoc(groupRef, {
      membros: arrayUnion({
        userId,
        cargo: "membro",
      }),
      ranking_mensal: arrayUnion({
        userId: userId,
        pontos: 0,
      }),
    })

    return true
  } catch (error) {
    console.error("Erro ao adicionar membro:", error)
    return false
  }
}

/**
 * Remove um membro do grupo
 */
export async function removeMemberFromGroup(
  groupId: string,
  userId: string,
): Promise<boolean> {
  try {
    const group = await getGroupById(groupId)
    if (!group) return false

    const updatedMembros = group.membros.filter((m) => m.userId !== userId)
    const updatedRanking = group.ranking_mensal.filter((r) => r.userId !== userId)

    const db = getFirestore()
    const groupRef = doc(db, "grupos", groupId)
    await updateDoc(groupRef, {
      membros: updatedMembros,
      ranking_mensal: updatedRanking,
    })

    return true
  } catch (error) {
    console.error("Erro ao remover membro:", error)
    return false
  }
}

/**
 * Atualiza pontos de um usuário no ranking mensal
 */
export async function updateMemberPoints(
  groupId: string,
  userId: string,
  pontos: number,
): Promise<boolean> {
  try {
    const group = await getGroupById(groupId)
    if (!group) return false

    const updatedRanking = group.ranking_mensal.map((member) => {
      if (member.userId === userId) {
        return { ...member, pontos }
      }
      return member
    })

    const db = getFirestore()
    const groupRef = doc(db, "grupos", groupId)
    await updateDoc(groupRef, {
      ranking_mensal: updatedRanking,
    })

    return true
  } catch (error) {
    console.error("Erro ao atualizar pontos:", error)
    return false
  }
}

/**
 * Busca um grupo pelo código
 */
export async function getGroupByCode(code: string): Promise<Group | null> {
  try {
    const db = getFirestore()
    const groupsRef = collection(db, "grupos")
    const q = query(groupsRef, where("codigoGrupo", "==", code.toUpperCase()))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      return null
    }

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
  } catch (error) {
    console.error("Erro ao buscar grupo por código:", error)
    return null
  }
}

/**
 * Adiciona o usuário a um grupo usando o código
 */
export async function joinGroupByCode(
  code: string,
  userId: string,
): Promise<{ success: boolean; message: string; group?: Group }> {
  try {
    // Buscar grupo pelo código
    const group = await getGroupByCode(code)
    
    if (!group) {
      return {
        success: false,
        message: "Código inválido. Grupo não encontrado.",
      }
    }

    // Verificar se o usuário já é membro
    const isAlreadyMember = group.membros.some((m) => m.userId === userId)
    if (isAlreadyMember) {
      return {
        success: false,
        message: "Você já é membro deste grupo.",
        group,
      }
    }

    // Buscar dados do usuário
    const userData = await getUserData(userId)
    const userName = userData?.nome || "Usuário"

    // Adicionar usuário ao grupo
    const db = getFirestore()
    const groupRef = doc(db, "grupos", group.id)
    
    await updateDoc(groupRef, {
      membros: arrayUnion({
        userId,
        cargo: "membro",
        nome: userName,
      }),
      ranking_mensal: arrayUnion({
        userId,
        pontos: 0,
        nome: userName,
      }),
    })

    // Buscar grupo atualizado
    const updatedGroup = await getGroupById(group.id)

    return {
      success: true,
      message: `Você entrou no grupo "${group.nome}" com sucesso!`,
      group: updatedGroup || group,
    }
  } catch (error) {
    console.error("Erro ao entrar no grupo:", error)
    return {
      success: false,
      message: "Erro ao tentar entrar no grupo. Tente novamente.",
    }
  }
}

/**
 * Sair de um grupo (usuário remove a si mesmo)
 */
export async function leaveGroup(
  groupId: string,
  userId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const group = await getGroupById(groupId)
    if (!group) {
      return {
        success: false,
        message: "Grupo não encontrado.",
      }
    }

    // Verificar se é o último membro
    if (group.membros.length === 1) {
      // Se for o último membro, deletar o grupo
      const db = getFirestore()
      const groupRef = doc(db, "grupos", groupId)
      await deleteDoc(groupRef)
      
      return {
        success: true,
        message: "Você era o último membro. O grupo foi excluído.",
      }
    }

    // Verificar se é administrador
    const userMember = group.membros.find((m) => m.userId === userId)
    const isAdmin = userMember?.cargo === "administrador"

    // Se for admin, verificar se há outros admins
    if (isAdmin) {
      const adminCount = group.membros.filter((m) => m.cargo === "administrador").length
      if (adminCount === 1) {
        // É o único admin, não pode sair
        return {
          success: false,
          message: "Você é o único administrador. Promova outro membro antes de sair.",
        }
      }
    }

    // Remover usuário do grupo
    const success = await removeMemberFromGroup(groupId, userId)
    
    if (success) {
      return {
        success: true,
        message: "Você saiu do grupo com sucesso.",
      }
    } else {
      return {
        success: false,
        message: "Erro ao sair do grupo.",
      }
    }
  } catch (error) {
    console.error("Erro ao sair do grupo:", error)
    return {
      success: false,
      message: "Erro ao tentar sair do grupo.",
    }
  }
}

/**
 * Conceder cargo de administrador a um membro
 */
export async function grantAdminRole(
  groupId: string,
  userId: string,
  adminUserId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const group = await getGroupById(groupId)
    if (!group) {
      return {
        success: false,
        message: "Grupo não encontrado.",
      }
    }

    // Verificar se quem está concedendo é admin
    const adminMember = group.membros.find((m) => m.userId === adminUserId)
    if (!adminMember || adminMember.cargo !== "administrador") {
      return {
        success: false,
        message: "Você não tem permissão para conceder administrador.",
      }
    }

    // Verificar se o usuário alvo é membro
    const targetMember = group.membros.find((m) => m.userId === userId)
    if (!targetMember) {
      return {
        success: false,
        message: "Usuário não é membro do grupo.",
      }
    }

    // Verificar se já é admin
    if (targetMember.cargo === "administrador") {
      return {
        success: false,
        message: "Este usuário já é administrador.",
      }
    }

    // Atualizar cargo para administrador
    const updatedMembros = group.membros.map((m) => {
      if (m.userId === userId) {
        return { ...m, cargo: "administrador" as const }
      }
      return m
    })

    const db = getFirestore()
    const groupRef = doc(db, "grupos", groupId)
    await updateDoc(groupRef, {
      membros: updatedMembros,
    })

    return {
      success: true,
      message: `${targetMember.nome} agora é administrador.`,
    }
  } catch (error) {
    console.error("Erro ao conceder administrador:", error)
    return {
      success: false,
      message: "Erro ao conceder cargo de administrador.",
    }
  }
}

/**
 * Atualizar descrição do grupo (apenas admin)
 */
export async function updateGroupDescription(
  groupId: string,
  newDescription: string,
  userId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const group = await getGroupById(groupId)
    if (!group) {
      return {
        success: false,
        message: "Grupo não encontrado.",
      }
    }

    // Verificar se é admin
    const userMember = group.membros.find((m) => m.userId === userId)
    if (!userMember || userMember.cargo !== "administrador") {
      return {
        success: false,
        message: "Apenas administradores podem editar a descrição.",
      }
    }

    const db = getFirestore()
    const groupRef = doc(db, "grupos", groupId)
    await updateDoc(groupRef, {
      descricao: newDescription.trim(),
    })

    return {
      success: true,
      message: "Descrição atualizada com sucesso.",
    }
  } catch (error) {
    console.error("Erro ao atualizar descrição:", error)
    return {
      success: false,
      message: "Erro ao atualizar descrição do grupo.",
    }
  }
}

/**
 * Atualizar foto do grupo (apenas admin)
 */
export async function updateGroupPhoto(
  groupId: string,
  newPhotoURL: string,
  userId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const group = await getGroupById(groupId)
    if (!group) {
      return {
        success: false,
        message: "Grupo não encontrado.",
      }
    }

    // Verificar se é admin
    const userMember = group.membros.find((m) => m.userId === userId)
    if (!userMember || userMember.cargo !== "administrador") {
      return {
        success: false,
        message: "Apenas administradores podem editar a foto.",
      }
    }

    const db = getFirestore()
    const groupRef = doc(db, "grupos", groupId)
    await updateDoc(groupRef, {
      foto: newPhotoURL,
    })

    return {
      success: true,
      message: "Foto do grupo atualizada com sucesso.",
    }
  } catch (error) {
    console.error("Erro ao atualizar foto:", error)
    return {
      success: false,
      message: "Erro ao atualizar foto do grupo.",
    }
  }
}

/**
 * Verifica se um usuário é administrador do grupo
 */
export function isUserAdmin(group: Group, userId: string): boolean {
  const userMember = group.membros.find((m) => m.userId === userId)
  return userMember?.cargo === "administrador"
}
