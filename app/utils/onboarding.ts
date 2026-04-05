import { loadString, saveString } from "@/utils/storage"

export const ONBOARDING_COMPLETED_KEY = "app.onboarding.completed"

export function isOnboardingCompleted(): boolean {
  return loadString(ONBOARDING_COMPLETED_KEY) === "true"
}

export function markOnboardingCompleted(): boolean {
  return saveString(ONBOARDING_COMPLETED_KEY, "true")
}
