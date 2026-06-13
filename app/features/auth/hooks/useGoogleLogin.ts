import { useState, useCallback } from "react"
import { signInWithGoogleUseCase } from "@/features/auth/useCases/signInWithGoogleUseCase"
import { useAuth } from "@/context/AuthContext"
import { isDomainError, isNetworkError } from "@/domain/errors"

export function useGoogleLogin() {
  const { setAuthToken, setAuthEmail, setUserData } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      await signInWithGoogleUseCase(setAuthToken, setAuthEmail, setUserData)
    } catch (e) {
      if (isDomainError(e) || isNetworkError(e)) {
        setError(e.message)
      } else if (e instanceof Error) {
        setError(e.message)
      } else {
        setError("Ocorreu um erro ao fazer login. Tente novamente.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [setAuthToken, setAuthEmail, setUserData])

  return { login, isLoading, error }
}
