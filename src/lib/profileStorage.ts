/**
 * Profile Storage
 * Manages crew profile history and selection
 */

export interface CrewProfile {
  name: string;
  crewId: string;
  lastUsedAt: string;
}

const STORAGE_KEY = "rail_yard_profiles";

export const profileStorage = {
  /**
   * Get all profiles sorted by most recently used
   */
  getProfiles: (): CrewProfile[] => {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const profiles: CrewProfile[] = JSON.parse(data);
      return profiles.sort((a, b) => 
        new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
      );
    } catch (error) {
      console.error("Failed to load profiles:", error);
      return [];
    }
  },

  /**
   * Upsert a profile (add new or update existing)
   */
  upsertProfile: (name: string, crewId: string): void => {
    if (typeof window === "undefined") return;
    try {
      const profiles = profileStorage.getProfiles();
      const now = new Date().toISOString();
      
      // Find existing profile with same name+crewId
      const existingIndex = profiles.findIndex(
        p => p.name === name && p.crewId === crewId
      );

      if (existingIndex >= 0) {
        // Update existing profile's lastUsedAt
        profiles[existingIndex].lastUsedAt = now;
      } else {
        // Add new profile
        profiles.push({ name, crewId, lastUsedAt: now });
      }

      // Keep only last 10 profiles
      const trimmed = profiles
        .sort((a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime())
        .slice(0, 10);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
  },

  /**
   * Get the most recently used profile
   */
  getMostRecent: (): CrewProfile | null => {
    const profiles = profileStorage.getProfiles();
    return profiles.length > 0 ? profiles[0] : null;
  },
};