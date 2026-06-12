# Commit 11 — Débitos Técnicos Pontuais

**Mensagem de commit:** `fix: resolve remaining technical debt items`

---

## Objetivo

Resolver os débitos técnicos menores identificados na análise arquitetural que não se encaixam nos commits anteriores: tela placeholder sem indicador visual, package name inconsistente no Android, lista de apps de sistema hardcoded e filtragem de grupos expirados duplicada.

---

## Itens Cobertos

| Débito | Seção | Arquivo |
|---|---|---|
| Tela placeholder sem indicador "em desenvolvimento" | 7.2 | `EstatisticasPessoaisScreen.tsx` |
| Package name Android inconsistente | 7.5 | Kotlin + build.gradle |
| Lista de exclusão de apps de sistema hardcoded | 7.6 | `ScreenTimeModule.kt` |
| Filtragem de grupos expirados duplicada | 7.7 | `GruposDeAmigosScreen.tsx` |

> **Nota:** os débitos 7.1 (credencial hardcoded), 7.3 (fetch total de grupos) e 7.4 (Math.random) foram cobertos nos commits 04, 02 e 08, respectivamente.

---

## Passos de Execução

---

### Débito 7.2 — EstatisticasPessoaisScreen: indicador "em desenvolvimento"

**Arquivo:** `app/screens/EstatisticasPessoaisScreen.tsx`

Adicionar um banner ou overlay visual para que o usuário saiba que a tela está em construção, em vez de exibir apenas texto de rascunho:

```typescript
// EstatisticasPessoaisScreen.tsx
import { View, StyleSheet } from "react-native"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"

export const EstatisticasPessoaisScreen = () => {
  return (
    <Screen preset="scroll" contentContainerStyle={$container}>
      <View style={$banner}>
        <Text style={$bannerText}>🚧 Em desenvolvimento</Text>
      </View>
      <Text preset="subheading" style={$title}>Estatísticas Pessoais</Text>
      <Text style={$description}>
        Esta tela exibirá gráficos detalhados de uso por app, categoria e período.
      </Text>
    </Screen>
  )
}

const $container = { padding: 24 }
const $banner = {
  backgroundColor: "#FFF3CD",
  borderRadius: 8,
  padding: 12,
  marginBottom: 16,
  borderLeftWidth: 4,
  borderLeftColor: "#FFC107",
}
const $bannerText = { color: "#856404", fontWeight: "600" as const }
const $title = { marginBottom: 8 }
const $description = { color: "#6c757d" }
```

---

### Débito 7.5 — Uniformizar package name Android

**Problema:** os arquivos Kotlin estão em `android/app/src/main/java/com/tccdesconecta/screentime/` mas o `package` declarado nos arquivos é `com.desconecta.screentime`.

**Verificar a discrepância:**

```bash
# Ver o package declarado nos arquivos Kotlin
grep -rn "^package " android/app/src/main/java/

# Ver o applicationId no build.gradle
grep "applicationId" android/app/build.gradle
```

**Opção A — Uniformizar para `com.tccdesconecta.screentime` (recomendado):**

1. Editar o `package` declarado em cada arquivo `.kt`:
   ```bash
   # Verificar todos os arquivos afetados
   find android/app/src/main/java -name "*.kt" | xargs grep -l "^package com.desconecta"
   ```
2. Para cada arquivo, alterar `package com.desconecta.screentime` → `package com.tccdesconecta.screentime`.
3. Atualizar `AndroidManifest.xml` se referenciar o package antigo.
4. Verificar `android/app/build.gradle`:
   ```gradle
   android {
     defaultConfig {
       applicationId "com.tccdesconecta.screentime"  // deve estar consistente
     }
   }
   ```

**Opção B — Uniformizar para `com.desconecta.screentime`:**

Mover os arquivos para `android/app/src/main/java/com/desconecta/screentime/` e atualizar o `applicationId`.

> Escolher a opção que já está no `applicationId` do `build.gradle` para evitar recompilar o APK com ID diferente (quebraria atualizações já instaladas).

---

### Débito 7.6 — Mover lista de exclusão de apps de sistema para arquivo de configuração

