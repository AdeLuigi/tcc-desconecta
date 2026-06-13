import { useEffect, useRef } from "react"
import { AppState, AppStateStatus } from "react-native"

/**
 * Chama `callback` sempre que o app volta para o foreground
 * (transição de inactive/background → active).
 *
 * O callback deve ser memorizado com useCallback para evitar
 * re-registros desnecessários do listener.
 */
export function useAppForeground(callback: () => void): void {
  const appState = useRef<AppStateStatus>(AppState.currentState)

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        callback()
      }
      appState.current = nextAppState
    })

    return () => {
      subscription.remove()
    }
  }, [callback])
}
