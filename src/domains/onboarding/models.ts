import {
  OnboardingDraft,
  OnboardingState,
  UserPreferences,
  UserProfile,
} from "@/domains/onboarding/types";

function getDefaultTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function getDefaultLanguage(): string {
  if (typeof navigator === "undefined") {
    return "en";
  }

  return navigator.language || "en";
}

export function createDefaultUserProfile(id: string): UserProfile {
  const timestamp = Date.now();

  return {
    id,
    displayName: "",
    timezone: getDefaultTimezone(),
    language: getDefaultLanguage(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createDefaultUserPreferences(id: string): UserPreferences {
  return {
    id,
    reminderEnabled: true,
    reminderStyle: "gentle",
    tonePreference: "friendly",
    preferredCurrency: "USD",
    updatedAt: Date.now(),
  };
}

export function createDefaultOnboardingState(id: string): OnboardingState {
  return {
    id,
    userId: id,
    started: false,
    completed: false,
    skipped: false,
    currentStep: 0,
    completedSteps: [],
    updatedAt: Date.now(),
  };
}

export function createDefaultOnboardingDraft(id: string): OnboardingDraft {
  return {
    profile: createDefaultUserProfile(id),
    preferences: createDefaultUserPreferences(id),
    state: createDefaultOnboardingState(id),
  };
}