**Problema:** `ScreenTimeModule.kt` contém uma lista enorme de package names de apps de sistema de diferentes fabricantes hardcoded em Kotlin. Isso é conhecimento de domínio embutido em infraestrutura — para atualizar, é preciso recompilar o app.

**Solução:** mover para `app/data/excludedSystemPackages.json` e passar via bridge ao módulo nativo.

**Passo 1 — Criar `app/data/excludedSystemPackages.json`:**

```json
{
  "packages": [
    "com.android.systemui",
    "com.android.launcher",
    "com.android.launcher2",
    "com.android.launcher3",
    "com.sec.android.app.launcher",
    "com.miui.home",
    "com.motorola.launcher3",
    "com.lge.launcher3",
    "com.asus.launcher",
    "com.huawei.android.launcher",
    "com.google.android.apps.nexuslauncher",
    "com.android.settings",
    "com.android.phone",
    "com.android.dialer",
    "com.samsung.android.dialer",
    "com.android.incallui"
    // ... lista completa extraída do ScreenTimeModule.kt
  ]
}
```

**Passo 2 — Carregar no lado JS e passar ao módulo:**

```typescript
// screenTime.ts
import excludedPackages from "@/data/excludedSystemPackages.json"

// Ao inicializar o serviço ou ao chamar getTodayUsage():
await NativeModules.ScreenTimeModule.setExcludedPackages(excludedPackages.packages)
```

**Passo 3 — Adicionar método `setExcludedPackages` ao `ScreenTimeModule.kt`:**

```kotlin
// ScreenTimeModule.kt
private var excludedPackages: Set<String> = emptySet()

@ReactMethod
fun setExcludedPackages(packages: ReadableArray) {
    excludedPackages = (0 until packages.size()).map { packages.getString(it) ?: "" }.toSet()
}
```

E substituir a lista hardcoded pela variável `excludedPackages` nos filtros existentes.

---

### Débito 7.7 — Corrigir filtragem de grupos expirados no GruposDeAmigosScreen

**Problema:** `HomeDinamicaScreen.tsx` filtra grupos expirados, mas `GruposDeAmigosScreen.tsx` não — o usuário vê grupos expirados na tela de grupos.

> **Nota:** se o commit 08 (entidades ricas) foi aplicado, usar `Group.isExpired()`. Caso contrário, usar a lógica inline abaixo.

**Arquivo:** `app/screens/GruposDeAmigosScreen.tsx`

Localizar onde `setGroups(userGroups)` é chamado e adicionar o filtro:

```typescript
// GruposDeAmigosScreen.tsx — antes
setGroups(userGroups)

// GruposDeAmigosScreen.tsx — depois
const now = new Date()
const activeGroups = userGroups.filter(group => {
  if (!group.dataLimite) return true
  return new Date(group.dataLimite) > now
})
setGroups(activeGroups)
```

Se o commit 08 foi aplicado:
```typescript
import { Group } from "@/domain/Group"

const activeGroups = userGroups
  .map(g => Group.create(g))
  .filter(g => !g.isExpired())
  .map(g => g.toJSON())

setGroups(activeGroups)
```

---

## Verificação

```bash
# 7.2 — Iniciar app e navegar até Estatísticas Pessoais
# → deve exibir banner amarelo "Em desenvolvimento"

# 7.5 — Verificar consistência do package
grep -rn "^package " android/app/src/main/java/
grep "applicationId" android/app/build.gradle
# → ambos devem referenciar o mesmo package name

# 7.6 — Verificar que a lista não está mais hardcoded no Kotlin
grep -c "com.samsung.android" android/app/src/main/java/com/tccdesconecta/screentime/ScreenTimeModule.kt
# → deve retornar 0

# 7.7 — Testar com grupo expirado
# 1. Criar grupo com dataLimite no passado
# 2. Entrar na tela Grupos de Amigos
# → grupo expirado não deve aparecer na lista
```

---

## Resultado Esperado

- Tela de Estatísticas Pessoais comunica claramente ao usuário que está em desenvolvimento.
- Package name Android consistente entre pasta de fontes e `build.gradle`.
- Lista de exclusão de apps de sistema gerenciável via JSON sem recompilar o app.
- Filtragem de grupos expirados consistente em todas as telas.
