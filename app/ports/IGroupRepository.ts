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
