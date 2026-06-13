# Commit 04 — Mover Credenciais para Variáveis de Ambiente

**Mensagem de commit:** `fix(security): move Google Client ID to env`

---

## Objetivo

O `webClientId` do Google OAuth está hardcoded em `app/services/auth.ts`. Isso expõe o Client ID no repositório Git (mesmo que o repositório seja privado, é uma má prática). A solução é movê-lo para `app.config.ts` via variável de ambiente.

---

## Arquivos Afetados

- **Criar:** `.env` (e adicionar ao `.gitignore`)
- **Criar:** `.env.example` (template versionado)
- **Modificar:** `app.config.ts`
- **Modificar:** `app/services/auth.ts`

---

## Passos de Execução

### Passo 1 — Verificar se `expo-constants` já está instalado

```bash
grep "expo-constants" package.json
```

Se não estiver, instalar:
```bash
npx expo install expo-constants
```

### Passo 2 — Criar `.env`

Criar `.env` na raiz do projeto com o valor real:

```env
GOOGLE_WEB_CLIENT_ID=373913932164-hrh6hnuukr8ur6te4sn4k0kf9med8lvl.apps.googleusercontent.com
```

### Passo 3 — Criar `.env.example`

Criar `.env.example` na raiz (este arquivo **é** versionado, serve de documentação):

```env
# Google OAuth Web Client ID
# Obter em: console.cloud.google.com → Credenciais → OAuth 2.0 Client IDs
GOOGLE_WEB_CLIENT_ID=seu-client-id-aqui.apps.googleusercontent.com
```

### Passo 4 — Adicionar `.env` ao `.gitignore`

Verificar se `.env` já está no `.gitignore`:

```bash
grep "\.env" .gitignore
```

Se não estiver, adicionar:
```
# Variáveis de ambiente locais
.env
.env.local
```

### Passo 5 — Expor a variável no `app.config.ts`

```typescript
// app.config.ts
import { ExpoConfig, ConfigContext } from "expo/config"

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  extra: {
    ...config.extra,
    googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID,
  },
})
```

> Se `app.config.ts` ainda não usa a forma de função (com `ConfigContext`), converter de objeto estático para função que recebe `{ config }`.

### Passo 6 — Atualizar `app/services/auth.ts`

```typescript
// auth.ts — antes
const webClientId = "373913932164-hrh6hnuukr8ur6te4sn4k0kf9med8lvl.apps.googleusercontent.com"

// auth.ts — depois
import Constants from "expo-constants"

const webClientId = Constants.expoConfig?.extra?.googleWebClientId as string

if (!webClientId) {
  throw new Error(
    "GOOGLE_WEB_CLIENT_ID não configurado. Verifique o arquivo .env e app.config.ts."
  )
}
```

### Passo 7 — (Opcional) Adicionar tipos para `extra`

Para evitar `any` nos acessos a `Constants.expoConfig.extra`, criar `types/env.d.ts`:

```typescript
// types/env.d.ts
declare module "expo-constants" {
  interface ExpoConfig {
    extra?: {
      googleWebClientId?: string
    }
  }
}
```

---

## Verificação

```bash
# 1. Confirmar que o Client ID hardcoded não existe mais no código
grep -rn "373913932164" app/ --include="*.ts" --include="*.tsx"
# Esperado: sem resultados

# 2. Confirmar que .env não será commitado
git status
# .env deve aparecer como "untracked" e NÃO em "Changes to be committed"

# 3. Confirmar que app.config.ts lê a variável
node -e "require('dotenv').config(); console.log(process.env.GOOGLE_WEB_CLIENT_ID)"

# 4. Testar login com Google no app
npx expo start --android
```

---

## Resultado Esperado

- Nenhuma credencial hardcoded no repositório.
- `.env` listado no `.gitignore`.
- `.env.example` documentando as variáveis necessárias para novos desenvolvedores.
- Login com Google continua funcionando normalmente.
