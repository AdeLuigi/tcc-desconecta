import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  arrayUnion,
  arrayRemove,
} from "@react-native-firebase/firestore"
import type { IGroupRepository, Group, GroupMember } from "@/ports/IGroupRepository"

export class FirestoreGroupRepository implements IGroupRepository {
  private db = getFirestore()
  private col = () => collection(this.db, "grupos")

  async findById(groupId: string): Promise<Group | null> {
    const snap = await getDoc(doc(this.db, "grupos", groupId))
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Group) : null
  }

  async findByMember(userId: string): Promise<Group[]> {
    const q = query(this.col(), where("membrosIds", "array-contains", userId))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Group))
  }

  async findByCode(code: string): Promise<Group | null> {
    const q = query(this.col(), where("codigo", "==", code))
    const snap = await getDocs(q)
    if (snap.empty) return null
    const d = snap.docs[0]
    return { id: d.id, ...d.data() } as Group
  }

  async save(group: Omit<Group, "id">): Promise<string> {
    const ref = await addDoc(this.col(), group)
    return ref.id
  }

  async addMember(groupId: string, member: GroupMember): Promise<void> {
    await updateDoc(doc(this.db, "grupos", groupId), {
      membros: arrayUnion(member),
      membrosIds: arrayUnion(member.userId),
    })
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    const group = await this.findById(groupId)
    if (!group) return
    const member = group.membros.find((m) => m.userId === userId)
    if (!member) return
    await updateDoc(doc(this.db, "grupos", groupId), {
      membros: arrayRemove(member),
      membrosIds: arrayRemove(userId),
    })
  }
}
