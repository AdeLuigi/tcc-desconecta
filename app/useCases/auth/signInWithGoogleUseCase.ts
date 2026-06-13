import { signInWithGoogle, configureGoogleSignIn } from "@/services/auth"
import { syncUserWithFirestore } from "@/services/userService"
import { initializeNotifications } from "@/services/notificationService"
import { NetworkError } from "@/domain/errors"
import type { UserData } from "@/services/userService"

export async function signInWithGoogleUseCase(
  setAuthToken: (token: string) => void,
  setAuthEmail: (email: string) => void,
  setUserData: (data: UserData) => void,
): Promise<UserData> {
  configureGoogleSignIn()

  const result = await signInWithGoogle()

  if (!result.success || !result.user) {
    throw new NetworkError(result.error ?? "Não foi possível fazer login com Google.")
  }

  if (result.user.email) {
    setAuthEmail(result.user.email)
  }
  setAuthToken(result.idToken ?? result.user.uid)

  const userData = await syncUserWithFirestore()

  if (!userData) {
    throw new NetworkError("Não foi possível sincronizar com o servidor. Tente novamente.")
  }

  setUserData(userData)

  // Notificações em background — não bloqueia nem falha o login
  initializeNotifications(userData.uid).catch(() => {
    // ignorado intencionalmente
  })

  return userData
}
