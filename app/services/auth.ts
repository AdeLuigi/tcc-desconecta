import auth, { GoogleAuthProvider, getAuth, signInWithCredential } from "@react-native-firebase/auth"
import { GoogleSignin } from "@react-native-google-signin/google-signin"
import Constants from "expo-constants"

/**
 * Configura o Google Sign-In
 * Deve ser chamado antes de usar qualquer funcionalidade do Google Sign-In
 */
export function configureGoogleSignIn() {
  const webClientId = Constants.expoConfig?.extra?.googleWebClientId as string | undefined

  if (!webClientId) {
    throw new Error(
      "GOOGLE_WEB_CLIENT_ID não configurado. Verifique o arquivo .env e app.config.ts."
    )
  }

  GoogleSignin.configure({
    webClientId,
  })
}

/**
 * Faz login com Google usando Firebase Authentication
 * @returns Promise com os dados do usuário autenticado
 */
export async function signInWithGoogle() {
  try {
    // Check if your device supports Google Play
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })

    // Get the users ID token
    const signInResult = await GoogleSignin.signIn()
    
    // Tenta acessar o idToken de diferentes formas (versões diferentes da lib)
    const idToken = (signInResult as any).idToken || (signInResult as any).data?.idToken

    if (!idToken) {
      console.error("Estrutura do signInResult:", signInResult)
      throw new Error(
        "No ID token returned from Google Sign-In.\n" +
        "Verifique se o webClientId está configurado corretamente em app/services/auth.ts"
      )
    }

    // Create a Google credential with the token
    const googleCredential = GoogleAuthProvider.credential(idToken)

    // Sign-in the user with the credential
    const authInstance = getAuth()
    const userCredential = await signInWithCredential(authInstance, googleCredential)

    return {
      success: true,
      user: userCredential.user,
      idToken: idToken,
    }
  } catch (error: any) {
    console.error("Error signing in with Google:", error)
    return {
      success: false,
      error: error.message || "Erro ao fazer login com Google",
    }
  }
}

/**
 * Faz logout do Google e do Firebase
 */
export async function signOutGoogle() {
  try {
    await GoogleSignin.signOut()
    const authInstance = getAuth()
    await authInstance.signOut()
  } catch (error) {
    console.error("Error signing out:", error)
  }
}

/**
 * Verifica se o usuário está logado com Google
 */
export async function isSignedInWithGoogle() {
  const authInstance = getAuth()
  return authInstance.currentUser !== null
}
