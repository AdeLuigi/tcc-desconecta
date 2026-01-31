import auth from "@react-native-firebase/auth"
import { GoogleSignin } from "@react-native-google-signin/google-signin"

/**
 * Configura o Google Sign-In
 * Deve ser chamado antes de usar qualquer funcionalidade do Google Sign-In
 */
export function configureGoogleSignIn() {
  // IMPORTANTE: Você precisa adicionar o Web Client ID do Firebase Console
  // Para obter: Firebase Console > Project Settings > General > Your apps > Web app
  // Ou em: Firebase Console > Authentication > Sign-in method > Google > Web SDK configuration
  const webClientId = "373913932164-hrh6hnuukr8ur6te4sn4k0kf9med8lvl.apps.googleusercontent.com" // Adicione seu Web Client ID aqui
  
  if (!webClientId) {
    console.warn(
      "⚠️ ATENÇÃO: Web Client ID não configurado!\n" +
      "Para o login com Google funcionar, você precisa:\n" +
      "1. Ir no Firebase Console\n" +
      "2. Acessar Project Settings > General\n" +
      "3. Copiar o Web Client ID (OAuth 2.0 client)\n" +
      "4. Colar no arquivo app/services/auth.ts\n"
    )
  }
  
  GoogleSignin.configure({
    webClientId: webClientId,
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
    
    console.log("Google Sign-In Result:", JSON.stringify(signInResult, null, 2))

    // Tenta acessar o idToken de diferentes formas (versões diferentes da lib)
    const idToken = signInResult.idToken || signInResult.data?.idToken

    if (!idToken) {
      console.error("Estrutura do signInResult:", signInResult)
      throw new Error(
        "No ID token returned from Google Sign-In.\n" +
        "Verifique se o webClientId está configurado corretamente em app/services/auth.ts"
      )
    }

    // Create a Google credential with the token
    const googleCredential = auth.GoogleAuthProvider.credential(idToken)

    // Sign-in the user with the credential
    const userCredential = await auth().signInWithCredential(googleCredential)

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
    await auth().signOut()
  } catch (error) {
    console.error("Error signing out:", error)
  }
}

/**
 * Verifica se o usuário está logado com Google
 */
export async function isSignedInWithGoogle() {
  return await GoogleSignin.isSignedIn()
}
