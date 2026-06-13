export interface AppUsage {
  packageName: string
  totalMinutes: number
}

export interface AppBlockingConfig {
  limitMinutes: number
  activeDays: string[]
}

export interface IScreenTimeGateway {
  hasPermission(): Promise<boolean>
  requestPermission(): void
  getTodayUsage(): Promise<AppUsage[]>
  isAccessibilityServiceEnabled(): Promise<boolean>
  configureBlocking(
    configs: Record<string, AppBlockingConfig>,
    enable: boolean,
  ): Promise<void>
}
