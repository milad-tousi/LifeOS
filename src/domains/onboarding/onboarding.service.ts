import { authService } from "@/domains/auth/auth.service";
import {
  createDefaultOnboardingDraft,
  createDefaultOnboardingState,
  createDefaultUserPreferences,
  createDefaultUserProfile,
} from "@/domains/onboarding/models";
import { onboardingRepository } from "@/domains/onboarding/repository";
import {
  OnboardingDraft,
  OnboardingState,
  OnboardingStepId,
  UserPreferences,
  UserProfile,
} from "@/domains/onboarding/types";
import { createLogger } from "@/utils/logger";

const onboardingLogger = createLogger("onboarding");

async function resolveUserId(): Promise<string> {
  const session = await authService.getCurrentSession();

  if (!session) {
    throw new Error("Unable to resolve onboarding user without an active session.");
  }

  return session.userId;
}

function mergeCompletedSteps(
  currentSteps: OnboardingStepId[],
  stepId: OnboardingStepId,
): OnboardingStepId[] {
  return currentSteps.includes(stepId) ? currentSteps : [...currentSteps, stepId];
}

export const onboardingService = {
  async getDraft(): Promise<OnboardingDraft> {
    onboardingLogger.info("draft load started");
    const userId = await resolveUserId();
    const [profile, preferences, state] = await Promise.all([
      onboardingRepository.getProfile(userId),
      onboardingRepository.getPreferences(userId),
      onboardingRepository.getState(userId),
    ]);

    const draft = {
      profile: profile ?? createDefaultUserProfile(userId),
      preferences: preferences ?? createDefaultUserPreferences(userId),
      state: state ?? createDefaultOnboardingState(userId),
    };
    onboardingLogger.info("draft load completed", {
      userId,
      currentStep: draft.state.currentStep,
      started: draft.state.started,
    });
    return draft;
  },
  async startOnboarding(params: { displayName: string; language: string }): Promise<OnboardingDraft> {
    onboardingLogger.info("onboarding state creation started");
    const userId = await resolveUserId();
    const existingDraft = await this.getDraft();
    const timestamp = Date.now();

    const profile: UserProfile = {
      ...existingDraft.profile,
      displayName: params.displayName.trim(),
      language: params.language,
      updatedAt: timestamp,
    };
    const preferences: UserPreferences = {
      ...existingDraft.preferences,
      updatedAt: timestamp,
    };
    const state: OnboardingState = {
      ...existingDraft.state,
      id: userId,
      userId,
      started: true,
      skipped: false,
      completed: false,
      currentStep: Math.max(existingDraft.state.currentStep, 1),
      updatedAt: timestamp,
    };

    await Promise.all([
      onboardingRepository.saveProfile(profile),
      onboardingRepository.savePreferences(preferences),
      onboardingRepository.saveState(state),
    ]);

    onboardingLogger.info("onboarding state created", {
      userId,
      currentStep: state.currentStep,
    });

    return {
      profile,
      preferences,
      state,
    };
  },

  async saveProfile(profileUpdate: UserProfile): Promise<UserProfile> {
    onboardingLogger.info("profile save started", { userId: profileUpdate.id });
    const profile = {
      ...profileUpdate,
      updatedAt: Date.now(),
    };
    await onboardingRepository.saveProfile(profile);
    onboardingLogger.info("profile save completed", { userId: profile.id });
    return profile;
  },

  async savePreferences(preferencesUpdate: UserPreferences): Promise<UserPreferences> {
    onboardingLogger.info("preferences save started", { userId: preferencesUpdate.id });
    const preferences = {
      ...preferencesUpdate,
      updatedAt: Date.now(),
    };
    await onboardingRepository.savePreferences(preferences);
    onboardingLogger.info("preferences save completed", { userId: preferences.id });
    return preferences;
  },

  async saveProgress(params: {
    currentStep: number;
    completedStepId?: OnboardingStepId;
    existingState?: OnboardingState;
  }): Promise<OnboardingState> {
    const userId = await resolveUserId();
    const existingState =
      params.existingState ?? (await onboardingRepository.getState(userId)) ?? createDefaultOnboardingState(userId);

    const nextState: OnboardingState = {
      ...existingState,
      currentStep: params.currentStep,
      started: true,
      skipped: false,
      completedSteps: params.completedStepId
        ? mergeCompletedSteps(existingState.completedSteps, params.completedStepId)
        : existingState.completedSteps,
      updatedAt: Date.now(),
    };

    await onboardingRepository.saveState(nextState);
    onboardingLogger.info("progress save completed", {
      userId,
      currentStep: nextState.currentStep,
    });
    return nextState;
  },

  async completeOnboarding(draft: OnboardingDraft): Promise<OnboardingDraft> {
    const completedAt = Date.now();
    const profile = {
      ...draft.profile,
      updatedAt: completedAt,
    };
    const preferences = {
      ...draft.preferences,
      updatedAt: completedAt,
    };
    const state: OnboardingState = {
      ...draft.state,
      started: true,
      completed: true,
      skipped: false,
      currentStep: draft.state.currentStep,
      completedAt,
      updatedAt: completedAt,
    };

    await Promise.all([
      onboardingRepository.saveProfile(profile),
      onboardingRepository.savePreferences(preferences),
      onboardingRepository.saveState(state),
    ]);
    onboardingLogger.info("onboarding completed", {
      userId: draft.state.userId,
      currentStep: state.currentStep,
    });

    return {
      profile,
      preferences,
      state,
    };
  },
  async skipOnboarding(draft: OnboardingDraft): Promise<OnboardingDraft> {
    const skippedAt = Date.now();
    const state: OnboardingState = {
      ...draft.state,
      started: true,
      skipped: true,
      updatedAt: skippedAt,
      skippedAt,
    };

    await onboardingRepository.saveState(state);
    onboardingLogger.info("onboarding skipped", {
      userId: draft.state.userId,
      currentStep: state.currentStep,
    });

    return {
      ...draft,
      state,
    };
  },

  createDefaultDraftForCurrentUser(): Promise<OnboardingDraft> {
    return this.getDraft().catch(async () => {
      const userId = await resolveUserId();
      return createDefaultOnboardingDraft(userId);
    });
  },
};
