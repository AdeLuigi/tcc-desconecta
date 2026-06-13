/** Erro de regra de negócio — input inválido ou violação de domínio */
export class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DomainError"
  }
}

/** Entidade requisitada não encontrada */
export class NotFoundError extends DomainError {
  constructor(entity: string, id?: string) {
    super(id ? `${entity} "${id}" não encontrado` : `${entity} não encontrado`)
    this.name = "NotFoundError"
  }
}

/** Operação não permitida para este usuário */
export class PermissionError extends DomainError {
  constructor(message = "Permissão negada") {
    super(message)
    this.name = "PermissionError"
  }
}

/** Conflito de estado (ex: usuário já é membro do grupo) */
export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message)
    this.name = "ConflictError"
  }
}

/** Erro de infraestrutura/rede — não é culpa do usuário */
export class NetworkError extends Error {
  constructor(message = "Falha de conexão. Tente novamente.") {
    super(message)
    this.name = "NetworkError"
  }
}

/** Helpers para verificação de tipo */
export const isDomainError = (e: unknown): e is DomainError => e instanceof DomainError
export const isNetworkError = (e: unknown): e is NetworkError => e instanceof NetworkError
