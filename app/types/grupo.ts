export interface MembroGrupo {
  cargo: string
  userId: string
}

export interface RankingMensal {
  pontos: number
  userId: string
}

export interface Grupo {
  id?: string
  nome: string
  descricao: string
  foto: string
  membros: MembroGrupo[]
  ranking_mensal: RankingMensal[]
}
