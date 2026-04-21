import { create } from "zustand";
import { onboardingService } from "@/domains/onboarding/onboarding.service";
import {
  OnboardingDraft,
  OnboardingStepId,
  UserPreferences,
  UserProfile,
} from "@/domains/onboarding/types";
import { createLogger } from "@/utils/logger";

const onboardingLogger = createLogger("onboarding");

export const ONBOARDING_STEP_IDS: OnboardingStepId[] = [
  "account",
  "focus",
  "work_style",
  "wake_time",
  "sleep_time",
  "energy_type",
  "preferred_pace",
  "reminder_style",
  "tone_preference",
  "preferred_currency",
  "completion",
];

export const FIRST_ONBOARDING_STEP_INDEX = 1;

interface SaveStepInput {
  profile?: Partial<UserProfile>;
  preferences?: Partial<UserPreferences>;
}

export interface OnboardingStoreState {
  currentStep: number;
  draft: OnboardingDraft | null;
  isStarted: boolean;
  isCompleted: boolean;
  isSkipped: boolean;
  isLoading: boolean;
  startOnboarding: (input: { displayName: string }) => Promise<void>;
  nextStep: () => Promise<void>;
  previousStep: () => Promise<void>;
  saveStep: (input: SaveStepInput) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  skipOnboarding: () => Promise<void>;
  restoreOnboarding: () => Promise<void>;
  resetOnboarding: () => void;
}

function getStepId(stepIndex: number): OnboardingStepId {
  return ONBOARDING_STEP_IDS[stepIndex] ?? "account";
}

export const useOnboardingStore = create<OnboardingStoreState>((set, get) => ({
  currentStep: 0,
  draft: null,
  isStarted: false,
  isCompleted: false,
  isSkipped: false,
  isLoading: false,

  async restoreOnboarding() {
    set({ isLoading: true });
    try {
      const draft = await onboardingService.getDraft();

      set({
        draft,
        currentStep: draft.state.currentStep,
        isStarted: draft.state.started,
        isCompleted: draft.state.completed,
        isSkipped: draft.state.skipped,
        isLoading: false,
      });
    } catch (error) {
      onboardingLogger.error("restore onboarding failed", error);
      set({
        draft: null,
        currentStep: 0,
        isStarted: false,
        isCompleted: false,
        isSkipped: false,
        isLoading: false,
      });
      throw error;
    }
  },
  async startOnboarding(input) {
    set({ isLoading: true });
    const draft = await onboardingService.startOnboarding(input);

    set({
      draft,
      currentStep: draft.state.currentStep,
      isStarted: true,
      isCompleted: draft.state.completed,
      isSkipped: draft.state.skipped,
      isLoading: false,
    });
  },

  async saveStep(input) {
    const currentState = get();
    const draft = currentState.draft;

    if (!draft) {
      return;
    }

    const nextProfile = input.profile
      ? await onboardingService.saveProfile({
          ...draft.profile,
          ...input.profile,
        })
      : draft.profile;

    const nextPreferences = input.preferences
      ? await onboardingService.savePreferences({
          ...draft.preferences,
          ...input.preferences,
        })
      : draft.preferences;

    set({
      draft: {
        ...draft,
        profile: nextProfile,
        preferences: nextPreferences,
      },
    });
  },

  async nextStep() {
    const currentState = get();
    const draft = currentState.draft;

    if (!draft) {
      return;
    }

    const nextStepIndex = Math.min(currentState.currentStep + 1, ONBOARDING_STEP_IDS.length - 1);
    const nextState = await onboardingService.saveProgress({
      currentStep: nextStepIndex,
      completedStepId: getStepId(currentState.currentStep),
      existingState: draft.state,
    });

    set({
      currentStep: nextStepIndex,
      isStarted: true,
      isSkipped: false,
      draft: {
        ...draft,
        state: nextState,
      },
    });
  },

  async previousStep() {
    const currentState = get();
    const draft = currentState.draft;

    if (!draft) {
      return;
    }

    const previousStepIndex = Math.max(
      currentState.currentStep - 1,
      FIRST_ONBOARDING_STEP_INDEX,
    );
    const nextState = await onboardingService.saveProgress({
      currentStep: previousStepIndex,
      existingState: draft.state,
    });

    set({
      currentStep: previousStepIndex,
      isStarted: true,
      draft: {
        ...draft,
        state: nextState,
      },
    });
  },

  async completeOnboarding() {
    const currentState = get();
    const draft = currentState.draft;

    if (!draft) {
      return;
    }

    const completedDraft = await onboardingService.completeOnboarding({
      ...draft,
      state: {
        ...draft.state,
        currentStep: ONBOARDING_STEP_IDS.length - 1,
        completedSteps: ONBOARDING_STEP_IDS.slice(0, -1),
      },
    });

    set({
      draft: completedDraft,
      currentStep: completedDraft.state.currentStep,
      isStarted: true,
      isCompleted: true,
      isSkipped: false,
      isLoading: false,
    });
  },
  async skipOnboarding() {
    const currentState = get();
    const draft = currentState.draft;

    if (!draft) {
      return;
    }

    const skippedDraft = await onboardingService.skipOnboarding(draft);

    set({
      draft: skippedDraft,
      currentStep: skippedDraft.state.currentStep,
      isStarted: true,
      isCompleted: skippedDraft.state.completed,
      isSkipped: true,
      isLoading: false,
    });
  },

  resetOnboarding() {
    set({
      currentStep: 0,
      draft: null,
      isStarted: false,
      isCompleted: false,
      isSkipped: false,
      isLoading: false,
    });
  },
}));
