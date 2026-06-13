import { updateUserData } from "@/services/userService"
import screenTimeService from "@/services/screenTime"
import type { UserData, LimiteConfig } from "@/services/userService"

export async function deleteLimitConfigUseCase(
  userId: string,
  userData: UserData,
  configToDelete: LimiteConfig,
  setUserData: (data: UserData) => void,
): Promise<void> {
  const updatedLimites = (userData.configuracoes?.limitesDeApps ?? []).filter(
    (l) => l.nome !== configToDelete.nome,
  )

  await updateUserData(userId, {
    configuracoes: {
      ...userData.configuracoes,
      limitesDeApps: updatedLimites,
      appsComLimite: updatedLimites.flatMap((c) => c.appsComLimite),
      sitesComLimite: updatedLimites.flatMap((c) => c.sitesComLimite),
      limiteAppsNome: updatedLimites.map((c) => c.nome).join(", "),
    },
  })

  // Desabilitar bloqueio para apps que só estavam neste limite
  const remainingPkgs = new Set(updatedLimites.flatMap((l) => l.appsComLimite))
  const removedPkgs = configToDelete.appsComLimite.filter((pkg) => !remainingPkgs.has(pkg))

  if (removedPkgs.length > 0) {
    const disableMap = Object.fromEntries(
      removedPkgs.map((pkg) => [pkg, { limitMinutes: 0, activeDays: [] }]),
    )
    await screenTimeService.configureAppBlocking(disableMap, false)
  }

  setUserData({
    ...userData,
    configuracoes: {
      ...userData.configuracoes,
      limitesDeApps: updatedLimites,
      appsComLimite: updatedLimites.flatMap((c) => c.appsComLimite),
      sitesComLimite: updatedLimites.flatMap((c) => c.sitesComLimite),
      limiteAppsNome: updatedLimites.map((c) => c.nome).join(", "),
    },
  })
}
