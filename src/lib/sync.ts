/**
 * Multi-Device Sync Engine
 * Handles periodic synchronization between devices
 */

import { Inspection } from "@/types/inspection";
import { Track } from "@/types";

export interface SyncConfig {
  enabled: boolean;
  serverUrl: string; // e.g., "http://192.168.1.100:3000" or "https://api.railyard.com"
  syncInterval: number; // seconds
  autoSync: boolean;
  lastSyncAt?: string;
  deviceId: string;
}

export interface SyncStatus {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncAt?: string;
  lastSyncSuccess: boolean;
  pendingChanges: number;
  error?: string;
}

export interface SyncChange {
  id: string;
  type: "inspection" | "track" | "user" | "config";
  action: "create" | "update" | "delete";
  data: any;
  timestamp: string;
  deviceId: string;
  synced: boolean;
}

const SYNC_CONFIG_KEY = "railyard_sync_config";
const SYNC_QUEUE_KEY = "railyard_sync_queue";
const SYNC_STATUS_KEY = "railyard_sync_status";

let syncInterval: NodeJS.Timeout | null = null;

/**
 * Load sync configuration
 */
export function loadSyncConfig(): SyncConfig {
  if (typeof window === "undefined") {
    return getDefaultSyncConfig();
  }
  
  const data = localStorage.getItem(SYNC_CONFIG_KEY);
  return data ? JSON.parse(data) : getDefaultSyncConfig();
}

/**
 * Save sync configuration
 */
export function saveSyncConfig(config: SyncConfig): void {
  localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(config));
  
  // Restart sync if enabled
  if (config.enabled && config.autoSync) {
    startPeriodicSync(config);
  } else {
    stopPeriodicSync();
  }
}

/**
 * Get default sync config
 */
function getDefaultSyncConfig(): SyncConfig {
  let deviceId = "";
  if (typeof window !== "undefined") {
    deviceId = localStorage.getItem("railyard_device_id") || "";
  }
  
  return {
    enabled: false,
    serverUrl: "",
    syncInterval: 30,
    autoSync: true,
    deviceId,
  };
}

/**
 * Get sync status
 */
export function getSyncStatus(): SyncStatus {
  if (typeof window === "undefined") {
    return {
      isConnected: false,
      isSyncing: false,
      lastSyncSuccess: false,
      pendingChanges: 0,
    };
  }
  
  const data = localStorage.getItem(SYNC_STATUS_KEY);
  return data ? JSON.parse(data) : {
    isConnected: false,
    isSyncing: false,
    lastSyncSuccess: false,
    pendingChanges: 0,
  };
}

/**
 * Save sync status
 */
function saveSyncStatus(status: SyncStatus): void {
  localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(status));
}

/**
 * Queue a change for sync
 */
export function queueChange(change: Omit<SyncChange, "timestamp" | "deviceId" | "synced">): void {
  const config = loadSyncConfig();
  const queue = getSyncQueue();
  
  const fullChange: SyncChange = {
    ...change,
    timestamp: new Date().toISOString(),
    deviceId: config.deviceId,
    synced: false,
  };
  
  queue.push(fullChange);
  saveSyncQueue(queue);
  
  // Update status
  const status = getSyncStatus();
  status.pendingChanges = queue.filter((c) => !c.synced).length;
  saveSyncStatus(status);
}

/**
 * Get sync queue
 */
