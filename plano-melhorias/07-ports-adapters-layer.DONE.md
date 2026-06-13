# Commit 07 — Criar Camada de Ports/Adapters

**Mensagem de commit:** `refactor: add Ports/Adapters layer for external dependencies`

---

## Objetivo

O código depende diretamente dos SDKs externos (Firebase, módulo nativo Android) em toda a aplicação. Introduzir **Ports** (interfaces/contratos) e **Adapters** (implementações) isola o domínio da infraestrutura: torna cada service testável com mocks simples e permite trocar implementações sem alterar a lógica de negócio.

---

## Arquivos Afetados

**Criar:**
- `app/ports/IUserRepository.ts`
- `app/ports/IGroupRepository.ts`
- `app/ports/IScreenTimeGateway.ts`
- `app/ports/INotificationService.ts`
- `app/adapters/FirestoreUserRepository.ts`
- `app/adapters/FirestoreGroupRepository.ts`
- `app/adapters/NativeScreenTimeGateway.ts`
- `app/adapters/FcmNotificationService.ts`
- `app/adapters/index.ts` (singleton/factory dos adapters)

**Modificar:**
- `app/useCases/limits/saveLimitConfigUseCase.ts` (usar port em vez de service direto)
- `app/useCases/auth/signInWithGoogleUseCase.ts`

---

## Passos de Execução

### Passo 1 — Criar as Ports (interfaces)

**`app/ports/IUserRepository.ts`:**
```typescript
import type { UserData, LimiteConfig } from "@/services/userService"

export interface IUserRepository {
  findById(userId: string): Promise<UserData | null>
  save(userData: UserData): Promise<void>
  update(userId: string, partial: Partial<UserData>): Promise<void>
  updateLimites(userId: string, limites: LimiteConfig[]): Promise<void>
}
```

**`app/ports/IGroupRepository.ts`:**
```typescript
export interface GroupMember {
  userId: string
  cargo: "administrador" | "membro"
  nome: string
  fotoUrl?: string
}

export interface Group {
  id: string
  nome: string
  codigo: string
  adminId: string
  membros: GroupMember[]
  membrosIds: string[]
  dataLimite?: string
}

export interface IGroupRepository {
  findById(groupId: string): Promise<Group | null>
  findByMember(userId: string): Promise<Group[]>
  findByCode(code: string): Promise<Group | null>
  save(group: Omit<Group, "id">): Promise<string>
  addMember(groupId: string, member: GroupMember): Promise<void>
  removeMember(groupId: string, userId: string): Promise<void>
}
```

**`app/ports/IScreenTimeGateway.ts`:**
```typescript
export interface AppUsage {
  packageName: string
  totalMinutes: number
}

export interface AppBlockingConfig {
  limitMinutes: number
  activeDays: string[]
}

export interface IScreenTimeGateway {
  hasPermission(): Promise<boolean>
  requestPermission(): void
  getTodayUsage(): Promise<AppUsage[]>
  configureBlocking(
    configs: Record<string, AppBlockingConfig>,
    enable: boolean
  ): Promise<void>
}
```

**`app/ports/INotificationService.ts`:**
```typescript
export interface INotificationService {
  requestPermission(): Promise<boolean>
  getToken(): Promise<string | null>
  saveToken(userId: string, token: string): Promise<void>
  sendGroupNotification(
    groupId: string,
    senderId: string,
    message: string
  ): Promise<void>
}
```

### Passo 2 — Criar os Adapters (implementações Firebase)

**`app/adapters/FirestoreUserRepository.ts`:**
```typescript
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "@react-native-firebase/firestore"
import type { IUserRepository } from "@/ports/IUserRepository"
import type { UserData, LimiteConfig } from "@/services/userService"

export class FirestoreUserRepository implements IUserRepository {
  private db = getFirestore()

  async findById(userId: string): Promise<UserData | null> {
    const snap = await getDoc(doc(this.db, "usuarios", userId))
    return snap.exists() ? (snap.data() as UserData) : null
  }

  async save(userData: UserData): Promise<void> {
    await setDoc(doc(this.db, "usuarios", userData.uid), userData)
  }

  async update(userId: string, partial: Partial<UserData>): Promise<void> {
    await updateDoc(doc(this.db, "usuarios", userId), partial)
  }

  async updateLimites(userId: string, limites: LimiteConfig[]): Promise<void> {
    await updateDoc(doc(this.db, "usuarios", userId), { limites })
  }
}
```

