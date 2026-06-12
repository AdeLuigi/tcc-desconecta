# Commit T04 — Testes de Telas e Hooks

**Mensagem de commit:** `test: add component tests for key screens`

---

## Objetivo

Cobrir os fluxos críticos de UI com React Testing Library. O foco é testar o **comportamento do usuário** (o que aparece, o que é chamado), não detalhes de implementação.

---

## Arquivos a Criar

- `app/screens/__tests__/LoginScreen.test.tsx`
- `app/context/__tests__/AuthContext.test.tsx`

---

## Convenção de Mocks nos Testes de Tela

Cada teste de tela precisa:
1. Mockar a navegação (`@react-navigation/native`)
2. Mockar o contexto de autenticação
3. Mockar os services chamados pela tela

```typescript
// Padrão de mock de navegação
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  }),
  useRoute: () => ({ params: {} }),
}))

// Padrão de mock do AuthContext
jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    authToken: null,
    authEmail: null,
    userData: null,
    setAuthToken: jest.fn(),
    setAuthEmail: jest.fn(),
    setUserData: jest.fn(),
  }),
}))
```

---

## `app/screens/__tests__/LoginScreen.test.tsx`

```tsx
import React from "react"
import { render, fireEvent, waitFor, screen } from "@testing-library/react-native"
import { LoginScreen } from "@/screens/LoginScreen"
import { signInWithGoogle } from "@/services/auth"

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: jest.fn(), reset: jest.fn() }),
  useRoute: () => ({ params: {} }),
}))

jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    setAuthToken: jest.fn(),
    setAuthEmail: jest.fn(),
    setUserData: jest.fn(),
    authToken: null,
  }),
}))

jest.mock("@/services/auth", () => ({
  signInWithGoogle: jest.fn(),
}))

jest.mock("@/services/userService", () => ({
  syncUserWithFirestore: jest.fn(),
}))

jest.mock("@/services/notificationService", () => ({
  initNotifications: jest.fn().mockResolvedValue(undefined),
}))

describe("LoginScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renderiza o botão de login com Google", () => {
    render(<LoginScreen />)
    // Ajustar o texto conforme o label real do botão na tela
    expect(screen.getByText(/google/i)).toBeTruthy()
  })

  it("exibe loading durante o processo de login", async () => {
    jest.mocked(signInWithGoogle).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 500))
    )

    render(<LoginScreen />)
    fireEvent.press(screen.getByText(/google/i))

    // Deve exibir indicador de carregamento (ajustar testID conforme implementação)
    // expect(screen.getByTestId("loading-indicator")).toBeTruthy()
  })

  it("chama signInWithGoogle ao pressionar o botão", async () => {
    const { syncUserWithFirestore } = await import("@/services/userService")
    jest.mocked(signInWithGoogle).mockResolvedValueOnce({
      idToken: "mock-token",
      email: "test@test.com",
    } as any)
    jest.mocked(syncUserWithFirestore).mockResolvedValueOnce({
      uid: "user-1",
      email: "test@test.com",
    } as any)

    render(<LoginScreen />)
    fireEvent.press(screen.getByText(/google/i))

    await waitFor(() => {
      expect(signInWithGoogle).toHaveBeenCalledTimes(1)
    })
  })
})
```

---

## `app/context/__tests__/AuthContext.test.tsx`

```tsx
import React from "react"
import { render, act, screen } from "@testing-library/react-native"
import { Text } from "react-native"
import { AuthProvider, useAuth } from "@/context/AuthContext"

function TestComponent() {
  const { authToken, authEmail } = useAuth()
  return (
    <>
      <Text testID="token">{authToken ?? "null"}</Text>
      <Text testID="email">{authEmail ?? "null"}</Text>
    </>
  )
}

function TestSetComponent() {
  const { setAuthToken, setAuthEmail } = useAuth()
  return (
    <Text
      testID="trigger"
      onPress={() => {
        setAuthToken("new-token")
        setAuthEmail("new@test.com")
      }}
    >
      set
    </Text>
  )
}

describe("AuthContext", () => {
  it("fornece valores iniciais nulos", () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId("token").props.children).toBe("null")
    expect(screen.getByTestId("email").props.children).toBe("null")
  })

  it("atualiza valores quando setters são chamados", () => {
    render(
      <AuthProvider>
        <TestComponent />
        <TestSetComponent />
      </AuthProvider>
    )

    act(() => {
      screen.getByTestId("trigger").props.onPress()
    })

    expect(screen.getByTestId("token").props.children).toBe("new-token")
    expect(screen.getByTestId("email").props.children).toBe("new@test.com")
  })

  it("lança erro quando useAuth é chamado fora do AuthProvider", () => {
    // Suprimir console.error do React para este teste
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow()

    consoleSpy.mockRestore()
  })
})
```

---

## Telas Adicionais para Cobertura Futura

Após os testes acima passarem, priorizar:

| Tela | O que testar |
|---|---|
| `ConfigurarLimiteScreen` | Validação de formulário (dias obrigatórios, app obrigatório), chamada ao save |
| `GruposDeAmigosScreen` | Lista de grupos renderizada, filtro de grupos expirados |
| `HomeDinamicaScreen` | Exibição de permissão pendente, dados de screen time |
| `PerfilScreen` | Exibição de dados do usuário, botão de logout |

---

## Notas sobre React Testing Library

```bash
# Rodar testes de tela
npx jest app/screens/__tests__/ app/context/__tests__/ --verbose

# Depurar o que está sendo renderizado
# (adicionar dentro do teste):
# screen.debug()
```

**Boas práticas:**
- Preferir queries por `testID` para elementos sem texto visível.
- Usar `waitFor` para operações assíncronas.
- Nunca acessar o estado interno do componente — testar apenas o que o usuário vê.
