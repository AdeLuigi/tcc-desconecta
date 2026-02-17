import messaging from '@react-native-firebase/messaging'
import { getFirestore, doc, updateDoc, getDoc, collection, getDocs, query, where } from '@react-native-firebase/firestore'
import { Platform, PermissionsAndroid, Alert } from 'react-native'

/**
 * Solicita permissão para notificações
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission()
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL

      return enabled
    } else if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        )
        return granted === PermissionsAndroid.RESULTS.GRANTED
      }
      return true // Android < 13 não precisa de permissão runtime
    }
    return false
  } catch (error) {
    console.error('Erro ao solicitar permissão de notificação:', error)
    return false
  }
}

/**
 * Obtém o token FCM do dispositivo
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermission()
    
    if (!hasPermission) {
      console.log('Permissão de notificação negada')
      return null
    }

    const token = await messaging().getToken()
    return token
  } catch (error) {
    console.error('Erro ao obter token FCM:', error)
    return null
  }
}

/**
 * Salva o token FCM do usuário no Firestore
 */
export async function saveFCMToken(userId: string, token: string): Promise<boolean> {
  try {
    const db = getFirestore()
    const userRef = doc(db, 'usuarios', userId)
    
    await updateDoc(userRef, {
      fcmToken: token,
    })
    
    return true
  } catch (error) {
    console.error('Erro ao salvar token FCM:', error)
    return false
  }
}

/**
 * Remove o token FCM do usuário ao fazer logout
 */
export async function removeFCMToken(userId: string): Promise<boolean> {
  try {
    const db = getFirestore()
    const userRef = doc(db, 'usuarios', userId)
    
    await updateDoc(userRef, {
      fcmToken: null,
    })
    
    return true
  } catch (error) {
    console.error('Erro ao remover token FCM:', error)
    return false
  }
}

/**
 * Inicializa o serviço de notificações para o usuário
 */
export async function initializeNotifications(userId: string): Promise<(() => void) | undefined> {
  try {
    // Solicitar permissão e obter token
    const token = await getFCMToken()
    
    if (token) {
      await saveFCMToken(userId, token)
    }

    // Listener para quando o token é atualizado
    const unsubscribe = messaging().onTokenRefresh(async (newToken) => {
      await saveFCMToken(userId, newToken)
    })

    return unsubscribe
  } catch (error) {
    console.error('Erro ao inicializar notificações:', error)
    return undefined
  }
}

/**
 * Envia notificação para todos os membros de um grupo (exceto o autor)
 */
export async function sendGroupNotification(
  groupId: string,
  authorUserId: string,
  authorName: string,
  message: string,
  groupName: string,
): Promise<void> {
  try {
    const db = getFirestore()
    
    // Buscar informações do grupo para obter a lista de membros
    const groupRef = doc(db, 'grupos', groupId)
    const groupDoc = await getDoc(groupRef)
    
    if (!groupDoc.exists()) {
      console.log('Grupo não encontrado')
      return
    }

    const groupData = groupDoc.data()
    const members = groupData?.membros || []

    // Filtrar membros (excluir o autor)
    const memberIds = members
      .filter((member: any) => member.userId !== authorUserId)
      .map((member: any) => member.userId)

    if (memberIds.length === 0) {
      console.log('Nenhum membro para notificar')
      return
    }

    // Buscar tokens FCM de todos os membros
    const tokensToNotify: string[] = []
    
    for (const memberId of memberIds) {
      const userRef = doc(db, 'usuarios', memberId)
      const userDoc = await getDoc(userRef)
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        const fcmToken = userData?.fcmToken
        
        // Verificar se as notificações estão habilitadas para o usuário
        const notificationsEnabled = userData?.configuracoes?.notificacoes !== false
        
        if (fcmToken && notificationsEnabled) {
          tokensToNotify.push(fcmToken)
        }
      }
    }

    if (tokensToNotify.length === 0) {
      console.log('Nenhum token válido encontrado')
      return
    }

    // Enviar notificações usando a API HTTP do FCM
    // Nota: Isso requer uma função do lado do servidor para funcionar corretamente
    // Por enquanto, vamos armazenar as notificações pendentes no Firestore
    await storeNotificationInFirestore({
      tokens: tokensToNotify,
      title: `Nova postagem em ${groupName}`,
      body: `${authorName}: ${message}`,
      data: {
        type: 'new_post',
        groupId,
        authorUserId,
      },
    })

  } catch (error) {
    console.error('Erro ao enviar notificação:', error)
  }
}

/**
 * Armazena notificação pendente no Firestore para ser processada por Cloud Function
 */
async function storeNotificationInFirestore(notification: {
  tokens: string[]
  title: string
  body: string
  data: any
}): Promise<void> {
  try {
    const db = getFirestore()
    const notificationsRef = collection(db, 'notificacoes_pendentes')
    
    await addDoc(notificationsRef, {
      ...notification,
      createdAt: new Date().toISOString(),
      processed: false,
    })
  } catch (error) {
    console.log('Erro ao armazenar notificação:', error)
  }
}

// Importação necessária para addDoc
import { addDoc } from '@react-native-firebase/firestore'

/**
 * Configura listeners para notificações em foreground
 */
export function setupNotificationListeners(): () => void {
  // Notificação recebida quando o app está em foreground
  const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
    console.log('Notificação recebida em foreground:', remoteMessage)
    
    // Exibir alerta local
    if (remoteMessage.notification) {
      Alert.alert(
        remoteMessage.notification.title || 'Nova notificação',
        remoteMessage.notification.body || ''
      )
    }
  })

  // Notificação clicada quando o app está em background
  const unsubscribeBackground = messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('Notificação abriu o app (background):', remoteMessage)
    // Aqui você pode navegar para a tela específica
  })

  // Verificar se o app foi aberto por uma notificação
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log('App aberto por notificação:', remoteMessage)
        // Navegar para a tela específica
      }
    })

  // Retornar função para cancelar todos os listeners
  return () => {
    unsubscribeForeground()
    unsubscribeBackground()
  }
}
