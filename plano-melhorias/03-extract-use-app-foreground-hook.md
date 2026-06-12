# Commit 03 — Extrair useAppForeground Hook

**Mensagem de commit:** `refactor: extract useAppForeground custom hook`

---

## Objetivo

O padrão de escutar `AppState` para recarregar dados ao voltar do background está duplicado em pelo menos `HomeDinamicaScreen.tsx` e `GruposDeAmigosScreen.tsx`. Extrair para um hook reutilizável elimina a duplicação e padroniza o comportamento.

---

## Arquivos Afetados

- **Criar:** `app/hooks/useAppForeground.ts`
- **Modificar:** `app/screens/HomeDinamicaScreen.tsx`
- **Modificar:** `app/screens/GruposDeAmigosScreen.tsx`
- **Verificar e modificar (se aplicável):** qualquer outra tela com padrão `AppState.addEventListener`

---

## Passos de Execução

### Passo 1 — Criar o arquivo do hook

Criar `app/hooks/useAppForeground.ts`:

```typescript
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
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        callback()
      }
      appState.current = nextAppState
    })

    return () => {
      subscription.remove()
    }
  }, [callback])
}
```

### Passo 2 — Refatorar HomeDinamicaScreen.tsx

Localizar o bloco `useEffect` que contém `AppState.addEventListener` e substituir pelo hook:

```typescript
// HomeDinamicaScreen.tsx — remover este bloco:
const appState = useRef(AppState.currentState)
useEffect(() => {
  const subscription = AppState.addEventListener('change', nextAppState => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      checkPermissionAndLoadData()
      loadUserGroups()
    }
    appState.current = nextAppState
  })
  return () => { subscription.remove() }
}, [userData])

// Substituir por:
import { useCallback } from "react"
import { useAppForeground } from "@/hooks/useAppForeground"

const handleForeground = useCallback(() => {
  checkPermissionAndLoadData()
  loadUserGroups()
}, [checkPermissionAndLoadData, loadUserGroups])

useAppForeground(handleForeground)
```

> **Atenção:** certificar que `checkPermissionAndLoadData` e `loadUserGroups` estão estabilizadas com `useCallback` antes de serem passadas para `handleForeground`. Caso contrário, o hook re-registrará o listener a cada render.

### Passo 3 — Refatorar GruposDeAmigosScreen.tsx

Aplicar o mesmo padrão:

```typescript
// GruposDeAmigosScreen.tsx
import { useCallback } from "react"
import { useAppForeground } from "@/hooks/useAppForeground"

const handleForeground = useCallback(() => {
  loadUserGroups()
}, [loadUserGroups])

useAppForeground(handleForeground)
```

### Passo 4 — Buscar outras telas com o mesmo padrão

```bash
grep -rn "AppState.addEventListener" app/screens/ --include="*.tsx"
```

Para cada ocorrência encontrada, aplicar a mesma refatoração.

---

## Verificação

```bash
# 1. Confirmar que não há mais AppState.addEventListener duplicados nas telas
grep -rn "AppState.addEventListener" app/screens/ --include="*.tsx"
# Esperado: sem resultados (ou apenas casos que não se encaixam no padrão)

# 2. Confirmar que o hook existe
ls app/hooks/useAppForeground.ts

# 3. Checar erros de TypeScript
npx tsc --noEmit
```

**Teste manual:**
1. Abrir o app na tela Home.
2. Enviar o app para background (botão Home do Android).
3. Aguardar 5 segundos e retornar ao app.
4. Confirmar que os dados são recarregados automaticamente.

---

## Resultado Esperado

- Um único arquivo `app/hooks/useAppForeground.ts` com a lógica de AppState.
- Telas sem boilerplate de `useRef(AppState.currentState)` + `addEventListener`.
- Comportamento idêntico ao anterior.
