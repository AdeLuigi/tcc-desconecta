import { userRepository, screenTimeGateway } from "@/adapters"
import { DomainError } from "@/domain/errors"
import type { UserData, LimiteConfig } from "@/services/userService"

export interface SaveLimitConfigInput {
  userId: string
  userData: UserData
  newConfig: LimiteConfig
  editingConfig: LimiteConfig | null
}

export async function saveLimitConfigUseCase(
  input: SaveLimitConfigInput,
  setUserData: (data: UserData) => void,
): Promise<boolean> {
  const { userId, userData, newConfig, editingConfig } = input

  if (!newConfig.nome.trim()) throw new DomainError("Dê um nome para este limite.")
  if (newConfig.limiteMinutos < 2) throw new DomainError("Limite mínimo é 2 minutos.")
  if (newConfig.diasAtivos.length === 0) throw new DomainError("Selecione ao menos 1 dia.")
  if (newConfig.appsComLimite.length === 0) throw new DomainError("Selecione ao menos 1 app.")

  const currentLimites = userData.configuracoes?.limitesDeApps ?? []
  let updatedLimites: LimiteConfig[]

  if (editingConfig) {
    updatedLimites = currentLimites.map((l) =>
      l.nome === editingConfig.nome ? newConfig : l,
    )
  } else {
    updatedLimites = [...currentLimites, newConfig]
  }

  const updatedConfiguracoes = {
    ...userData.configuracoes,
    bloqueio_apps: true,
    limitesDeApps: updatedLimites,
    appsComLimite: updatedLimites.flatMap((c) => c.appsComLimite),
    sitesComLimite: updatedLimites.flatMap((c) => c.sitesComLimite),
    limiteAppsNome: updatedLimites.map((c) => c.nome).join(", "),
  }

  await userRepository.update(userId, { configuracoes: updatedConfiguracoes })

  const appConfigs = buildAppBlockingConfigs(updatedLimites)
  const [, isAccessibilityEnabled] = await Promise.all([
    screenTimeGateway.configureBlocking(appConfigs, true),
    screenTimeGateway.isAccessibilityServiceEnabled(),
  ])

  setUserData({ ...userData, configuracoes: updatedConfiguracoes })

  return isAccessibilityEnabled as boolean
}

/**
 * Constrói o mapa per-app usando o limite mais restritivo quando um app
 * aparece em múltiplos LimiteConfig.
 */
function buildAppBlockingConfigs(
  limites: LimiteConfig[],
): Record<string, { limitMinutes: number; activeDays: string[] }> {
  const map: Record<string, { limitMinutes: number; activeDays: string[] }> = {}

  for (const limite of limites) {
    for (const pkg of limite.appsComLimite) {
      const existing = map[pkg]
      if (!existing || limite.limiteMinutos < existing.limitMinutes) {
        map[pkg] = {
          limitMinutes: limite.limiteMinutos,
          activeDays: Array.from(limite.diasAtivos),
        }
      }
    }
  }

  return map
}