function getSyncQueue(): SyncChange[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(SYNC_QUEUE_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Save sync queue
 */
function saveSyncQueue(queue: SyncChange[]): void {
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Manual sync
 */
export async function syncNow(): Promise<{ success: boolean; error?: string }> {
  const config = loadSyncConfig();
  
  if (!config.enabled || !config.serverUrl) {
    return { success: false, error: "Sync not configured" };
  }
  
  const status = getSyncStatus();
  status.isSyncing = true;
  saveSyncStatus(status);
  
  try {
    // Get pending changes
    const queue = getSyncQueue();
    const pending = queue.filter((c) => !c.synced);
    
    if (pending.length === 0) {
      // Nothing to sync, just fetch latest
      await fetchLatestData(config.serverUrl);
      
      status.isSyncing = false;
      status.isConnected = true;
      status.lastSyncAt = new Date().toISOString();
      status.lastSyncSuccess = true;
      status.error = undefined;
      saveSyncStatus(status);
      
      return { success: true };
    }
    
    // Send changes to server
    const response = await fetch(`${config.serverUrl}/api/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ changes: pending }),
    });
    
    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Mark changes as synced
    pending.forEach((change) => {
      change.synced = true;
    });
    saveSyncQueue(queue);
    
    // Apply incoming changes
    if (result.changes && result.changes.length > 0) {
      applyIncomingChanges(result.changes);
    }
    
    // Update status
    status.isSyncing = false;
    status.isConnected = true;
    status.lastSyncAt = new Date().toISOString();
    status.lastSyncSuccess = true;
    status.pendingChanges = queue.filter((c) => !c.synced).length;
    status.error = undefined;
    saveSyncStatus(status);
    
    // Update config
    config.lastSyncAt = new Date().toISOString();
    saveSyncConfig(config);
    
    return { success: true };
  } catch (error) {
    console.error("[Sync] Error:", error);
    
    status.isSyncing = false;
    status.isConnected = false;
    status.lastSyncSuccess = false;
    status.error = error instanceof Error ? error.message : "Unknown error";
    saveSyncStatus(status);
    
    return { success: false, error: status.error };
  }
}

/**
 * Fetch latest data from server
 */
async function fetchLatestData(serverUrl: string): Promise<void> {
  const response = await fetch(`${serverUrl}/api/sync/latest`);
  if (!response.ok) throw new Error("Failed to fetch latest data");
  
  const data = await response.json();
  applyIncomingChanges(data.changes || []);
}

/**
 * Apply incoming changes from server
 */
function applyIncomingChanges(changes: SyncChange[]): void {
  changes.forEach((change) => {
    try {
      switch (change.type) {
        case "inspection":
          applyInspectionChange(change);
          break;
        case "track":
          applyTrackChange(change);
          break;
        case "user":
          applyUserChange(change);
          break;
        case "config":
          applyConfigChange(change);
          break;
      }
    } catch (error) {
      console.error(`[Sync] Failed to apply change:`, change, error);
    }
  });
}

/**
 * Apply inspection change
 */
function applyInspectionChange(change: SyncChange): void {
  const inspections = JSON.parse(localStorage.getItem("gp_inspections_v1") || "[]");
  
  switch (change.action) {
    case "create":
    case "update":
      const index = inspections.findIndex((i: Inspection) => i.id === change.data.id);
      if (index >= 0) {
        inspections[index] = change.data;
      } else {
        inspections.push(change.data);
      }
      break;
    case "delete":
      const deleteIndex = inspections.findIndex((i: Inspection) => i.id === change.id);
      if (deleteIndex >= 0) {
        inspections.splice(deleteIndex, 1);
      }
      break;
  }
  
  localStorage.setItem("gp_inspections_v1", JSON.stringify(inspections));
}

/**
 * Apply track change
 */
function applyTrackChange(change: SyncChange): void {
  const tracks = JSON.parse(localStorage.getItem("gp_tracks") || "[]");
  
  switch (change.action) {
    case "create":
    case "update":
      const index = tracks.findIndex((t: Track) => t.id === change.data.id);
      if (index >= 0) {
        tracks[index] = change.data;
      } else {
        tracks.push(change.data);
      }
      break;
    case "delete":
      const deleteIndex = tracks.findIndex((t: Track) => t.id === change.id);
      if (deleteIndex >= 0) {
        tracks.splice(deleteIndex, 1);
      }
      break;
  }
  
  localStorage.setItem("gp_tracks", JSON.stringify(tracks));
}

/**
 * Apply user change
 */
function applyUserChange(change: SyncChange): void {
  // User sync handled by auth system
  console.log("[Sync] User change received:", change);
}

/**
 * Apply config change
 */
function applyConfigChange(change: SyncChange): void {
  // Config sync handled separately
  console.log("[Sync] Config change received:", change);
}

/**
 * Start periodic sync
 */
export function startPeriodicSync(config: SyncConfig): void {
  stopPeriodicSync();
  
  if (!config.enabled || !config.autoSync) return;
  
  console.log(`[Sync] Starting periodic sync every ${config.syncInterval} seconds`);
  
  syncInterval = setInterval(() => {
    syncNow().catch((error) => {
      console.error("[Sync] Periodic sync failed:", error);
    });
  }, config.syncInterval * 1000);
  
  // Initial sync
  syncNow();
}

/**
 * Stop periodic sync
 */
export function stopPeriodicSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log("[Sync] Periodic sync stopped");
  }
}

/**
 * Test server connection
 */
export async function testServerConnection(serverUrl: string): Promise<{
  success: boolean;
  latency?: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${serverUrl}/api/ping`, {
      method: "GET",
    });
    
    const latency = Date.now() - startTime;
    
    if (!response.ok) {
      return { success: false, error: `Server returned ${response.status}` };
    }
    
    return { success: true, latency };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}