import { FirestoreUserRepository } from "./FirestoreUserRepository"
import { FirestoreGroupRepository } from "./FirestoreGroupRepository"
import { NativeScreenTimeGateway } from "./NativeScreenTimeGateway"
import { FcmNotificationService } from "./FcmNotificationService"

// Singletons — criados uma vez e reutilizados em toda a aplicação
export const userRepository = new FirestoreUserRepository()
export const groupRepository = new FirestoreGroupRepository()
export const screenTimeGateway = new NativeScreenTimeGateway()
export const notificationService = new FcmNotificationService()
