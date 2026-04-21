import { db, ensureDatabaseReady } from "@/db/dexie";
import { OnboardingState, UserPreferences, UserProfile } from "@/domains/onboarding/types";
import { createLogger } from "@/utils/logger";

const dbLogger = createLogger("db");

export const onboardingRepository = {
  async getProfile(id: string): Promise<UserProfile | undefined> {
    await ensureDatabaseReady();

    try {
      return await db.userProfiles.get(id);
    } catch (error) {
      dbLogger.error("failed to load onboarding profile", { error, userId: id });
      throw error;
    }
  },
  async saveProfile(profile: UserProfile): Promise<string> {
    await ensureDatabaseReady();

    try {
      return await db.userProfiles.put(profile);
    } catch (error) {
      dbLogger.error("failed to save onboarding profile", {
        error,
        userId: profile.id,
      });
      throw error;
    }
  },
  async getPreferences(id: string): Promise<UserPreferences | undefined> {
    await ensureDatabaseReady();

    try {
      return await db.userPreferences.get(id);
    } catch (error) {
      dbLogger.error("failed to load onboarding preferences", { error, userId: id });
      throw error;
    }
  },
  async savePreferences(preferences: UserPreferences): Promise<string> {
    await ensureDatabaseReady();

    try {
      return await db.userPreferences.put(preferences);
    } catch (error) {
      dbLogger.error("failed to save onboarding preferences", {
        error,
        userId: preferences.id,
      });
      throw error;
    }
  },
  async getState(id: string): Promise<OnboardingState | undefined> {
    await ensureDatabaseReady();

    try {
      return await db.onboardingStates.get(id);
    } catch (error) {
      dbLogger.error("failed to load onboarding state", { error, userId: id });
      throw error;
    }
  },
  async saveState(state: OnboardingState): Promise<string> {
    await ensureDatabaseReady();

    try {
      return await db.onboardingStates.put(state);
    } catch (error) {
      dbLogger.error("failed to save onboarding state", {
        error,
        userId: state.userId,
        currentStep: state.currentStep,
      });
      throw error;
    }
  },
  async deleteDraft(id: string): Promise<void> {
    await ensureDatabaseReady();

    try {
      await Promise.all([
        db.userProfiles.delete(id),
        db.userPreferences.delete(id),
        db.onboardingStates.delete(id),
      ]);
    } catch (error) {
      dbLogger.error("failed to delete onboarding draft", { error, userId: id });
      throw error;
    }
  },
};
