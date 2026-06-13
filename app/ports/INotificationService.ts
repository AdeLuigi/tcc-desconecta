export interface INotificationService {
  requestPermission(): Promise<boolean>
  getToken(): Promise<string | null>
  saveToken(userId: string, token: string): Promise<void>
  sendGroupNotification(
    groupId: string,
    senderId: string,
    message: string,
  ): Promise<void>
}
