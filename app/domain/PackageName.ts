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
