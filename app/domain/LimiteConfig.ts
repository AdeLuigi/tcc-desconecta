import { DomainError } from "./errors"

export type DiaAtivo = "SEG" | "TER" | "QUA" | "QUI" | "SEX" | "SAB" | "DOM"

export interface LimiteConfigData {
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

  static create(input: LimiteConfigData): LimiteConfig {
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
  toJSON(): LimiteConfigData {
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
