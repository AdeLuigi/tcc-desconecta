import { NativeModules, Platform } from "react-native"

export interface InstalledApp {
  packageName: string
  appName: string
  icon: string // base64 data URI ("data:image/png;base64,...") or empty string
}

export async function getInstalledApps(): Promise<InstalledApp[]> {
  if (Platform.OS !== "android") {
    return []
  }
  try {
    const apps: InstalledApp[] = await NativeModules.InstalledApps.getInstalledApps()
    return apps
  } catch {
    return []
  }
}
