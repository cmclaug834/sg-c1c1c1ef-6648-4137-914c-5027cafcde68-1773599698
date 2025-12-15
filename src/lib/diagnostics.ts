import { Track } from "@/types";

export interface TrackDiagnostic {
  trackId: string;
  trackName: string;
  carsLength: number;
  storedTotalCars: number;
  storedConfirmedCars: number;
  computedConfirmedCars: number;
  mismatchFlags: {
    totalMismatch: boolean;
    confirmedMismatch: boolean;
  };
}

export interface DebugLogEntry {
  timestamp: string;
  action: string;
  diagnostic: TrackDiagnostic;
  pendingConfirmations: number;
  pendingUnconfirmations: number;
}

/**
 * Diagnose track data integrity
 * Checks if stored counts match actual array lengths/statuses
 */
export function diagnoseTrackIntegrity(track: Track): TrackDiagnostic {
  const carsLength = track.cars.length;
  const computedConfirmedCars = track.cars.filter(c => c.status === "confirmed").length;
  
  const totalMismatch = track.totalCars !== carsLength;
  const confirmedMismatch = track.confirmedCars !== computedConfirmedCars;

  return {
    trackId: track.id,
    trackName: track.name,
    carsLength,
    storedTotalCars: track.totalCars,
    storedConfirmedCars: track.confirmedCars,
    computedConfirmedCars,
    mismatchFlags: {
      totalMismatch,
      confirmedMismatch,
    },
  };
}

/**
 * Log a diagnostic entry to console and localStorage
 */
export function logDiagnostic(
  action: string,
  track: Track,
  pendingConfirmations: number = 0,
  pendingUnconfirmations: number = 0
): void {
  const diagnostic = diagnoseTrackIntegrity(track);
  
  const entry: DebugLogEntry = {
    timestamp: new Date().toISOString(),
    action,
    diagnostic,
    pendingConfirmations,
    pendingUnconfirmations,
  };

  // Log to console
  console.log(`[DIAGNOSTIC] ${action}`, {
    ...entry,
    mismatches: diagnostic.mismatchFlags.totalMismatch || diagnostic.mismatchFlags.confirmedMismatch
      ? "⚠️ MISMATCH DETECTED"
      : "✓ OK",
  });

  // Persist to localStorage
  try {
    const existingLogs = JSON.parse(localStorage.getItem("rail_yard_debug_logs") || "[]");
    const updatedLogs = [...existingLogs, entry];
    
    // Keep only last 100 entries to prevent storage bloat
    const trimmedLogs = updatedLogs.slice(-100);
    
    localStorage.setItem("rail_yard_debug_logs", JSON.stringify(trimmedLogs));
  } catch (error) {
    console.error("[DIAGNOSTIC] Failed to persist log:", error);
  }
}

/**
 * Get all debug logs from localStorage
 */
export function getDebugLogs(): DebugLogEntry[] {
  try {
    return JSON.parse(localStorage.getItem("rail_yard_debug_logs") || "[]");
  } catch (error) {
    console.error("[DIAGNOSTIC] Failed to read logs:", error);
    return [];
  }
}

/**
 * Clear all debug logs
 */
export function clearDebugLogs(): void {
  try {
    localStorage.removeItem("rail_yard_debug_logs");
    console.log("[DIAGNOSTIC] Debug logs cleared");
  } catch (error) {
    console.error("[DIAGNOSTIC] Failed to clear logs:", error);
  }
}

/**
 * Export logs to clipboard
 */
export async function copyLogsToClipboard(): Promise<boolean> {
  try {
    const logs = getDebugLogs();
    const formatted = JSON.stringify(logs, null, 2);
    await navigator.clipboard.writeText(formatted);
    return true;
  } catch (error) {
    console.error("[DIAGNOSTIC] Failed to copy logs:", error);
    return false;
  }
}