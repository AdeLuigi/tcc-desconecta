import firestore from "@react-native-firebase/firestore"

export type TipoAtividade = 'desafio_completo' | 'atividade_alternativa' | 'meta_atingida' | 'progresso' | 'leitura'

export interface FeedPost {
  id: string
  dataCriacao: string
  descricao: string
  foto?: string
  nome: string
  tipoAtividade: TipoAtividade
  userId: string
}

export interface Comment {
  id: string
  dataCriacao: string
  nomeUsuario: string
  texto: string
  userId: string
}

/**
 * Busca todos os posts do feed de um grupo
 */
export async function getGroupFeed(groupId: string): Promise<FeedPost[]> {
  try {
    const feedSnapshot = await firestore()
      .collection("grupos")
      .doc(groupId)
      .collection("feed")
      .orderBy("dataCriacao", "desc")
      .get()

    const posts: FeedPost[] = []
    
    feedSnapshot.forEach((doc) => {
      const data = doc.data()
      posts.push({
        id: doc.id,
        dataCriacao: data.dataCriacao || "",
        descricao: data.descricao || "",
        foto: data.foto || "",
        nome: data.nome || "",
        tipoAtividade: data.tipoAtividade || "progresso",
        userId: data.userId || "",
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
): Promise<string | null> {
  try {
    const newPost = {
      dataCriacao: new Date().toISOString(),
      descricao,
      foto: foto || "",
      nome: userName,
      tipoAtividade,
      userId,
    }

    const docRef = await firestore()
      .collection("grupos")
      .doc(groupId)
      .collection("feed")
      .add(newPost)

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
    const commentsSnapshot = await firestore()
      .collection("grupos")
      .doc(groupId)
      .collection("feed")
      .doc(postId)
      .collection("comentarios")
      .orderBy("dataCriacao", "desc")
      .get()

    const comments: Comment[] = []
    
    commentsSnapshot.forEach((doc) => {
      const data = doc.data()
      comments.push({
        id: doc.id,
        dataCriacao: data.dataCriacao || "",
        nomeUsuario: data.nomeUsuario || "",
        texto: data.texto || "",
        userId: data.userId || "",
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
): Promise<string | null> {
  try {
    const newComment = {
      dataCriacao: new Date().toISOString(),
      nomeUsuario: userName,
      texto,
      userId,
    }

    const docRef = await firestore()
      .collection("grupos")
      .doc(groupId)
      .collection("feed")
      .doc(postId)
      .collection("comentarios")
      .add(newComment)

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
    // Primeiro deleta todos os comentários
    const commentsSnapshot = await firestore()
      .collection("grupos")
      .doc(groupId)
      .collection("feed")
      .doc(postId)
      .collection("comentarios")
      .get()

    const batch = firestore().batch()
    
    commentsSnapshot.forEach((doc) => {
      batch.delete(doc.ref)
    })

    await batch.commit()

    // Depois deleta o post
    await firestore()
      .collection("grupos")
      .doc(groupId)
      .collection("feed")
      .doc(postId)
      .delete()

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
    await firestore()
      .collection("grupos")
      .doc(groupId)
      .collection("feed")
      .doc(postId)
      .collection("comentarios")
      .doc(commentId)
      .delete()

    return true
  } catch (error) {
    console.error("Erro ao deletar comentário:", error)
    return false
  }
}
