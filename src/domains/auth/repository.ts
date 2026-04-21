import { db, ensureDatabaseReady } from "@/db/dexie";
import { normalizeEmail, normalizeIdentifier } from "@/domains/auth/auth.utils";
import { AuthUser } from "@/domains/auth/types";
import { createLogger } from "@/utils/logger";

const dbLogger = createLogger("db");

export const authRepository = {
  async countUsers(): Promise<number> {
    await ensureDatabaseReady();
    return db.authUsers.count();
  },
  async getUserById(id: string): Promise<AuthUser | undefined> {
    await ensureDatabaseReady();

    try {
      return await db.authUsers.get(id);
    } catch (error) {
      dbLogger.error("failed to fetch auth user by id", { error, id });
      throw error;
    }
  },
  async getUserByEmail(email: string): Promise<AuthUser | undefined> {
    await ensureDatabaseReady();
    const normalizedEmail = normalizeEmail(email);

    try {
      return await db.authUsers.where("email").equals(normalizedEmail).first();
    } catch (error) {
      dbLogger.error("failed to fetch auth user by email", { error, email: normalizedEmail });
      throw error;
    }
  },
  async getUserByIdentifier(identifier: string): Promise<AuthUser | undefined> {
    await ensureDatabaseReady();
    const normalizedValue = normalizeIdentifier(identifier);

    try {
      return await db.authUsers
        .filter((user) => {
          const localPart = user.email.split("@")[0]?.toLowerCase();
          const legacyUsername = (user as AuthUser & { username?: string }).username?.toLowerCase();

          return (
            user.email.toLowerCase() === normalizedValue ||
            localPart === normalizedValue ||
            legacyUsername === normalizedValue
          );
        })
        .first();
    } catch (error) {
      dbLogger.error("failed to fetch auth user by identifier", {
        error,
        identifier: normalizedValue,
      });
      throw error;
    }
  },
  async createUser(user: AuthUser): Promise<string> {
    await ensureDatabaseReady();

    try {
      await db.authUsers.add(user);
      return user.id;
    } catch (error) {
      dbLogger.error("failed to create auth user", {
        error,
        email: user.email,
        userId: user.id,
      });
      throw error;
    }
  },
  async emailExists(email: string): Promise<boolean> {
    const existingUser = await this.getUserByEmail(email);
    return Boolean(existingUser);
  },
  async deleteUserById(id: string): Promise<void> {
    await ensureDatabaseReady();

    try {
      await db.authUsers.delete(id);
    } catch (error) {
      dbLogger.error("failed to delete auth user", { error, userId: id });
      throw error;
    }
  },
};
