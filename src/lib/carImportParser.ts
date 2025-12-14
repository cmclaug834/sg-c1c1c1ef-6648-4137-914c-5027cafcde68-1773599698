/**
 * Car Import Parser
 * Extracts car IDs from CN paste data (forgiving format)
 */

export interface ImportBuckets {
  toAdd: string[];
  skipped: string[];
  unrecognized: string[];
}

export interface ExtractedCar {
  normalized: string;
  source: string;
}

export interface ExtractedCarData {
  recognized: ExtractedCar[];
  unrecognized: string[];
}

/**
 * Extract car IDs from raw text
 * Accepts formats: MARK123456, MARK 123456, etc.
 * Returns normalized IDs: MARK 123456 (with space)
 */
export function extractCarIds(rawText: string): ExtractedCarData {
  const lines = rawText.split(/[\r\n]+/);
  const carMap = new Map<string, string>(); // normalized -> source
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
        // Store first occurrence of each normalized ID with its source line
        if (!carMap.has(normalized)) {
          carMap.set(normalized, trimmed);
        }
      });
    } else {
      // Line didn't match pattern - add to unrecognized if not empty
      if (trimmed.length > 0) {
        unrecognized.push(trimmed);
      }
    }
  });

  const recognized: ExtractedCar[] = Array.from(carMap.entries()).map(([normalized, source]) => ({
    normalized,
    source,
  }));

  return {
    recognized,
    unrecognized,
  };
}

/**
 * Compute import buckets: what to add, what to skip, what's unrecognized
 */
export function computeImportBuckets(
  incoming: ExtractedCar[],
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

  incoming.forEach(car => {
    const normalized = car.normalized.toUpperCase().trim();
    if (blocked.has(normalized)) {
      skipped.push(car.normalized);
    } else {
      toAdd.push(car.normalized);
      blocked.add(normalized); // Prevent duplicates within incoming list
    }
  });

  return {
    toAdd,
    skipped,
    unrecognized: [], // Populated by extractCarIds
  };
}