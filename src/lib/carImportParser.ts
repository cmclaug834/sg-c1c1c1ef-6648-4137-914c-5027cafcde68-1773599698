/**
 * Car Import Parser
 * Extracts car IDs from CN paste data (forgiving format)
 */

interface ImportBuckets {
  toAdd: string[];
  skipped: string[];
  unrecognized: string[];
}

/**
 * Extract car IDs from raw text
 * Accepts formats: MARK123456, MARK 123456, etc.
 * Returns normalized IDs: MARK 123456 (with space)
 */
export function extractCarIds(rawText: string): string[] {
  const lines = rawText.split(/[\r\n]+/);
  const carIds = new Set<string>();
  const unrecognized: string[] = [];

  // Regex to match reporting mark (2-4 letters) + number (3-7 digits)
  // Allows optional space/separator between mark and number
  const carPattern = /([A-Za-z]{2,4})[\s\-_]*(\d{3,7})/g;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Try to extract all car IDs from this line
    const matches = Array.from(trimmed.matchAll(carPattern));
    
    if (matches.length > 0) {
      matches.forEach(match => {
        const mark = match[1].toUpperCase();
        const number = match[2];
        const normalized = `${mark} ${number}`;
        carIds.add(normalized);
      });
    } else {
      // Line didn't match pattern - add to unrecognized if not empty
      if (trimmed.length > 0) {
        unrecognized.push(trimmed);
      }
    }
  });

  return {
    recognized: Array.from(carIds),
    unrecognized,
  };
}

/**
 * Compute import buckets: what to add, what to skip, what's unrecognized
 */
export function computeImportBuckets(
  incoming: string[],
  existingToday: string[],
  existingSnapshot: string[] = []
): ImportBuckets {
  // Normalize all existing car numbers for comparison
  const blocked = new Set([
    ...existingToday.map(id => id.toUpperCase().trim()),
    ...existingSnapshot.map(id => id.toUpperCase().trim()),
  ]);

  const toAdd: string[] = [];
  const skipped: string[] = [];

  incoming.forEach(carId => {
    const normalized = carId.toUpperCase().trim();
    if (blocked.has(normalized)) {
      skipped.push(carId);
    } else {
      toAdd.push(carId);
      blocked.add(normalized); // Prevent duplicates within incoming list
    }
  });

  return {
    toAdd,
    skipped,
    unrecognized: [], // Populated by extractCarIds
  };
}