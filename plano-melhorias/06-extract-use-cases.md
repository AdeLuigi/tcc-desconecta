# Commit 06 — Extrair Use Cases das Telas

**Mensagem de commit:** `refactor: extract use cases from screens`

---

## Objetivo

`ConfigurarLimiteScreen.tsx` e `LoginScreen.tsx` concentram toda a orquestração de negócio diretamente na tela. Cada operação relevante deve ter seu próprio use case isolado — a tela apenas chama o use case e gerencia o estado de UI.

---

## Arquivos Afetados

- **Criar:** `app/useCases/limits/saveLimitConfigUseCase.ts`
- **Criar:** `app/useCases/limits/deleteLimitConfigUseCase.ts`
- **Criar:** `app/useCases/auth/signInWithGoogleUseCase.ts`
- **Criar:** `app/hooks/useGoogleLogin.ts`
- **Modificar:** `app/screens/ConfigurarLimiteScreen.tsx`
- **Modificar:** `app/screens/LoginScreen.tsx`

---

## Passos de Execução

### Passo 1 — Criar a pasta `app/useCases/`

```bash
mkdir -p app/useCases/limits
mkdir -p app/useCases/auth
```

### Passo 2 — Extrair `saveLimitConfigUseCase`

A lógica do `handleSave` de `ConfigurarLimiteScreen.tsx` faz:
1. Validação do formulário
2. Montagem do objeto `LimiteConfig`
3. Merge com a lista existente (edição vs. novo)
4. Chamada ao Firestore (`updateDoc`)
5. Chamada ao módulo nativo de bloqueio (`configureAppBlocking`)
6. Atualização local do contexto

Criar `app/useCases/limits/saveLimitConfigUseCase.ts`:

```typescript
import { updateUserData } from "@/services/userService"
import screenTimeService from "@/services/screenTime"
import { DomainError } from "@/domain/errors"
import type { UserData, LimiteConfig } from "@/services/userService"

export interface SaveLimitConfigInput {
  userId: string
  userData: UserData
  newConfig: LimiteConfig
  editingConfig: LimiteConfig | null
}

export async function saveLimitConfigUseCase(
  input: SaveLimitConfigInput,
  setUserData: (data: UserData) => void,
): Promise<void> {
  const { userId, userData, newConfig, editingConfig } = input

  // Validação
  if (!newConfig.nome.trim()) throw new DomainError("Nome do limite é obrigatório")
  if (newConfig.limiteMinutos < 2) throw new DomainError("Limite mínimo é 2 minutos")
  if (newConfig.diasAtivos.length === 0) throw new DomainError("Selecione ao menos 1 dia")
  if (newConfig.appsComLimite.length === 0) throw new DomainError("Selecione ao menos 1 app")

  // Merge com lista existente
  const existingLimites = userData.limites ?? []
  let updatedLimites: LimiteConfig[]

  if (editingConfig) {
    updatedLimites = existingLimites.map(l =>
      l.nome === editingConfig.nome ? newConfig : l
    )
  } else {
    updatedLimites = [...existingLimites, newConfig]
  }

  const updatedUserData: UserData = { ...userData, limites: updatedLimites }

  // Persistir no Firestore
  await updateUserData(userId, { limites: updatedLimites })

  // Sincronizar módulo nativo Android
  const appConfigs = buildAppBlockingConfigs(updatedLimites)
  await screenTimeService.configureAppBlocking(appConfigs, true)

  // Atualizar contexto local (sem re-fetch)
  setUserData(updatedUserData)
}

/** Constrói o mapa per-app usando o limite mais restritivo quando um app aparece em múltiplos LimiteConfig */
function buildAppBlockingConfigs(limites: LimiteConfig[]) {
  const map: Record<string, { limitMinutes: number; activeDays: string[] }> = {}

  for (const limite of limites) {
    if (!limite.appsComLimite) continue
    for (const pkg of limite.appsComLimite) {
      const existing = map[pkg]
      if (!existing || limite.limiteMinutos < existing.limitMinutes) {
        map[pkg] = {
          limitMinutes: limite.limiteMinutos,
          activeDays: limite.diasAtivos,
        }
      }
    }
  }

  return map
}
```

### Passo 3 — Extrair `deleteLimitConfigUseCase`

