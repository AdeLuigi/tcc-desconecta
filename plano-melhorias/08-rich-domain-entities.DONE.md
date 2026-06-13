# Commit 08 — Entidades Ricas de Domínio e Value Objects

**Mensagem de commit:** `refactor: introduce rich domain entities and value objects`

---

## Objetivo

As entidades atuais são interfaces TypeScript "anêmicas" — apenas sacos de dados sem comportamento. As regras de negócio estão espalhadas em telas e services. Introduzir entidades ricas e value objects concentra o comportamento e a validação onde pertencem: no domínio.

---

## Arquivos Afetados

**Criar:**
- `app/domain/LimiteConfig.ts`
- `app/domain/Group.ts`
- `app/domain/GroupCode.ts`
- `app/domain/PackageName.ts`

**Modificar:**
- `app/ports/IGroupRepository.ts` — usar tipo `Group` do domínio
- `app/useCases/limits/saveLimitConfigUseCase.ts` — usar `LimiteConfig` do domínio
- `app/services/groupService.ts` — usar `GroupCode.generate()` para geração de código

---

## Passos de Execução

### Passo 1 — Criar Value Object `GroupCode`

```typescript
// app/domain/GroupCode.ts
import { DomainError } from "./errors"

export class GroupCode {
  static readonly LENGTH = 6
  private constructor(readonly value: string) {}

  static generate(): GroupCode {
    // Usa crypto para gerar código criptograficamente seguro
    // (substitui o Math.random() atual — ver débito técnico 7.4)
    const array = new Uint8Array(8)
    crypto.getRandomValues(array)
    const code = Array.from(array)
      .map(b => b.toString(36).toUpperCase())
      .join("")
      .slice(0, GroupCode.LENGTH)
    return new GroupCode(code)
  }

  static from(raw: string): GroupCode {
    if (!raw || raw.length !== GroupCode.LENGTH) {
      throw new DomainError(`Código de grupo deve ter ${GroupCode.LENGTH} caracteres`)
    }
    return new GroupCode(raw.toUpperCase())
  }

  toString(): string {
    return this.value
  }
}
```

> **Nota:** `crypto.getRandomValues` está disponível no React Native via `react-native-get-random-values`. Se o pacote não estiver instalado, instalar: `npx expo install react-native-get-random-values` e importar no topo do `index.tsx`.

### Passo 2 — Criar Value Object `PackageName`

```typescript
// app/domain/PackageName.ts
import { DomainError } from "./errors"

export class PackageName {
  private constructor(readonly value: string) {}

  static of(raw: string): PackageName {
    if (!raw || !raw.includes(".")) {
      throw new DomainError(`Package name inválido: "${raw}"`)
    }
    return new PackageName(raw.toLowerCase())
  }

  equals(other: PackageName): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
```

### Passo 3 — Criar entidade `LimiteConfig`

```typescript
// app/domain/LimiteConfig.ts
import { DomainError } from "./errors"

export type DiaAtivo = "SEG" | "TER" | "QUA" | "QUI" | "SEX" | "SAB" | "DOM"

export interface LimiteConfigInput {
  nome: string
  emoji: string
  appsComLimite: string[]
  sitesComLimite?: string[]
  limiteMinutos: number
  diasAtivos: DiaAtivo[]
}

const DIAS_DA_SEMANA: DiaAtivo[] = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"]

export class LimiteConfig {
  private constructor(
    readonly nome: string,
    readonly emoji: string,
    readonly appsComLimite: string[],
    readonly sitesComLimite: string[],
    readonly limiteMinutos: number,
    readonly diasAtivos: DiaAtivo[],
  ) {}

  static create(input: LimiteConfigInput): LimiteConfig {
    if (!input.nome.trim()) throw new DomainError("Nome do limite é obrigatório")
    if (input.limiteMinutos < 2) throw new DomainError("Limite mínimo é 2 minutos")
    if (input.limiteMinutos > 1440) throw new DomainError("Limite máximo é 1440 minutos (24h)")
    if (input.diasAtivos.length === 0) throw new DomainError("Selecione ao menos 1 dia")
    if (input.appsComLimite.length === 0) throw new DomainError("Selecione ao menos 1 app")

    return new LimiteConfig(
      input.nome.trim(),
      input.emoji,
      input.appsComLimite,
      input.sitesComLimite ?? [],
      input.limiteMinutos,
      input.diasAtivos,
    )
  }

  /** Verifica se este limite está ativo hoje */
  isActiveToday(): boolean {
    const today = DIAS_DA_SEMANA[new Date().getDay()]
    return this.diasAtivos.includes(today)
  }

  /** Retorna true se este limite é mais restritivo que `other` */
  isMoreRestrictiveThan(other: LimiteConfig): boolean {
    return this.limiteMinutos < other.limiteMinutos
  }

  /** Serializa para persistência no Firestore */
  toJSON(): LimiteConfigInput {
    return {
      nome: this.nome,
      emoji: this.emoji,
      appsComLimite: this.appsComLimite,
      sitesComLimite: this.sitesComLimite,
      limiteMinutos: this.limiteMinutos,
      diasAtivos: this.diasAtivos,
    }
  }
}
```

