import messaging from "@react-native-firebase/messaging"
import { getFirestore, doc, updateDoc } from "@react-native-firebase/firestore"
import { Platform, PermissionsAndroid } from "react-native"
import type { INotificationService } from "@/ports/INotificationService"

export class FcmNotificationService implements INotificationService {
  private db = getFirestore()

  async requestPermission(): Promise<boolean> {
    if (Platform.OS === "ios") {
      const status = await messaging().requestPermission()
      return (
        status === messaging.AuthorizationStatus.AUTHORIZED ||
        status === messaging.AuthorizationStatus.PROVISIONAL
      )
    }
    if (Platform.OS === "android" && Platform.Version >= 33) {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      )
      return result === PermissionsAndroid.RESULTS.GRANTED
    }
    return true
  }

  async getToken(): Promise<string | null> {
    const hasPermission = await this.requestPermission()
    if (!hasPermission) return null
    return messaging().getToken()
  }

  async saveToken(userId: string, token: string): Promise<void> {
    await updateDoc(doc(this.db, "usuarios", userId), { fcmToken: token })
  }

  async sendGroupNotification(
    _groupId: string,
    _senderId: string,
    _message: string,
  ): Promise<void> {
    // Implementação via Cloud Functions (passo 10)
    throw new Error("sendGroupNotification deve ser feito via Cloud Functions")
  }
}
