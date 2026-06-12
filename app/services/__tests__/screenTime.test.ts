// jest.mock é hoistado pelo Babel para antes dos imports — garante que NativeModules
// e Platform já estão mockados quando o módulo screenTime é carregado
jest.mock("react-native", () => ({
  Platform: {
    OS: "android",
    select: jest.fn((obj: Record<string, unknown>) => obj.android ?? obj.default),
  },
  NativeModules: {
    ScreenTimeModule: {
      hasUsageStatsPermission: jest.fn(),
      requestUsageStatsPermission: jest.fn(),
      openUsageSettings: jest.fn(),
      startBackgroundTracking: jest.fn(),
      stopBackgroundTracking: jest.fn(),
      configureAppBlocking: jest.fn(),
      setBackgroundSyncUser: jest.fn(),
      setExcludedPackages: jest.fn(),
    },
  },
}))

import { NativeModules, Platform } from "react-native"
import screenTimeService from "@/services/screenTime"

const MockedPlatform = Platform as { OS: string }
const mockHasPermission = NativeModules.ScreenTimeModule.hasUsageStatsPermission as jest.Mock
const mockRequestPermission = NativeModules.ScreenTimeModule
  .requestUsageStatsPermission as jest.Mock
const mockStartBackgroundTracking = NativeModules.ScreenTimeModule
  .startBackgroundTracking as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  // Limpar o cache de permissão entre testes
  ;(screenTimeService as any)._permissionCache = null
  // Garantir que Platform.OS é "android" por padrão
  MockedPlatform.OS = "android"
})

// ─── hasPermission ────────────────────────────────────────────────────────────
describe("hasPermission", () => {
  it("retorna false em plataformas que não são Android", async () => {
    MockedPlatform.OS = "ios"

    const result = await screenTimeService.hasPermission()

    expect(result).toBe(false)
    expect(mockHasPermission).not.toHaveBeenCalled()
  })

  it("chama o módulo nativo e retorna true quando permissão foi concedida", async () => {
    mockHasPermission.mockResolvedValueOnce(true)

    const result = await screenTimeService.hasPermission()

    expect(result).toBe(true)
    expect(mockHasPermission).toHaveBeenCalledTimes(1)
  })

  it("chama o módulo nativo e retorna false quando permissão foi negada", async () => {
    mockHasPermission.mockResolvedValueOnce(false)

    const result = await screenTimeService.hasPermission()

    expect(result).toBe(false)
    expect(mockHasPermission).toHaveBeenCalledTimes(1)
  })

  it("usa cache na segunda chamada dentro do TTL (30s)", async () => {
    mockHasPermission.mockResolvedValue(true)

    await screenTimeService.hasPermission()
    await screenTimeService.hasPermission()

    // O módulo nativo deve ter sido chamado apenas uma vez — a segunda usa o cache
    expect(mockHasPermission).toHaveBeenCalledTimes(1)
  })

  it("chama o nativo novamente após o TTL de 30s", async () => {
    mockHasPermission.mockResolvedValue(true)

    // Primeira chamada
    await screenTimeService.hasPermission()

    // Simular passagem de 31 segundos alterando o timestamp do cache
    ;(screenTimeService as any)._permissionCache.ts -= 31_000

    // Segunda chamada deve ir ao módulo nativo novamente
    await screenTimeService.hasPermission()

    expect(mockHasPermission).toHaveBeenCalledTimes(2)
  })

  it("retorna false e não preenche o cache quando o módulo nativo lança erro", async () => {
    mockHasPermission.mockRejectedValueOnce(new Error("Native module error"))

    const result = await screenTimeService.hasPermission()

    expect(result).toBe(false)
    // Cache deve estar vazio — próxima chamada deve tentar o nativo novamente
    expect((screenTimeService as any)._permissionCache).toBeNull()
  })

  it("tenta o nativo novamente após erro anterior (sem cache)", async () => {
    mockHasPermission
      .mockRejectedValueOnce(new Error("Native error"))
      .mockResolvedValueOnce(true)

    await screenTimeService.hasPermission() // erro → false, cache não preenchido
    const result = await screenTimeService.hasPermission() // segunda tentativa

    expect(result).toBe(true)
    expect(mockHasPermission).toHaveBeenCalledTimes(2)
  })
})

// ─── requestPermission ────────────────────────────────────────────────────────
describe("requestPermission", () => {
  it("não faz nada em plataformas que não são Android", () => {
    MockedPlatform.OS = "ios"

    screenTimeService.requestPermission()

    expect(mockRequestPermission).not.toHaveBeenCalled()
  })

  it("invalida o cache de permissão ao ser chamado", async () => {
    // Popular o cache primeiro
    mockHasPermission.mockResolvedValueOnce(true)
    await screenTimeService.hasPermission()
    expect((screenTimeService as any)._permissionCache).not.toBeNull()

    // requestPermission deve limpar o cache
    screenTimeService.requestPermission()

    expect((screenTimeService as any)._permissionCache).toBeNull()
  })
})

// ─── startBackgroundTracking ──────────────────────────────────────────────────
describe("startBackgroundTracking", () => {
  it("retorna false em plataformas que não são Android", async () => {
    MockedPlatform.OS = "ios"

    const result = await screenTimeService.startBackgroundTracking()

    expect(result).toBe(false)
    expect(mockStartBackgroundTracking).not.toHaveBeenCalled()
  })

  it("retorna false quando não tem permissão", async () => {
    mockHasPermission.mockResolvedValueOnce(false)

    const result = await screenTimeService.startBackgroundTracking()

    expect(result).toBe(false)
    expect(mockStartBackgroundTracking).not.toHaveBeenCalled()
  })

  it("inicia tracking quando tem permissão e retorna true", async () => {
    mockHasPermission.mockResolvedValueOnce(true)
    mockStartBackgroundTracking.mockResolvedValueOnce(true)

    const result = await screenTimeService.startBackgroundTracking()

    expect(result).toBe(true)
    expect(mockStartBackgroundTracking).toHaveBeenCalledTimes(1)
  })

  it("retorna false (não lança erro) quando módulo nativo falha", async () => {
    mockHasPermission.mockResolvedValueOnce(true)
    mockStartBackgroundTracking.mockRejectedValueOnce(new Error("Foreground service error"))

    const result = await screenTimeService.startBackgroundTracking()

    expect(result).toBe(false)
  })
})