### Passo 4 — Criar entidade `Group` (agregado)

```typescript
// app/domain/Group.ts
import { DomainError, ConflictError, NotFoundError } from "./errors"

export type Cargo = "administrador" | "membro"

export interface GroupMember {
  userId: string
  cargo: Cargo
  nome: string
  fotoUrl?: string
}

export interface GroupProps {
  id: string
  nome: string
  codigo: string
  adminId: string
  membros: GroupMember[]
  dataLimite?: string
}

export class Group {
  private _membros: GroupMember[]

  private constructor(
    readonly id: string,
    readonly nome: string,
    readonly codigo: string,
    readonly adminId: string,
    membros: GroupMember[],
    readonly dataLimite?: string,
  ) {
    this._membros = [...membros]
  }

  static create(props: GroupProps): Group {
    if (!props.nome.trim()) throw new DomainError("Nome do grupo é obrigatório")
    if (!props.codigo) throw new DomainError("Código do grupo é obrigatório")
    return new Group(
      props.id,
      props.nome.trim(),
      props.codigo,
      props.adminId,
      props.membros,
      props.dataLimite,
    )
  }

  get membros(): ReadonlyArray<GroupMember> {
    return this._membros
  }

  get membrosIds(): string[] {
    return this._membros.map(m => m.userId)
  }

  addMember(member: GroupMember): void {
    if (this._membros.some(m => m.userId === member.userId)) {
      throw new ConflictError("Usuário já é membro deste grupo")
    }
    this._membros.push(member)
  }

  removeMember(userId: string): void {
    const member = this._membros.find(m => m.userId === userId)
    if (!member) throw new NotFoundError("Membro", userId)

    if (this.isAdmin(userId) && this._membros.length === 1) {
      throw new DomainError("Não é possível remover o único administrador")
    }

    this._membros = this._membros.filter(m => m.userId !== userId)
  }

  isAdmin(userId: string): boolean {
    return this._membros.some(m => m.userId === userId && m.cargo === "administrador")
  }

  isMember(userId: string): boolean {
    return this._membros.some(m => m.userId === userId)
  }

  isExpired(): boolean {
    if (!this.dataLimite) return false
    return new Date(this.dataLimite) < new Date()
  }

  toJSON(): GroupProps {
    return {
      id: this.id,
      nome: this.nome,
      codigo: this.codigo,
      adminId: this.adminId,
      membros: [...this._membros],
      dataLimite: this.dataLimite,
    }
  }
}
```

### Passo 5 — Usar `GroupCode.generate()` em `groupService.ts`

```typescript
// groupService.ts — antes
function generateGroupCode(): string {
  return Math.random().toString(36).toUpperCase().slice(2, 8)   // ← inseguro
}

// groupService.ts — depois
import { GroupCode } from "@/domain/GroupCode"

const codigo = GroupCode.generate().toString()
```

### Passo 6 — Corrigir filtragem de grupos expirados com `Group.isExpired()`

Em `HomeDinamicaScreen.tsx`, substituir a filtragem inline:

```typescript
// Antes:
const activeGroups = userGroups.filter(group => {
  if (!group.dataLimite) return true
  return new Date(group.dataLimite) > now
})

// Depois (usando Group.isExpired()):
const activeGroups = userGroups
  .map(g => Group.create(g))
  .filter(g => !g.isExpired())
```

E aplicar o mesmo em `GruposDeAmigosScreen.tsx` para corrigir o débito técnico 7.7.

---

## Verificação

```bash
# 1. Confirmar que a pasta domain existe com os arquivos
ls app/domain/

# 2. Confirmar que GroupCode não usa Math.random()
grep -n "Math.random" app/domain/GroupCode.ts app/services/groupService.ts
# Esperado: sem resultados

# 3. Checar tipos
npx tsc --noEmit

# 4. Testar criação de limite com validações:
#    - Tentar salvar limite sem nome → deve exibir "Nome do limite é obrigatório"
#    - Tentar salvar com 0 dias → deve exibir "Selecione ao menos 1 dia"
#    - Testar criar grupo e verificar que o código gerado tem 6 caracteres
```

---

## Resultado Esperado

- Regras de negócio concentradas nas entidades de domínio (`isActiveToday`, `isExpired`, `isMoreRestrictiveThan`).
- Geração de código de grupo criptograficamente segura.
- Filtragem de grupos expirados consistente entre todas as telas.
- Validações de `LimiteConfig` em um único lugar (sem duplicação entre tela e service).
