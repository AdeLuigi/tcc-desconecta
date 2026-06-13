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
    return this._membros.map((m) => m.userId)
  }

  addMember(member: GroupMember): void {
    if (this._membros.some((m) => m.userId === member.userId)) {
      throw new ConflictError("Usuário já é membro deste grupo")
    }
    this._membros.push(member)
  }

  removeMember(userId: string): void {
    const member = this._membros.find((m) => m.userId === userId)
    if (!member) throw new NotFoundError("Membro", userId)

    if (this.isAdmin(userId) && this._membros.length === 1) {
      throw new DomainError("Não é possível remover o único administrador")
    }

    this._membros = this._membros.filter((m) => m.userId !== userId)
  }

  isAdmin(userId: string): boolean {
    return this._membros.some((m) => m.userId === userId && m.cargo === "administrador")
  }

  isMember(userId: string): boolean {
    return this._membros.some((m) => m.userId === userId)
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
