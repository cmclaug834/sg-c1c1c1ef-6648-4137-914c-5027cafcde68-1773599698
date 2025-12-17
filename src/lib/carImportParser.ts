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
  detectedType?: "BOX" | "TANK" | "FLAT";
}

export interface ExtractedCarData {
  recognized: ExtractedCar[];
  unrecognized: string[];
}

/**
 * Detect car type from reporting mark
 * Common tank car marks: UTLX, TILX, NATX, GATX, SHPX, ACFX, PROCX, etc.
 * Common box car marks: TBOX, ATSF, BN, UP, CN, CP, etc.
 * Common flat car marks: DTTX, TTX, RTTX, BNSF, UP, etc.
 */
function detectCarType(reportingMark: string): "BOX" | "TANK" | "FLAT" {
  const mark = reportingMark.toUpperCase();
  
  // Tank car indicators (usually have X suffix or known tank operators)
  const tankIndicators = ["UTLX", "TILX", "NATX", "GATX", "SHPX", "ACFX", "PROCX", "DOWX", "UNPX", "ADMX"];
  if (tankIndicators.some(t => mark.startsWith(t))) {
    return "TANK";
  }
  
  // Flat car indicators (intermodal, spine, well cars)
  const flatIndicators = ["DTTX", "TTX", "RTTX", "ITTX"];
  if (flatIndicators.some(f => mark.startsWith(f))) {
    return "FLAT";
  }
  
  // Default to BOX for general freight cars
  return "BOX";
}

/**
 * Extract car IDs from raw text
 * Accepts formats: MARK123456, MARK 123456, etc.
 * Returns normalized IDs: MARK 123456 (with space)
 */
export function extractCarIds(rawText: string): ExtractedCarData {
  const lines = rawText.split(/[\r\n]+/);
  const carMap = new Map<string, { source: string; reportingMark: string }>();
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
          carMap.set(normalized, { source: trimmed, reportingMark: mark });
        }
      });
    } else {
      // Line didn't match pattern - add to unrecognized if not empty
      if (trimmed.length > 0) {
        unrecognized.push(trimmed);
      }
    }
  });

  const recognized: ExtractedCar[] = Array.from(carMap.entries()).map(([normalized, data]) => ({
    normalized,
    source: data.source,
    detectedType: detectCarType(data.reportingMark),
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