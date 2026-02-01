import { createContext, FC, PropsWithChildren, useCallback, useContext, useMemo, useState } from "react"
import { useMMKVString } from "react-native-mmkv"
import type { UserData } from "@/services/userService"

export type AuthContextType = {
  isAuthenticated: boolean
  authToken?: string
  authEmail?: string
  userData?: UserData | null
  setAuthToken: (token?: string) => void
  setAuthEmail: (email: string) => void
  setUserData: (data: UserData | null) => void
  logout: () => void
  validationError: string
}

export const AuthContext = createContext<AuthContextType | null>(null)

export interface AuthProviderProps {}

export const AuthProvider: FC<PropsWithChildren<AuthProviderProps>> = ({ children }) => {
  const [authToken, setAuthToken] = useMMKVString("AuthProvider.authToken")
  const [authEmail, setAuthEmail] = useMMKVString("AuthProvider.authEmail")
  const [userData, setUserData] = useState<UserData | null>(null)

  const logout = useCallback(() => {
    setAuthToken(undefined)
    setAuthEmail("")
    setUserData(null)
  }, [setAuthEmail, setAuthToken])

  const validationError = useMemo(() => {
    if (!authEmail || authEmail.length === 0) return "can't be blank"
    if (authEmail.length < 6) return "must be at least 6 characters"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authEmail)) return "must be a valid email address"
    return ""
  }, [authEmail])

  const value = {
    isAuthenticated: !!authToken,
    authToken,
    authEmail,
    userData,
    setAuthToken,
    setAuthEmail,
    setUserData,
    logout,
    validationError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
