import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, writeBatch } from "@react-native-firebase/firestore"
import { sendGroupNotification } from "./notificationService"

export type TipoAtividade = 'desafio_completo' | 'atividade_alternativa' | 'meta_atingida' | 'progresso' | 'leitura'

export interface FeedPost {
  id: string
  dataCriacao: string
  descricao: string
  foto?: string
  nome: string
  tipoAtividade: TipoAtividade
  userId: string
  photoURL?: string
}

export interface Comment {
  id: string
  dataCriacao: string
  nomeUsuario: string
  texto: string
  userId: string
  photoURL?: string
}

/**
 * Busca todos os posts do feed de um grupo
 */
export async function getGroupFeed(groupId: string): Promise<FeedPost[]> {
  try {
    const db = getFirestore()
    const feedRef = collection(db, "grupos", groupId, "feed")
    const feedQuery = query(feedRef, orderBy("dataCriacao", "desc"))
    const feedSnapshot = await getDocs(feedQuery)

    const posts: FeedPost[] = []
    
    feedSnapshot.forEach((docSnap: any) => {
      const data = docSnap.data()
      posts.push({
        id: docSnap.id,
        dataCriacao: data.dataCriacao || "",
        descricao: data.descricao || "",
        foto: data.foto || "",
        nome: data.nome || "",
        tipoAtividade: data.tipoAtividade || "progresso",
        userId: data.userId || "",
        photoURL: data.photoURL || "",
      })
    })

    return posts
  } catch (error) {
    console.error("Erro ao buscar feed do grupo:", error)
    return []
  }
}

/**
 * Cria um novo post no feed do grupo
 */
export async function createFeedPost(
  groupId: string,
  userId: string,
  userName: string,
  descricao: string,
  tipoAtividade: TipoAtividade,
  foto?: string,
  photoURL?: string,
): Promise<string | null> {
  try {
    const newPost = {
      dataCriacao: new Date().toISOString(),
      descricao,
      foto: foto || "",
      nome: userName,
      tipoAtividade,
      userId,
      photoURL: photoURL || "",
    }

    const db = getFirestore()
    const feedRef = collection(db, "grupos", groupId, "feed")
    const docRef = await addDoc(feedRef, newPost)

    // Buscar informações do grupo para enviar notificação
    try {
      const groupRef = doc(db, "grupos", groupId)
      const groupDoc = await getDoc(groupRef)
      
      if (groupDoc.exists()) {
        const groupData = groupDoc.data()
        const groupName = groupData?.nome || "seu grupo"
        
        // Enviar notificação para todos os membros do grupo
        await sendGroupNotification(
          groupId,
          userId,
          userName,
          descricao,
          groupName
        )
      }
    } catch (notificationError) {
      // Não falhar a criação do post se houver erro ao enviar notificação
      console.error("Erro ao enviar notificação:", notificationError)
    }

    return docRef.id
  } catch (error) {
    console.error("Erro ao criar post:", error)
    return null
  }
}

/**
 * Busca os comentários de um post
 */
export async function getPostComments(
  groupId: string,
  postId: string,
): Promise<Comment[]> {
  try {
    const db = getFirestore()
    const commentsRef = collection(db, "grupos", groupId, "feed", postId, "comentarios")
    const commentsQuery = query(commentsRef, orderBy("dataCriacao", "desc"))
    const commentsSnapshot = await getDocs(commentsQuery)

    const comments: Comment[] = []
    
    commentsSnapshot.forEach((docSnap: any) => {
      const data = docSnap.data()
      comments.push({
        id: docSnap.id,
        dataCriacao: data.dataCriacao || "",
        nomeUsuario: data.nomeUsuario || "",
        texto: data.texto || "",
        userId: data.userId || "",
        photoURL: data.photoURL || "",
      })
    })

    return comments
  } catch (error) {
    console.error("Erro ao buscar comentários:", error)
    return []
  }
}

/**
 * Adiciona um comentário a um post
 */
export async function addComment(
  groupId: string,
  postId: string,
  userId: string,
  userName: string,
  texto: string,
  photoURL?: string,
): Promise<string | null> {
  try {
    const newComment = {
      dataCriacao: new Date().toISOString(),
      nomeUsuario: userName,
      texto,
      userId,
      photoURL: photoURL || "",
    }

    const db = getFirestore()
    const commentsRef = collection(db, "grupos", groupId, "feed", postId, "comentarios")
    const docRef = await addDoc(commentsRef, newComment)

    return docRef.id
  } catch (error) {
    console.error("Erro ao adicionar comentário:", error)
    return null
  }
}

/**
 * Deleta um post do feed
 */
export async function deletePost(groupId: string, postId: string): Promise<boolean> {
  try {
    const db = getFirestore()
    
    // Primeiro deleta todos os comentários
    const commentsRef = collection(db, "grupos", groupId, "feed", postId, "comentarios")
    const commentsSnapshot = await getDocs(commentsRef)

    const batch = writeBatch(db)
    
    commentsSnapshot.forEach((docSnap: any) => {
      batch.delete(docSnap.ref)
    })

    await batch.commit()

    // Depois deleta o post
    const postRef = doc(db, "grupos", groupId, "feed", postId)
    await deleteDoc(postRef)

    return true
  } catch (error) {
    console.error("Erro ao deletar post:", error)
    return false
  }
}

/**
 * Deleta um comentário
 */
export async function deleteComment(
  groupId: string,
  postId: string,
  commentId: string,
): Promise<boolean> {
  try {
    const db = getFirestore()
    const commentRef = doc(db, "grupos", groupId, "feed", postId, "comentarios", commentId)
    await deleteDoc(commentRef)

    return true
  } catch (error) {
    console.error("Erro ao deletar comentário:", error)
    return false
  }
}
