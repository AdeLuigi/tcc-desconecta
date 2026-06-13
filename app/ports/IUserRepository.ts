import type { UserData, LimiteConfig } from "@/services/userService"

export interface IUserRepository {
  findById(userId: string): Promise<UserData | null>
  save(userData: UserData): Promise<void>
  update(userId: string, partial: Partial<UserData>): Promise<void>
  updateLimites(userId: string, limites: LimiteConfig[]): Promise<void>
}
