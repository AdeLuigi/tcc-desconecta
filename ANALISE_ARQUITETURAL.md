# Análise Arquitetural — Desconecta

> Análise baseada na inspeção do código-fonte. As recomendações são classificadas por impacto e custo de implementação.

---

## Sumário

1. [Arquitetura Macro](#1-arquitetura-macro)
2. [Clean Architecture](#2-clean-architecture)
3. [Hexagonal Architecture (Ports/Adapters)](#3-hexagonal-architecture-portsadapters)
4. [Domain-Driven Design (DDD)](#4-domain-driven-design-ddd)
5. [Microsserviços / Separação de Responsabilidades](#5-microsserviços--separação-de-responsabilidades)
6. [Padrões de Projeto (Patterns)](#6-padrões-de-projeto-patterns)
7. [Débitos Técnicos Pontuais](#7-débitos-técnicos-pontuais)

---

## 1. Arquitetura Macro

### Estado atual
A estrutura de pastas é plana e organizada por tipo de artefato:

```
app/
  screens/   ← 38 telas no mesmo nível
  services/  ← 8 serviços no mesmo nível
  context/   ← 2 contextos (1 é boilerplate)
  components/
  navigators/
```

Não há agrupamento por **feature/domínio**. À medida que o projeto cresce, fica difícil entender quais arquivos se relacionam entre si.

### Melhorias sugeridas

#### 1.1 — Estrutura por feature (vertical slicing)

Agrupar tudo que pertence a um domínio junto:

```
app/
  features/
    auth/
      screens/         (Login, Cadastro, Onboarding)
      services/        (auth.ts, userService.ts)
      context/         (AuthContext.tsx)
      hooks/
    screen-time/
      screens/         (EstatisticasPessoais, EstatisticaPessoalResumida)
      services/        (screenTime.ts, statisticsService.ts)
      hooks/
    grupos/
      screens/         (GruposDeAmigos, PaginaDoGrupo, ...)
      services/        (groupService.ts, feedService.ts)
    desafios/
      screens/         (Desafios*, SelecionarApps*)
      services/        (challengeService.ts)
    configuracoes/
      screens/         (Perfil, ConfigurarLimite, LimiteApps, ...)
      services/        (notificationService.ts)
  shared/
    components/
    navigators/
    theme/
    utils/
```

**Benefício:** cada feature é autossuficiente. Mudanças ficam localizadas.

#### 1.2 — Remover artefatos do boilerplate Ignite que não são usados

Os itens abaixo são remanescentes do template e não fazem parte do produto:

| Artefato | Tipo | Ação |
|---|---|---|
| `EpisodeContext.tsx` | Context | Remover |
| `DemoCommunityScreen`, `DemoDebugScreen`, `DemoPodcastListScreen`, `DemoShowroomScreen/` | Screens | Remover |
| `DemoNavigator.tsx` | Navigator | Remover |
| Rota `Demo` em `AppNavigator` | Navegação | Remover |
| `i18n/demo-*.ts` | Traduções | Remover |

---

## 2. Clean Architecture

### Estado atual
As **screens** importam diretamente serviços de infraestrutura (Firebase, Storage, módulo nativo) e executam orquestração de negócio inline.

**Exemplo — `PerfilScreen.tsx`:**
```typescript
// Numa mesma tela:
import { updateUserData, getUserData } from "@/services/userService"     // Firestore
import statisticsService from "@/services/statisticsService"             // Firestore
import screenTimeService from "@/services/screenTime"                    // Módulo nativo
import storage from "@react-native-firebase/storage"                     // Firebase Storage
import auth from "@react-native-firebase/auth"                           // Firebase Auth
```

Não existe uma camada intermediária (use cases / application layer). A lógica de negócio vive misturada com a camada de apresentação.

### Melhorias sugeridas

#### 2.1 — Criar camada de Use Cases

Cada operação de negócio relevante deve ter seu próprio caso de uso isolado:

```
app/
  useCases/
    auth/
      signInWithGoogleUseCase.ts
      syncUserUseCase.ts
      logoutUseCase.ts
    limits/
      saveLimitConfigUseCase.ts   ← lógica hoje em ConfigurarLimiteScreen.handleSave()
      deleteLimitConfigUseCase.ts
    groups/
      joinGroupUseCase.ts
      createGroupUseCase.ts
    screenTime/
      syncHistoricalDataUseCase.ts
```

**Exemplo de refatoração:**

O `handleSave` de `ConfigurarLimiteScreen.tsx` hoje faz:
1. Validação do formulário
2. Montagem do objeto `LimiteConfig`
3. Merging com a lista existente (incluindo edição vs. novo)
4. Chamada ao Firestore
5. Chamada ao módulo nativo de bloqueio
6. Atualização local do contexto

Isso é um use case completo. Deve sair da tela.

```typescript
// useCases/limits/saveLimitConfigUseCase.ts
export async function saveLimitConfigUseCase(
  userId: string,
  userData: UserData,
  newConfig: LimiteConfig,
  editingConfig: LimiteConfig | null,
  setUserData: (data: UserData) => void,
): Promise<void> {
  // toda a lógica de orquestração aqui
}
```

A tela então só chama `await saveLimitConfigUseCase(...)`.

#### 2.2 — Telas só devem gerenciar UI

A regra: **screens são "burras"**. Elas renderizam estado, delegam eventos a hooks/use cases e navegam.

Fluxo de login em `LoginScreen.tsx` hoje faz 6 operações distintas (GoogleSignIn, syncFirestore, initNotifications, setToken, setEmail, setUserData). Deve virar um hook:

```typescript
// hooks/useGoogleLogin.ts
export function useGoogleLogin() {
  const { setAuthToken, setAuthEmail, setUserData } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const login = async () => {
    setIsLoading(true)
    try {
      await signInWithGoogleUseCase(setAuthToken, setAuthEmail, setUserData)
    } finally {
      setIsLoading(false)
    }
  }

  return { login, isLoading }
}
```

#### 2.3 — `AuthContext` não deve ter lógica de validação

`validationError` com regex de email no contexto de autenticação é regra de negócio, não estado global. Deve viver em um validador de domínio ou no formulário de login.

---

## 3. Hexagonal Architecture (Ports/Adapters)

### Estado atual
O código depende **diretamente** dos SDKs externos em toda a aplicação. Não existe abstração.

```typescript
// Padrão atual em todos os services:
import { getFirestore, collection, ... } from "@react-native-firebase/firestore"

// Dentro da função:
const db = getFirestore()
const q = query(collection(db, "grupos"), ...)
```

Isso significa que:
- **Testar** qualquer service requer mockar o SDK inteiro do Firebase
- **Trocar** o Firestore por outro banco (ex: SQLite offline, Supabase) exige alterar dezenas de arquivos
- **`ScreenTimeModule`** (nativo Android) é chamado diretamente em `screenTime.ts` sem interface

### Melhorias sugeridas

#### 3.1 — Definir Ports (interfaces/contratos)

```typescript
// ports/IUserRepository.ts
export interface IUserRepository {
  findById(userId: string): Promise<UserData | null>
  save(userData: UserData): Promise<void>
  update(userId: string, partial: Partial<UserData>): Promise<void>
}

// ports/IGroupRepository.ts
export interface IGroupRepository {
  findByMember(userId: string): Promise<Group[]>
  findByCode(code: string): Promise<Group | null>
  save(group: Group): Promise<string>
  addMember(groupId: string, member: GroupMember): Promise<void>
}

// ports/IScreenTimeGateway.ts
export interface IScreenTimeGateway {
  hasPermission(): Promise<boolean>
  requestPermission(): void
  getTodayUsage(): Promise<AppUsage[]>
  configureBlocking(configs: Record<string, AppBlockingConfig>, enable: boolean): Promise<void>
}
```

#### 3.2 — Criar Adapters (implementações)

```typescript
// adapters/FirestoreUserRepository.ts
export class FirestoreUserRepository implements IUserRepository {
  async findById(userId: string): Promise<UserData | null> {
    const db = getFirestore()
    const snap = await getDoc(doc(db, "usuarios", userId))
    return snap.exists() ? snap.data() as UserData : null
  }
  // ...
}

// adapters/NativeScreenTimeGateway.ts
export class NativeScreenTimeGateway implements IScreenTimeGateway {
  async hasPermission(): Promise<boolean> {
    return NativeModules.ScreenTimeModule.hasUsageStatsPermission()
  }
  // ...
}
```

#### 3.3 — Use Cases dependem dos Ports, não dos Adapters

```typescript
// useCases/groups/joinGroupUseCase.ts
export function makeJoinGroupUseCase(repo: IGroupRepository, userRepo: IUserRepository) {
  return async (userId: string, groupCode: string) => {
    const group = await repo.findByCode(groupCode)
    if (!group) throw new Error("Grupo não encontrado")
    // lógica de negócio pura, sem Firebase
    await repo.addMember(group.id, { userId, cargo: "membro", nome: "..." })
  }
}
```

Isso torna os use cases **100% testáveis** com mocks simples.

---

## 4. Domain-Driven Design (DDD)

### Estado atual
As entidades do domínio são interfaces TypeScript puras — sacos de dados sem comportamento.

```typescript
// userService.ts — entidade anêmica
export interface LimiteConfig {
  nome: string
  emoji: string
  appsComLimite: string[]
  sitesComLimite: string[]
  limiteMinutos: number
  diasAtivos: string[]
  // ← zero comportamento, zero validação
}
```

Regras de negócio estão espalhadas em telas e services:
- "Pelo menos 1 dia ativo" → `ConfigurarLimiteScreen.tsx`
- "Máximo 10 tentativas para código de grupo" → `groupService.ts`
- "Usar limite mais restritivo quando app aparece em múltiplos grupos" → `ConfigurarLimiteScreen.tsx`

### Melhorias sugeridas

#### 4.1 — Entidades com comportamento (Rich Domain Entities)

```typescript
// domain/LimiteConfig.ts
export class LimiteConfig {
  private constructor(
    readonly nome: string,
    readonly emoji: string,
    readonly appsComLimite: string[],
    readonly limiteMinutos: number,
    readonly diasAtivos: DiaAtivo[],
  ) {}

  static create(data: LimiteConfigInput): LimiteConfig {
    if (!data.nome.trim()) throw new DomainError("Nome do limite é obrigatório")
    if (data.limiteMinutos < 2) throw new DomainError("Limite mínimo é 2 minutos")
    if (data.diasAtivos.length === 0) throw new DomainError("Selecione ao menos 1 dia")
    if (data.appsComLimite.length === 0) throw new DomainError("Selecione ao menos 1 app")
    return new LimiteConfig(...)
  }

  isActiveToday(): boolean {
    const today = new Date().getDay()
    return this.diasAtivos.includes(diasDaSemana[today])
  }

  isMoreRestrictiveThan(other: LimiteConfig): boolean {
    return this.limiteMinutos < other.limiteMinutos
  }
}
```

#### 4.2 — Value Objects para tipos primitivos críticos

```typescript
// domain/PackageName.ts
export class PackageName {
  private constructor(readonly value: string) {}
  static of(raw: string): PackageName {
    if (!raw.includes('.')) throw new DomainError("Package name inválido")
    return new PackageName(raw)
  }
}

// domain/GroupCode.ts
export class GroupCode {
  static readonly LENGTH = 6
  private constructor(readonly value: string) {}
  static generate(): GroupCode {
    // lógica de geração aqui, dentro do domínio
    return new GroupCode(crypto.randomUUID().replace(/-/g, '').toUpperCase().slice(0, 6))
  }
}
```

#### 4.3 — Agregados bem delimitados

**`Group`** é um agregado. `GroupMember` e `RankingMember` vivem dentro dele:

```typescript
// domain/Group.ts
export class Group {
  private _membros: GroupMember[] = []

  addMember(member: GroupMember): void {
    if (this._membros.some(m => m.userId === member.userId)) {
      throw new DomainError("Usuário já é membro do grupo")
    }
    this._membros.push(member)
  }

  removeMember(userId: string): void {
    if (this.isAdmin(userId) && this._membros.length === 1) {
      throw new DomainError("Não é possível remover o único administrador")
    }
    this._membros = this._membros.filter(m => m.userId !== userId)
  }

  isAdmin(userId: string): boolean {
    return this._membros.some(m => m.userId === userId && m.cargo === "administrador")
  }
}
```

#### 4.4 — Remover duplicação de tipos entre camadas

`navigationTypes.ts` define inline os tipos de `GroupMember` e da estrutura de ranking que já existem em `groupService.ts`. Isso cria drift de tipos com o tempo.

```typescript
// navigationTypes.ts — antes (duplicado)
DetalhesDoGrupo: {
  grupo: {
    membros: Array<{ userId: string; cargo: "administrador" | "membro"; nome: string }>
    // ...
  }
}

// navigationTypes.ts — depois (reutilizando o tipo do domínio)
import type { Group } from "@/domain/Group"
DetalhesDoGrupo: { grupo: Group }
```

---

## 5. Microsserviços / Separação de Responsabilidades

### Estado atual
O app é um monólito mobile, o que é **adequado** para React Native. Contudo, há mistura de responsabilidades dentro dos "serviços":

| Service | Responsabilidades misturadas |
|---|---|
| `screenTime.ts` | Permissões + Leitura de dados + Persistência no Firestore + Bloqueio nativo |
| `feedService.ts` | CRUD do feed + Disparo de notificação push |
| `notificationService.ts` | Permissão + Token FCM + Persistência + Listeners |
| `challengeService.ts` | Upload de imagem (Storage) + CRUD de desafios + Participação do usuário |

### Melhorias sugeridas

#### 5.1 — Separar responsabilidades por camada, não por domínio

Dentro de cada feature, criar subcamadas:

```
features/screen-time/
  repository/         ← só acessa Firestore (lê/escreve)
  gateway/            ← só fala com o módulo nativo
  useCases/           ← orquestra repository + gateway
```

```
features/grupos/
  repository/         ← CRUD de grupos no Firestore
  notifications/      ← envio de notificação (chamado pelo use case, não pelo repository)
  useCases/           ← joinGroup, createGroup, leaveGroup
```

**Regra:** repository nunca chama notification. O use case chama ambos.

```typescript
// useCases/grupos/createFeedPostUseCase.ts
export async function createFeedPostUseCase(
  feedRepo: IFeedRepository,
  notificationService: INotificationService,
  groupRepo: IGroupRepository,
  input: CreateFeedPostInput,
) {
  const postId = await feedRepo.create(input.groupId, input)
  const group = await groupRepo.findById(input.groupId)
  await notificationService.sendGroupNotification(group, input.userId, input.descricao)
  return postId
}
```

#### 5.2 — Firebase Functions como boundary de backend

O diretório `functions/` existe mas parece subutilizado. Operações que envolvem múltiplos documentos (ranking, streak, pontuação de desafios) deveriam ser **Cloud Functions** por questão de consistência e segurança:

- Atualizar `ranking_mensal` ao registrar uma atividade
- Calcular streak diário
- Validar se o usuário tem direito a um prêmio
- Enviar notificações push server-side (sem expor tokens no cliente)

---

## 6. Padrões de Projeto (Patterns)

### 6.1 — Repository Pattern (ausente)

Toda query Firestore é construída inline dentro do service. Não existe repositório.

**Antes:**
```typescript
// groupService.ts
const db = getFirestore()
const groupsRef = collection(db, "grupos")
const allGroupsSnapshot = await getDocs(groupsRef)
// filtragem manual de todos os grupos no cliente (!)
```

**Depois:**
```typescript
// adapters/FirestoreGroupRepository.ts
async findByMember(userId: string): Promise<Group[]> {
  // Idealmente com um índice Firestore composto para evitar fetch total
  const snap = await getDocs(
    query(collection(db, "grupos"), where("membrosIds", "array-contains", userId))
  )
  return snap.docs.map(this.toDomain)
}
```

> **Nota de performance:** `getUserGroups()` atualmente busca **todos** os grupos da coleção e filtra no cliente. Isso escala mal. O Firestore suporta `array-contains` em arrays simples — adicionar um campo `membrosIds: string[]` ao documento de grupo resolve isso.

### 6.2 — Custom Hooks (duplicação de lógica)

O padrão de escutar `AppState` para recarregar dados ao voltar do background está duplicado em pelo menos 2 telas:

```typescript
// HomeDinamicaScreen.tsx — duplicado em GruposDeAmigosScreen.tsx
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
```

**Extrair para hook:**
```typescript
// hooks/useAppForeground.ts
export function useAppForeground(callback: () => void) {
  const appState = useRef(AppState.currentState)
  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        callback()
      }
      appState.current = next
    })
    return () => sub.remove()
  }, [callback])
}

// Uso nas telas:
useAppForeground(useCallback(() => {
  loadUserGroups()
  checkPermissionAndLoadData()
}, []))
```

### 6.3 — useAsync / Loading State Pattern

Cada tela gerencia manualmente `isLoading`, `isSaving`, erro, try/catch. Isso é boilerplate repetitivo:

```typescript
// hooks/useAsync.ts
export function useAsync<T>(fn: () => Promise<T>, deps: any[]) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: Error | null }>({
    data: null, loading: true, error: null,
  })

  useEffect(() => {
    setState(s => ({ ...s, loading: true }))
    fn()
      .then(data => setState({ data, loading: false, error: null }))
      .catch(error => setState({ data: null, loading: false, error }))
  }, deps)

  return state
}
```

### 6.4 — Error Handling inconsistente

Existem pelo menos 3 estratégias de tratamento de erro sendo usadas simultaneamente:

| Estratégia | Onde aparece |
|---|---|
| `console.error` + `throw error` | `challengeService`, `groupService` |
| `console.error` + `return null` | `userService`, `notificationService` |
| `console.error` + `return false` | vários |
| `Alert.alert` direto no service | nenhum (bem) |

**Recomendação:** definir um padrão único. Sugere-se que services lancem exceções tipadas e os use cases/hooks decidam como apresentar o erro ao usuário:

```typescript
// domain/errors.ts
export class DomainError extends Error { constructor(msg: string) { super(msg); this.name = 'DomainError' } }
export class NotFoundError extends DomainError {}
export class PermissionError extends DomainError {}
export class NetworkError extends Error { constructor(msg: string) { super(msg); this.name = 'NetworkError' } }
```

### 6.5 — Strategy Pattern para categorização de apps

`getAppCategory()` em `appCategories.ts` usa uma lista estática JSON. Se a lógica de categorização crescer (ex: usar ML, categoria do sistema Android, categoria do Play Store), uma Strategy facilitaria a extensão:

```typescript
// ports/IAppCategoryStrategy.ts
export interface IAppCategoryStrategy {
  classify(packageName: string, nativeCategory?: string): AppCategory
}

// adapters/CompositeAppCategoryStrategy.ts
export class CompositeAppCategoryStrategy implements IAppCategoryStrategy {
  constructor(private strategies: IAppCategoryStrategy[]) {}
  classify(pkg: string, native?: string): AppCategory {
    for (const s of this.strategies) {
      const result = s.classify(pkg, native)
      if (result !== 'other') return result
    }
    return 'other'
  }
}
```

---

## 7. Débitos Técnicos Pontuais

### 7.1 — Credencial hardcoded

```typescript
// auth.ts — linha 12
const webClientId = "373913932164-hrh6hnuukr8ur6te4sn4k0kf9med8lvl.apps.googleusercontent.com"
```

Isso vaza o Client ID no repositório. Mover para `app.config.ts` via variável de ambiente:

```typescript
// app.config.ts
extra: {
  googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID,
}

// auth.ts
import Constants from "expo-constants"
const webClientId = Constants.expoConfig?.extra?.googleWebClientId
```

### 7.2 — Tela sem implementação registrada no navigator

`EstatisticasPessoaisScreen.tsx` é uma tela placeholder com apenas bullets de texto. Está registrada no navigator e pode ser acessada. Deve ter um indicador visual de "em desenvolvimento" ou ser removida até estar pronta.

### 7.3 — `getUserGroups` com fetch total

```typescript
// groupService.ts
const allGroupsSnapshot = await getDocs(groupsRef) // busca TODOS os grupos
// filtra manualmente no cliente
```

À medida que a base de grupos cresce, isso se torna proibitivo. Adicionar campo `membrosIds: string[]` ao documento de grupo e usar `array-contains`.

### 7.4 — `generateGroupCode` usando `Math.random()`

`Math.random()` não é criptograficamente seguro. Para um código que identifica unicamente um grupo e pode ser compartilhado, usar `crypto.getRandomValues()` (disponível no React Native via `react-native-get-random-values`).

### 7.5 — Pacote Android `com.desconecta.screentime` vs `com.tccdesconecta.screentime`

Os arquivos Kotlin estão em `android/app/src/main/java/com/tccdesconecta/screentime/` mas o `package` declarado é `com.desconecta.screentime`. Isso pode causar confusão e deve ser uniformizado.

### 7.6 — Lista de exclusão de apps no `ScreenTimeModule.kt`

O `ScreenTimeModule.kt` contém uma lista enorme de package names hardcoded de apps de sistema de diferentes fabricantes (Samsung, Motorola, Xiaomi, LG, ASUS). Isso é **conhecimento de domínio** embutido em código de infraestrutura.

Sugestão: mover para um arquivo de configuração separado (`excluded_system_packages.json`) ou para o lado JavaScript onde pode ser atualizado sem recompilar o app.

### 7.7 — Lógica de filtragem de grupos expirados duplicada

A filtragem de grupos por `dataLimite` aparece em `HomeDinamicaScreen.tsx` mas não em `GruposDeAmigosScreen.tsx`. Se um usuário entrar na tela de grupos, verá grupos expirados.

```typescript
// HomeDinamicaScreen.tsx (faz o filtro)
const activeGroups = userGroups.filter(group => {
  if (!group.dataLimite) return true
  return new Date(group.dataLimite) > now
})

// GruposDeAmigosScreen.tsx (não faz o filtro)
setGroups(userGroups)
```

Essa regra deve viver no repositório ou use case, não na tela.

---

## Priorização

| # | Melhoria | Impacto | Esforço |
|---|---|---|---|
| 1 | Remover boilerplate Ignite (seção 1.2) | Alto | Baixo |
| 2 | Corrigir `getUserGroups` com `array-contains` (7.3) | Alto | Baixo |
| 3 | Extrair `useAppForeground` hook (6.2) | Médio | Baixo |
| 4 | Mover credencial para env (7.1) | Alto (segurança) | Baixo |
| 5 | Padronizar error handling (6.4) | Médio | Médio |
| 6 | Extrair use cases de `ConfigurarLimiteScreen` e `LoginScreen` (2.1) | Alto | Médio |
| 7 | Criar camada de Ports/Adapters para Firebase (3.1–3.2) | Alto | Alto |
| 8 | Entidades ricas no domínio (4.1–4.3) | Médio | Alto |
| 9 | Reestruturar pastas por feature (1.1) | Médio | Alto |
| 10 | Mover operações multi-documento para Cloud Functions (5.2) | Alto | Alto |
