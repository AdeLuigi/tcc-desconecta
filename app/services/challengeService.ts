import { getFirestore, collection, addDoc, Timestamp, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "@react-native-firebase/firestore"
import storage from '@react-native-firebase/storage'

/**
 * Interface do desafio no Firestore
 */
export interface Challenge {
  id?: string
  nome: string
  descricao: string
  categoria: string
  duracao: number
  meta: number
  imagem: string
  dataInicio: Timestamp
  dataFinal: Timestamp
}

/**
 * Faz upload da imagem do desafio para o Firebase Storage
 */
export async function uploadChallengeImage(uri: string): Promise<string> {
  try {
    const filename = `desafios/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`
    const reference = storage().ref(filename)
    
    await reference.putFile(uri)
    const downloadURL = await reference.getDownloadURL()
    
    return downloadURL
  } catch (error) {
    console.error("Erro ao fazer upload da imagem do desafio:", error)
    throw error
  }
}

/**
 * Cria um novo desafio no Firestore
 */
export async function createChallenge(challenge: Omit<Challenge, "id">): Promise<string> {
  try {
    const db = getFirestore()
    const challengesRef = collection(db, "desafios")
    
    const docRef = await addDoc(challengesRef, {
      nome: challenge.nome,
      descricao: challenge.descricao,
      categoria: challenge.categoria,
      duracao: challenge.duracao,
      meta: challenge.meta,
      imagem: challenge.imagem,
      dataInicio: challenge.dataInicio,
      dataFinal: challenge.dataFinal,
    })
    
    return docRef.id
  } catch (error) {
    console.error("Erro ao criar desafio:", error)
    throw error
  }
}

/**
 * Interface para desafios ativos do usuário
 */
export interface UserActiveChallenge extends Challenge {
  progresso?: number
}

/**
 * Adiciona um desafio aos desafios ativos do usuário
 */
export async function joinChallenge(userId: string, challengeId: string): Promise<boolean> {
  try {
    const db = getFirestore()
    const userRef = doc(db, "usuarios", userId)
    const challengeRef = doc(db, "desafios", challengeId)
    
    // Buscar dados do desafio
    const challengeDoc = await getDoc(challengeRef)
    if (!challengeDoc.exists()) {
      throw new Error("Desafio não encontrado")
    }
    
    const challengeData = challengeDoc.data()
    if (!challengeData) {
      throw new Error("Dados do desafio não encontrados")
    }
    
    // Adicionar desafio ao array desafiosAtivos do usuário
    await updateDoc(userRef, {
      desafiosAtivos: arrayUnion({
        uuid: challengeId,
        imagem: challengeData.imagem,
        nome: challengeData.nome,
        progresso: 0,
      }),
    })
    
    return true
  } catch (error) {
    console.error("Erro ao inscrever no desafio:", error)
    throw error
  }
}

/**
 * Remove um desafio dos desafios ativos do usuário
 */
export async function leaveChallenge(userId: string, challengeId: string): Promise<boolean> {
  try {
    const db = getFirestore()
    const userRef = doc(db, "usuarios", userId)
    
    // Primeiro, buscar os dados do usuário para encontrar o objeto exato
    const userDoc = await getDoc(userRef)
    if (!userDoc.exists()) {
      throw new Error("Usuário não encontrado")
    }
    
    const userData = userDoc.data()
    if (!userData) {
      throw new Error("Dados do usuário não encontrados")
    }
    
    const desafiosAtivos = userData.desafiosAtivos || []
    
    // Encontrar o desafio específico no array
    const desafioToRemove = desafiosAtivos.find((d: any) => d.uuid === challengeId)
    
    if (desafioToRemove) {
      // Remover desafio do array
      await updateDoc(userRef, {
        desafiosAtivos: arrayRemove(desafioToRemove),
      })
      return true
    }
    
    return false
  } catch (error) {
    console.error("Erro ao sair do desafio:", error)
    throw error
  }
}

/**
 * Busca os desafios ativos do usuário com todos os dados completos
 */
export async function getUserActiveChallenges(userId: string): Promise<UserActiveChallenge[]> {
  try {
    const db = getFirestore()
    const userRef = doc(db, "usuarios", userId)
    
    // Buscar dados do usuário
    const userDoc = await getDoc(userRef)
    if (!userDoc.exists()) {
      return []
    }
    
    const userData = userDoc.data()
    if (!userData) {
      return []
    }
    
    const desafiosAtivos = userData.desafiosAtivos || []
    
    // Buscar dados completos de cada desafio
    const activeChallengesPromises = desafiosAtivos.map(async (desafio: any) => {
      const challengeRef = doc(db, "desafios", desafio.uuid)
      const challengeDoc = await getDoc(challengeRef)
      
      if (challengeDoc.exists()) {
        const challengeData = challengeDoc.data()
        if (!challengeData) {
          return null
        }
        
        return {
          id: desafio.uuid,
          nome: challengeData.nome,
          descricao: challengeData.descricao,
          categoria: challengeData.categoria,
          duracao: challengeData.duracao,
          meta: challengeData.meta,
          imagem: challengeData.imagem,
          dataInicio: challengeData.dataInicio,
          dataFinal: challengeData.dataFinal,
          progresso: desafio.progresso || 0,
        } as UserActiveChallenge
      }
      return null
    })
    
    const activeChallenges = await Promise.all(activeChallengesPromises)
    
    // Filtrar valores null (desafios que não existem mais)
    return activeChallenges.filter((challenge) => challenge !== null) as UserActiveChallenge[]
  } catch (error) {
    console.error("Erro ao buscar desafios ativos do usuário:", error)
    return []
  }
}
