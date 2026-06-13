import { DomainError } from "./errors"

export class GroupCode {
  static readonly LENGTH = 6

  private constructor(readonly value: string) {}

  static generate(): GroupCode {
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    const code = Array.from(array)
      .map((b) => b.toString(36).toUpperCase())
      .join("")
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, GroupCode.LENGTH)
    // Garante comprimento caso o slice resulte em menos de 6 chars após sanitização
    if (code.length < GroupCode.LENGTH) return GroupCode.generate()
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