```typescript
// app/useCases/limits/deleteLimitConfigUseCase.ts
import { updateUserData } from "@/services/userService"
import screenTimeService from "@/services/screenTime"
import type { UserData, LimiteConfig } from "@/services/userService"

export async function deleteLimitConfigUseCase(
  userId: string,
  userData: UserData,
  configToDelete: LimiteConfig,
  setUserData: (data: UserData) => void,
): Promise<void> {
  const updatedLimites = (userData.limites ?? []).filter(
    l => l.nome !== configToDelete.nome
  )
  const updatedUserData: UserData = { ...userData, limites: updatedLimites }

  await updateUserData(userId, { limites: updatedLimites })

  // Desabilitar bloqueio para os apps que só estavam neste limite
  const remainingPkgs = new Set(updatedLimites.flatMap(l => l.appsComLimite ?? []))
  const removedPkgs = (configToDelete.appsComLimite ?? []).filter(
    pkg => !remainingPkgs.has(pkg)
  )
  if (removedPkgs.length > 0) {
    const disableMap = Object.fromEntries(
      removedPkgs.map(pkg => [pkg, { limitMinutes: 0, activeDays: [] }])
    )
    await screenTimeService.configureAppBlocking(disableMap, false)
  }

  setUserData(updatedUserData)
}
```

### Passo 4 — Refatorar `ConfigurarLimiteScreen.tsx`

```typescript
// ConfigurarLimiteScreen.tsx — handleSave simplificado
import { saveLimitConfigUseCase } from "@/useCases/limits/saveLimitConfigUseCase"
import { isDomainError } from "@/domain/errors"

const handleSave = async () => {
  setIsSaving(true)
  try {
    await saveLimitConfigUseCase(
      { userId, userData, newConfig: buildConfigFromForm(), editingConfig },
      setUserData,
    )
    navigation.goBack()
  } catch (error) {
    if (isDomainError(error)) {
      Alert.alert("Atenção", error.message)
    } else {
      console.error(error)
      Alert.alert("Erro", "Não foi possível salvar o limite.")
    }
  } finally {
    setIsSaving(false)
  }
}
```

### Passo 5 — Criar `signInWithGoogleUseCase`

```typescript
// app/useCases/auth/signInWithGoogleUseCase.ts
import { signInWithGoogle } from "@/services/auth"
import { syncUser } from "@/services/userService"
import { initNotifications } from "@/services/notificationService"
import type { UserData } from "@/services/userService"

export async function signInWithGoogleUseCase(
  setAuthToken: (token: string) => void,
  setAuthEmail: (email: string) => void,
  setUserData: (data: UserData) => void,
): Promise<void> {
  const { idToken, email } = await signInWithGoogle()
  setAuthToken(idToken)
  setAuthEmail(email)

  const userData = await syncUser(email)
  setUserData(userData)

  await initNotifications(userData.userId)
}
```

### Passo 6 — Criar `useGoogleLogin` hook

```typescript
// app/hooks/useGoogleLogin.ts
import { useState, useCallback } from "react"
import { signInWithGoogleUseCase } from "@/useCases/auth/signInWithGoogleUseCase"
import { useAuth } from "@/context/AuthContext"

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
      setError(e instanceof Error ? e.message : "Erro no login")
    } finally {
      setIsLoading(false)
    }
  }, [setAuthToken, setAuthEmail, setUserData])

  return { login, isLoading, error }
}
```

### Passo 7 — Refatorar `LoginScreen.tsx`

```typescript
// LoginScreen.tsx — antes: lógica inline de 6 operações
// Depois:
import { useGoogleLogin } from "@/hooks/useGoogleLogin"

export const LoginScreen = () => {
  const { login, isLoading, error } = useGoogleLogin()

  return (
    <Screen>
      {error && <Text style={$error}>{error}</Text>}
      <Button onPress={login} disabled={isLoading}>
        {isLoading ? "Entrando..." : "Entrar com Google"}
      </Button>
    </Screen>
  )
}
```

---

## Verificação

```bash
# 1. Confirmar que os use cases existem
ls app/useCases/limits/
ls app/useCases/auth/
ls app/hooks/useGoogleLogin.ts

# 2. Checar tipos
npx tsc --noEmit

# 3. Testar fluxo completo:
#    - Login com Google
#    - Criar novo limite
#    - Editar limite existente
#    - Deletar limite
```

---

## Resultado Esperado

- `ConfigurarLimiteScreen.tsx` e `LoginScreen.tsx` não contêm mais lógica de orquestração.
- Use cases são testáveis isoladamente (mockando os services injetados).
- A regra do "limite mais restritivo" vive no use case, não na tela.
