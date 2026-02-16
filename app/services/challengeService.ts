import { getFirestore, collection, addDoc, Timestamp } from "@react-native-firebase/firestore"
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
    
    console.log("Desafio criado com ID:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("Erro ao criar desafio:", error)
    throw error
  }
}
