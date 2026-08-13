export interface SavedAddress {
  address: string;
  category: string;
  timestamp?: number;
}

export const DEFAULT_CATEGORY = "General";

export const PREDEFINED_CATEGORIES = [
  "General",
  "Work",
  "Home",
  "Favorite",
  "Other",
];

/**
 * Migrate old string[] format to new SavedAddress[] format
 */
export const migrateSavedAddresses = (
  data: unknown,
): SavedAddress[] => {
  if (!Array.isArray(data)) return [];

  return data
    .map((item): SavedAddress | null => {
      // Already in new format
      if (
        item &&
        typeof item === "object" &&
        "address" in item &&
        "category" in item
      ) {
        return item as SavedAddress;
      }

      // Old string format - migrate to new format
      if (typeof item === "string" && item.trim()) {
        return {
          address: item.trim(),
          category: DEFAULT_CATEGORY,
          timestamp: Date.now(),
        };
      }

      return null;
    })
    .filter((item): item is SavedAddress => !!item);
};
