/**
 * Multi-Device Sync Engine
 * Updated to support internet-accessible servers, cellular connectivity,
 * JWT authentication, and offline queuing
 */

import { Inspection } from "@/types/inspection";
import { Track } from "@/types";
import { getAuthHeader } from "./auth";

export interface SyncConfig {
  enabled: boolean;
  serverUrl: string; // e.g., "https://tracking.yourcompany.com" or "http://192.168.1.100:3000"
  syncInterval: number; // seconds
  autoSync: boolean;
  lastSyncAt?: string;
  deviceId: string;
  useHTTPS: boolean; // Force HTTPS for internet servers
  allowHTTP: boolean; // Allow HTTP for local network only
}

export interface SyncStatus {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncAt?: string;
  lastSyncSuccess: boolean;
  pendingChanges: number;
  error?: string;
  connectionType?: "wifi" | "cellular" | "ethernet" | "unknown";
  serverReachable: boolean;
}

export interface SyncChange {
  id: string;
  type: "inspection" | "track" | "user" | "config";
  action: "create" | "update" | "delete";
  data: any;
  timestamp: string;
  deviceId: string;
  synced: boolean;
  retryCount?: number;
  lastAttempt?: string;
}

const SYNC_CONFIG_KEY = "railyard_sync_config";
const SYNC_QUEUE_KEY = "railyard_sync_queue";
const SYNC_STATUS_KEY = "railyard_sync_status";
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000; // 5 seconds between retries

let syncInterval: NodeJS.Timeout | null = null;
let isCurrentlySyncing = false;

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
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("railyard_device_id", deviceId);
    }
  }
  
  return {
    enabled: false,
    serverUrl: "",
    syncInterval: 30,
    autoSync: true,
    deviceId,
    useHTTPS: true,
    allowHTTP: false, // Default to secure only
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
      serverReachable: false,
    };
  }
  
  const data = localStorage.getItem(SYNC_STATUS_KEY);
  const defaultStatus = {
    isConnected: false,
    isSyncing: false,
    lastSyncSuccess: false,
    pendingChanges: 0,
    serverReachable: false,
  };
  
  return data ? JSON.parse(data) : defaultStatus;
}

/**
 * Save sync status
 */
function saveSyncStatus(status: SyncStatus): void {
  localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(status));
}

/**
 * Detect connection type (WiFi, Cellular, etc.)
 */
function getConnectionType(): "wifi" | "cellular" | "ethernet" | "unknown" {
  if (typeof navigator === "undefined" || !("connection" in navigator)) {
    return "unknown";
  }
  
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  if (!connection) return "unknown";
  
  const type = connection.effectiveType || connection.type;
  
  if (type === "wifi") return "wifi";
  if (type === "cellular" || type === "4g" || type === "3g" || type === "2g") return "cellular";
  if (type === "ethernet") return "ethernet";
  
  return "unknown";
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
    retryCount: 0,
  };
  
  queue.push(fullChange);
  saveSyncQueue(queue);
  
  // Update status
  const status = getSyncStatus();
  status.pendingChanges = queue.filter((c) => !c.synced).length;
  saveSyncStatus(status);
  
  // Trigger immediate sync if enabled
  if (config.enabled && config.autoSync && !isCurrentlySyncing) {
    syncNow().catch(console.error);
  }
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
 * Manual sync with retry logic and offline queue support
 */
