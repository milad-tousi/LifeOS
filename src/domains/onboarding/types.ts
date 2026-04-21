import { EntityId, TimestampMs } from "@/types/shared.types";

export type AgeRange =
  | "under_18"
  | "18_24"
  | "25_34"
  | "35_44"
  | "45_54"
  | "55_plus";

export type Gender = "male" | "female" | "non_binary" | "prefer_not_to_say";

export type OccupationType =
  | "student"
  | "employee"
  | "freelancer"
  | "business_owner"
  | "job_seeker"
  | "other";

export type WorkStyle = "fixed" | "flexible" | "shift" | "remote" | "onsite" | "hybrid";
export type EnergyType = "early_bird" | "balanced" | "night_owl";
export type PreferredPace = "gentle" | "balanced" | "ambitious";
export type ReminderStyle = "gentle" | "motivating" | "structured" | "minimal";
export type TonePreference = "friendly" | "coach" | "calm" | "direct";

export type OnboardingStepId =
  | "account"
  | "focus"
  | "work_style"
  | "wake_time"
  | "sleep_time"
  | "energy_type"
  | "preferred_pace"
  | "reminder_style"
  | "tone_preference"
  | "preferred_currency"
  | "completion";

export interface UserProfile {
  id: EntityId;
  displayName: string;
  ageRange?: AgeRange;
  gender?: Gender;
  country?: string;
  timezone: string;
  language: string;
  occupationType?: OccupationType;
  workStyle?: WorkStyle;
  wakeTime?: string;
  sleepTime?: string;
  energyType?: EnergyType;
  currentFocus?: string;
  biggestChallenge?: string;
  preferredPace?: PreferredPace;
  createdAt: TimestampMs;
  updatedAt: TimestampMs;
}

export interface UserPreferences {
  id: EntityId;
  reminderEnabled: boolean;
  reminderStyle?: ReminderStyle;
  tonePreference?: TonePreference;
  morningReviewTime?: string;
  eveningReviewTime?: string;
  preferredCurrency?: string;
  updatedAt: TimestampMs;
}

export interface OnboardingState {
  id: EntityId;
  userId: EntityId;
  started: boolean;
  completed: boolean;
  skipped: boolean;
  currentStep: number;
  completedSteps: OnboardingStepId[];
  completedAt?: TimestampMs;
  skippedAt?: TimestampMs;
  updatedAt: TimestampMs;
}

export interface OnboardingDraft {
  profile: UserProfile;
  preferences: UserPreferences;
  state: OnboardingState;
}
