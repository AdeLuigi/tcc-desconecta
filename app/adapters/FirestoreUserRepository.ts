import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "@react-native-firebase/firestore"
import type { IUserRepository } from "@/ports/IUserRepository"
import type { UserData, LimiteConfig } from "@/services/userService"

export class FirestoreUserRepository implements IUserRepository {
  private db = getFirestore()

  async findById(userId: string): Promise<UserData | null> {
    const snap = await getDoc(doc(this.db, "usuarios", userId))
    return snap.exists() ? (snap.data() as UserData) : null
  }

  async save(userData: UserData): Promise<void> {
    await setDoc(doc(this.db, "usuarios", userData.userId), userData)
  }

  async update(userId: string, partial: Partial<UserData>): Promise<void> {
    await updateDoc(doc(this.db, "usuarios", userId), partial as Record<string, unknown>)
  }

  async updateLimites(userId: string, limites: LimiteConfig[]): Promise<void> {
    await updateDoc(doc(this.db, "usuarios", userId), {
      "configuracoes.limitesDeApps": limites,
    })
  }
}