export async function syncNow(): Promise<{ success: boolean; error?: string }> {
  const config = loadSyncConfig();
  
  if (!config.enabled || !config.serverUrl) {
    return { success: false, error: "Sync not configured" };
  }
  
  // Prevent concurrent syncs
  if (isCurrentlySyncing) {
    console.log("[Sync] Sync already in progress, skipping");
    return { success: false, error: "Sync already in progress" };
  }
  
  isCurrentlySyncing = true;
  
  const status = getSyncStatus();
  status.isSyncing = true;
  status.connectionType = getConnectionType();
  saveSyncStatus(status);
  
  try {
    // Get pending changes
    const queue = getSyncQueue();
    const pending = queue.filter((c) => !c.synced && (c.retryCount || 0) < MAX_RETRY_ATTEMPTS);
    
    if (pending.length === 0) {
      // Nothing to sync, just fetch latest
      await fetchLatestData(config.serverUrl);
      
      status.isSyncing = false;
      status.isConnected = true;
      status.lastSyncAt = new Date().toISOString();
      status.lastSyncSuccess = true;
      status.error = undefined;
      status.serverReachable = true;
      saveSyncStatus(status);
      
      isCurrentlySyncing = false;
      return { success: true };
    }
    
    // Send changes to server with auth headers
    const authHeaders = getAuthHeader();
    const response = await fetch(`${config.serverUrl}/api/sync`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({ 
        changes: pending,
        deviceId: config.deviceId,
      }),
    });
    
    if (!response.ok) {
      // Handle auth errors
      if (response.status === 401) {
        throw new Error("Authentication failed - please login again");
      }
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
    status.serverReachable = true;
    saveSyncStatus(status);
    
    // Update config
    config.lastSyncAt = new Date().toISOString();
    saveSyncConfig(config);
    
    isCurrentlySyncing = false;
    return { success: true };
  } catch (error) {
    console.error("[Sync] Error:", error);
    
    // Update retry counts for failed items
    const queue = getSyncQueue();
    queue.forEach((change) => {
      if (!change.synced) {
        change.retryCount = (change.retryCount || 0) + 1;
        change.lastAttempt = new Date().toISOString();
      }
    });
    saveSyncQueue(queue);
    
    status.isSyncing = false;
    status.isConnected = false;
    status.lastSyncSuccess = false;
    status.error = error instanceof Error ? error.message : "Unknown error";
    status.serverReachable = false;
    saveSyncStatus(status);
    
    isCurrentlySyncing = false;
    
    // Schedule retry for failed items
    if (config.autoSync) {
      setTimeout(() => {
        syncNow().catch(console.error);
      }, RETRY_DELAY_MS);
    }
    
    return { success: false, error: status.error };
  }
}

/**
 * Fetch latest data from server
 */
async function fetchLatestData(serverUrl: string): Promise<void> {
  const authHeaders = getAuthHeader();
  const response = await fetch(`${serverUrl}/api/sync/latest`, {
    headers: authHeaders,
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication failed - please login again");
    }
    throw new Error("Failed to fetch latest data");
  }
  
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
  isCurrentlySyncing = false;
}

/**
 * Test server connection with enhanced diagnostics
 */
export async function testServerConnection(serverUrl: string): Promise<{
  success: boolean;
  latency?: number;
  httpsEnabled?: boolean;
  error?: string;
  serverVersion?: string;
  connectionType?: string;
}> {
  const startTime = Date.now();
  
  try {
    const authHeaders = getAuthHeader();
    const response = await fetch(`${serverUrl}/api/ping`, {
      method: "GET",
      headers: authHeaders,
    });
    
    const latency = Date.now() - startTime;
    
    if (!response.ok) {
      return { 
        success: false, 
        error: `Server returned ${response.status}`,
        latency,
      };
    }
    
    const data = await response.json();
    
    return { 
      success: true, 
      latency,
      httpsEnabled: serverUrl.startsWith("https://"),
      serverVersion: data.version,
      connectionType: getConnectionType(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Connection failed",
      connectionType: getConnectionType(),
    };
  }
}

/**
 * Clear sync queue (useful for debugging)
 */
export function clearSyncQueue(): void {
  localStorage.removeItem(SYNC_QUEUE_KEY);
  const status = getSyncStatus();
  status.pendingChanges = 0;
  saveSyncStatus(status);
}

/**
 * Get failed sync items for manual review
 */
export function getFailedSyncItems(): SyncChange[] {
  const queue = getSyncQueue();
  return queue.filter((c) => !c.synced && (c.retryCount || 0) >= MAX_RETRY_ATTEMPTS);
}

/**
 * Retry failed sync items
 */
export async function retryFailedItems(): Promise<{ success: boolean; retriedCount: number }> {
  const queue = getSyncQueue();
  let retriedCount = 0;
  
  queue.forEach((change) => {
    if (!change.synced && (change.retryCount || 0) >= MAX_RETRY_ATTEMPTS) {
      change.retryCount = 0;
      retriedCount++;
    }
  });
  
  saveSyncQueue(queue);
  
  if (retriedCount > 0) {
    const result = await syncNow();
    return { success: result.success, retriedCount };
  }
  
  return { success: true, retriedCount: 0 };
}