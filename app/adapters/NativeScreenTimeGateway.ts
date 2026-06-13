import { NativeModules, Platform } from "react-native"
import type {
  IScreenTimeGateway,
  AppUsage,
  AppBlockingConfig,
} from "@/ports/IScreenTimeGateway"

export class NativeScreenTimeGateway implements IScreenTimeGateway {
  private module = NativeModules.ScreenTimeModule

  async hasPermission(): Promise<boolean> {
    if (Platform.OS !== "android") return false
    return this.module.hasUsageStatsPermission()
  }

  requestPermission(): void {
    if (Platform.OS !== "android") return
    this.module.openUsageSettings()
  }

  async getTodayUsage(): Promise<AppUsage[]> {
    if (Platform.OS !== "android") return []
    const raw: Array<{ packageName: string; totalTimeInForeground: number }> =
      await this.module.getTodayAppUsage()
    return raw.map((item) => ({
      packageName: item.packageName,
      totalMinutes: Math.floor(item.totalTimeInForeground / 60000),
    }))
  }

  async isAccessibilityServiceEnabled(): Promise<boolean> {
    if (Platform.OS !== "android") return false
    return this.module.isAccessibilityServiceEnabled()
  }

  async configureBlocking(
    configs: Record<string, AppBlockingConfig>,
    enable: boolean,
  ): Promise<void> {
    if (Platform.OS !== "android") return
    await this.module.configureAppBlocking(configs, enable)
  }
}