**`app/adapters/FirestoreGroupRepository.ts`:**
```typescript
import {
  getFirestore, collection, doc, getDoc, getDocs,
  addDoc, updateDoc, query, where, arrayUnion, arrayRemove
} from "@react-native-firebase/firestore"
import type { IGroupRepository, Group, GroupMember } from "@/ports/IGroupRepository"

export class FirestoreGroupRepository implements IGroupRepository {
  private db = getFirestore()
  private col = () => collection(this.db, "grupos")

  async findById(groupId: string): Promise<Group | null> {
    const snap = await getDoc(doc(this.db, "grupos", groupId))
    return snap.exists() ? { id: snap.id, ...snap.data() } as Group : null
  }

  async findByMember(userId: string): Promise<Group[]> {
    const q = query(this.col(), where("membrosIds", "array-contains", userId))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Group))
  }

  async findByCode(code: string): Promise<Group | null> {
    const q = query(this.col(), where("codigo", "==", code))
    const snap = await getDocs(q)
    if (snap.empty) return null
    const d = snap.docs[0]
    return { id: d.id, ...d.data() } as Group
  }

  async save(group: Omit<Group, "id">): Promise<string> {
    const ref = await addDoc(this.col(), group)
    return ref.id
  }

  async addMember(groupId: string, member: GroupMember): Promise<void> {
    await updateDoc(doc(this.db, "grupos", groupId), {
      membros: arrayUnion(member),
      membrosIds: arrayUnion(member.userId),
    })
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    const group = await this.findById(groupId)
    if (!group) return
    const member = group.membros.find(m => m.userId === userId)
    if (!member) return
    await updateDoc(doc(this.db, "grupos", groupId), {
      membros: arrayRemove(member),
      membrosIds: arrayRemove(userId),
    })
  }
}
```

**`app/adapters/NativeScreenTimeGateway.ts`:**
```typescript
import { NativeModules } from "react-native"
import type { IScreenTimeGateway, AppUsage, AppBlockingConfig } from "@/ports/IScreenTimeGateway"

export class NativeScreenTimeGateway implements IScreenTimeGateway {
  private module = NativeModules.ScreenTimeModule

  async hasPermission(): Promise<boolean> {
    return this.module.hasUsageStatsPermission()
  }

  requestPermission(): void {
    this.module.openUsageSettings()
  }

  async getTodayUsage(): Promise<AppUsage[]> {
    const raw = await this.module.getTodayAppUsage()
    return raw.map((item: any) => ({
      packageName: item.packageName,
      totalMinutes: Math.floor(item.totalTimeInForeground / 60000),
    }))
  }

  async configureBlocking(
    configs: Record<string, AppBlockingConfig>,
    enable: boolean
  ): Promise<void> {
    await this.module.configureAppBlocking(configs, enable)
  }
}
```

### Passo 3 — Criar factory de adapters

**`app/adapters/index.ts`:**
```typescript
import { FirestoreUserRepository } from "./FirestoreUserRepository"
import { FirestoreGroupRepository } from "./FirestoreGroupRepository"
import { NativeScreenTimeGateway } from "./NativeScreenTimeGateway"

// Singletons — criados uma vez e reutilizados
export const userRepository = new FirestoreUserRepository()
export const groupRepository = new FirestoreGroupRepository()
export const screenTimeGateway = new NativeScreenTimeGateway()
```

### Passo 4 — Atualizar use cases para usar os ports

```typescript
// useCases/limits/saveLimitConfigUseCase.ts — atualizado
import { userRepository, screenTimeGateway } from "@/adapters"

export async function saveLimitConfigUseCase(
  input: SaveLimitConfigInput,
  setUserData: (data: UserData) => void,
): Promise<void> {
  // ... validações ...

  await userRepository.updateLimites(input.userId, updatedLimites)  // ← via port
  await screenTimeGateway.configureBlocking(appConfigs, true)        // ← via port

  setUserData(updatedUserData)
}
```

---

## Verificação

```bash
# 1. Confirmar que as pastas existem
ls app/ports/
ls app/adapters/

# 2. Checar tipos
npx tsc --noEmit

# 3. Verificar que use cases não importam Firebase diretamente
grep -rn "firebase" app/useCases/ --include="*.ts"
# Esperado: sem resultados

# 4. Teste de integração: criar grupo, entrar em grupo, verificar limite
```

**Teste de testabilidade** (opcional):
```typescript
// Em um teste unitário do saveLimitConfigUseCase, é possível mockar simplesmente:
const mockUserRepo: IUserRepository = {
  findById: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  updateLimites: jest.fn().mockResolvedValue(undefined),
}
```

---

## Resultado Esperado

- Use cases sem nenhum import do Firebase ou de módulos nativos.
- Services Firebase encapsulados em adapters com interfaces bem definidas.
- Base para testes unitários: qualquer use case pode receber mocks em vez dos adapters reais.
