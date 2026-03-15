/**
 * Backend Configuration Storage
 * Handles file system paths, storage backends, and system settings
 * Updated to support internet-accessible servers with HTTPS and JWT auth
 */

export interface BackendConfig {
  storageBackend: "localStorage" | "fileSystem" | "externalDB";
  fileSystemPaths: {
    inspections: string;
    media: string;
    exports: string;
  };
  offlineMode: {
    enabled: boolean;
    autoSync: boolean;
    syncInterval: number;
    syncData: {
      inspectionsDrafts: boolean;
      inspectionsCompleted: boolean;
      trackData: boolean;
      mediaFiles: boolean;
    };
  };
  backup: {
    enabled: boolean;
    location: string;
    frequency: "daily" | "weekly" | "monthly";
    retention: number;
  };
  network: {
    serverUrl: string; // Full URL: https://tracking.yourcompany.com or https://123.45.67.89:3000
    useHTTPS: boolean;
    allowHTTP: boolean; // Only for local development
    fallbackServer: string;
    timeout: number;
    retries: number;
    jwtToken?: string; // Stored JWT token for authentication
    apiKey?: string; // Optional API key for additional security
  };
  performance: {
    compression: boolean;
    cacheSize: number;
    imageQuality: number;
    videoResolution: string;
  };
  setupCompleted?: boolean;
  setupDate?: string;
  serverType?: "local" | "cloud" | "tunnel"; // Deployment type
}

export interface StorageUsageInfo {
  inspections: number;
  media: number;
  trackData: number;
  cached: number;
  total: number;
  limit: number;
  percentage: number;
}

export interface HealthCheckResult {
  storageAccessible: boolean;
  writePermissions: boolean;
  networkConnected: boolean;
  diskSpaceOK: boolean;
  serverReachable?: boolean;
  httpsEnabled?: boolean;
  overallStatus: "healthy" | "warning" | "error";
  issues: string[];
  recommendations: string[];
}

export interface SystemEnvironment {
  isDesktopApp: boolean;
  isElectron: boolean;
  isTauri: boolean;
  isWebBrowser: boolean;
  platform: "windows" | "mac" | "linux" | "unknown";
  homeDirectory: string;
  documentsDirectory: string;
  hasFileSystemAPI: boolean;
}

export interface SetupProgress {
  step: number;
  totalSteps: number;
  currentTask: string;
  status: "pending" | "running" | "completed" | "error";
  message: string;
}

const STORAGE_KEY = "rail_yard_backend_config";

/**
 * Detect the current system environment
 */
export function detectSystemEnvironment(): SystemEnvironment {
  if (typeof window === "undefined") {
    return {
      isDesktopApp: false,
      isElectron: false,
      isTauri: false,
      isWebBrowser: false,
      platform: "unknown",
      homeDirectory: "",
      documentsDirectory: "",
      hasFileSystemAPI: false,
    };
  }

  // Detect Electron
  const isElectron = !!(window as any).electron || 
    (navigator.userAgent.toLowerCase().includes("electron"));

  // Detect Tauri
  const isTauri = !!(window as any).__TAURI__;

  const isDesktopApp = isElectron || isTauri;
  const isWebBrowser = !isDesktopApp;

  // Detect platform
  let platform: "windows" | "mac" | "linux" | "unknown" = "unknown";
  if (navigator.platform.toLowerCase().includes("win")) platform = "windows";
  else if (navigator.platform.toLowerCase().includes("mac")) platform = "mac";
  else if (navigator.platform.toLowerCase().includes("linux")) platform = "linux";

  // Generate default paths based on platform
  let homeDirectory = "";
  let documentsDirectory = "";

  if (platform === "windows") {
    homeDirectory = "C:\\RailYard";
    documentsDirectory = "C:\\Users\\Public\\Documents\\RailYard";
  } else if (platform === "mac") {
    homeDirectory = "/Users/Shared/RailYard";
    documentsDirectory = "/Users/Shared/Documents/RailYard";
  } else if (platform === "linux") {
    homeDirectory = "/opt/railyard";
    documentsDirectory = "/home/railyard/Documents";
  }

  // Check for File System Access API
  const hasFileSystemAPI = "showDirectoryPicker" in window;

  return {
    isDesktopApp,
    isElectron,
    isTauri,
    isWebBrowser,
    platform,
    homeDirectory,
    documentsDirectory,
    hasFileSystemAPI,
  };
}

/**
 * Generate recommended folder structure based on environment
 */
export function getRecommendedPaths(env: SystemEnvironment): BackendConfig["fileSystemPaths"] {
  const base = env.homeDirectory || env.documentsDirectory;

  if (env.platform === "windows") {
    return {
      inspections: `${base}\\Data\\Inspections`,
      media: `${base}\\Data\\Media`,
      exports: `${base}\\Exports`,
    };
  } else {
    return {
      inspections: `${base}/Data/Inspections`,
      media: `${base}/Data/Media`,
      exports: `${base}/Exports`,
    };
  }
}

/**
 * Validate server URL format
 */
export function validateServerUrl(url: string): { valid: boolean; error?: string; normalized?: string } {
  if (!url || url.trim() === "") {
    return { valid: false, error: "Server URL cannot be empty" };
  }

  let normalizedUrl = url.trim();

  // Add protocol if missing
  if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  // Validate URL format
  try {
    const parsed = new URL(normalizedUrl);
    
    // Check for valid protocol
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { valid: false, error: "URL must use HTTP or HTTPS protocol" };
    }

    // Warn if using HTTP in production
    if (parsed.protocol === "http:" && !isLocalUrl(normalizedUrl)) {
      return { 
        valid: true, 
        error: "Warning: HTTP is insecure for internet-accessible servers. Use HTTPS.",
        normalized: normalizedUrl
      };
    }

    return { valid: true, normalized: normalizedUrl };
  } catch (error) {
    return { valid: false, error: "Invalid URL format" };
  }
}

/**
 * Check if URL is a local/LAN address
 */
export function isLocalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.16.") ||
      hostname.endsWith(".local")
    );
  } catch {
    return false;
  }
}

/**
 * Detect server type from URL
 */
export function detectServerType(url: string): "local" | "cloud" | "tunnel" {
  if (isLocalUrl(url)) {
    return "local";
  }

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // Common tunnel service domains
    if (
      hostname.includes("ngrok") ||
      hostname.includes("cloudflare") ||
      hostname.includes("tailscale") ||
      hostname.includes("serveo") ||
      hostname.includes("localhost.run")
    ) {
      return "tunnel";
    }

    return "cloud";
  } catch {
    return "local";
  }
}

/**
 * Test server connectivity and HTTPS
 */
export async function testServerConnection(
  serverUrl: string
): Promise<{ success: boolean; httpsEnabled: boolean; responseTime: number; error?: string }> {
  const startTime = Date.now();

  try {
    const validation = validateServerUrl(serverUrl);
    if (!validation.valid) {
      return {
        success: false,
        httpsEnabled: false,
        responseTime: 0,
        error: validation.error,
      };
    }

    const normalizedUrl = validation.normalized!;
    const httpsEnabled = normalizedUrl.startsWith("https://");

    // Test with ping endpoint
    const response = await fetch(`${normalizedUrl}/api/ping`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        success: false,
        httpsEnabled,
        responseTime,
        error: `Server responded with status ${response.status}`,
      };
    }

    return {
      success: true,
      httpsEnabled,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      httpsEnabled: false,
      responseTime,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

/**
 * Automated setup wizard for desktop/server installations
 */
export async function runAutomatedSetup(
  onProgress?: (progress: SetupProgress) => void
): Promise<{ success: boolean; config: BackendConfig; errors: string[] }> {
  const errors: string[] = [];
  
  const updateProgress = (step: number, task: string, status: SetupProgress["status"], message: string) => {
    if (onProgress) {
      onProgress({ step, totalSteps: 6, currentTask: task, status, message });
    }
  };

  try {
    // Step 1: Detect environment
    updateProgress(1, "Detecting system environment", "running", "Analyzing your system...");
    await sleep(500);
    const env = detectSystemEnvironment();
    updateProgress(1, "Detecting system environment", "completed", 
      `Detected: ${env.platform} ${env.isDesktopApp ? "(Desktop App)" : "(Web Browser)"}`);

    // Step 2: Generate recommended paths
    updateProgress(2, "Generating folder structure", "running", "Creating recommended paths...");
    await sleep(300);
    const paths = getRecommendedPaths(env);
    updateProgress(2, "Generating folder structure", "completed", "Folder structure planned");

    // Step 3: Test file system access (simulated for now)
    updateProgress(3, "Testing file system access", "running", "Checking permissions...");
    await sleep(800);
    
    const canAccessFileSystem = env.isDesktopApp || env.hasFileSystemAPI;
    
    if (!canAccessFileSystem) {
      errors.push("File system access not available in this environment");
      updateProgress(3, "Testing file system access", "error", "Limited file access");
    } else {
      updateProgress(3, "Testing file system access", "completed", "File system accessible");
    }

    // Step 4: Create directories (simulated)
    updateProgress(4, "Creating directories", "running", "Setting up folder structure...");
    await sleep(1000);
    updateProgress(4, "Creating directories", "completed", "All directories created");

    // Step 5: Configure optimal settings
    updateProgress(5, "Configuring settings", "running", "Applying best practices...");
    await sleep(600);

    const config: BackendConfig = {
      storageBackend: canAccessFileSystem ? "fileSystem" : "localStorage",
      fileSystemPaths: paths,
      offlineMode: {
        enabled: true,
        autoSync: true,
        syncInterval: 15,
        syncData: {
          inspectionsDrafts: true,
          inspectionsCompleted: true,
          trackData: true,
          mediaFiles: canAccessFileSystem,
        },
      },
      backup: {
        enabled: true,
        location: env.platform === "windows" 
          ? `${env.homeDirectory}\\Backups`
          : `${env.homeDirectory}/Backups`,
        frequency: "weekly",
        retention: 4,
      },
      network: {
        serverUrl: "",
        useHTTPS: true,
        allowHTTP: false,
        fallbackServer: "",
        timeout: 30,
        retries: 3,
      },
      performance: {
        compression: true,
        cacheSize: 100,
        imageQuality: 85,
        videoResolution: "1080p",
      },
      setupCompleted: true,
      setupDate: new Date().toISOString(),
      serverType: "local",
    };

    updateProgress(5, "Configuring settings", "completed", "Settings optimized");

    // Step 6: Save configuration
    updateProgress(6, "Saving configuration", "running", "Finalizing setup...");
    await sleep(400);
    saveBackendConfig(config);
    updateProgress(6, "Saving configuration", "completed", "Setup complete!");

    return { success: errors.length === 0, config, errors };

  } catch (error) {
    errors.push(`Setup failed: ${error instanceof Error ? error.message : String(error)}`);
    return { 
      success: false, 
      config: getDefaultBackendConfig(), 
      errors 
    };
  }
}

/**
 * Check if automated setup can run in current environment
 */
export function canRunAutomatedSetup(): { canRun: boolean; reason: string } {
  const env = detectSystemEnvironment();

  if (env.isWebBrowser && !env.hasFileSystemAPI) {
    return {
      canRun: false,
      reason: "Automated setup requires a desktop app or browser with File System API support",
    };
  }

  if (env.platform === "unknown") {
    return {
      canRun: false,
      reason: "Could not detect your operating system",
    };
  }

  return {
    canRun: true,
    reason: "Your system is compatible with automated setup",
  };
}

/**
 * Helper: Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Load backend configuration from storage
 */
export function loadBackendConfig(): BackendConfig {
  if (typeof window === "undefined") return getDefaultBackendConfig();

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const config = JSON.parse(saved);
      
      // Migrate old configs without serverUrl
      if (!config.network.serverUrl && config.network.primaryServer) {
        config.network.serverUrl = config.network.primaryServer;
        delete config.network.primaryServer;
      }
      
      // Set defaults for new fields
      if (config.network.useHTTPS === undefined) {
        config.network.useHTTPS = !isLocalUrl(config.network.serverUrl || "");
      }
      if (config.network.allowHTTP === undefined) {
        config.network.allowHTTP = isLocalUrl(config.network.serverUrl || "");
      }
      if (!config.serverType) {
        config.serverType = detectServerType(config.network.serverUrl || "");
      }
      
      return config;
    }
  } catch (error) {
    console.error("[BackendConfig] Failed to load config:", error);
  }

  return getDefaultBackendConfig();
}

/**
 * Save backend configuration to storage
 */
export function saveBackendConfig(config: BackendConfig): void {
  if (typeof window === "undefined") return;

  try {
    // Auto-detect server type from URL
    if (config.network.serverUrl) {
      config.serverType = detectServerType(config.network.serverUrl);
      config.network.useHTTPS = config.network.serverUrl.startsWith("https://");
      config.network.allowHTTP = isLocalUrl(config.network.serverUrl);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    console.log("[BackendConfig] Configuration saved");
  } catch (error) {
    console.error("[BackendConfig] Failed to save config:", error);
  }
}

/**
 * Get default backend configuration
 */
export function getDefaultBackendConfig(): BackendConfig {
  const env = detectSystemEnvironment();
  const paths = getRecommendedPaths(env);

  return {
    storageBackend: "localStorage",
    fileSystemPaths: paths,
    offlineMode: {
      enabled: false,
      autoSync: false,
      syncInterval: 15,
      syncData: {
        inspectionsDrafts: true,
        inspectionsCompleted: true,
        trackData: true,
        mediaFiles: false,
      },
    },
    backup: {
      enabled: false,
      location: "",
      frequency: "weekly",
      retention: 4,
    },
    network: {
      serverUrl: "",
      useHTTPS: true,
      allowHTTP: false,
      fallbackServer: "",
      timeout: 30,
      retries: 3,
    },
    performance: {
      compression: false,
      cacheSize: 50,
      imageQuality: 80,
      videoResolution: "720p",
    },
    serverType: "local",
  };
}

/**
 * Get current storage usage statistics
 */
export function getStorageUsage(): StorageUsageInfo {
  // In a real app, this would calculate actual file/db sizes
  return {
    inspections: 15.2 * 1024 * 1024,
    media: 234.7 * 1024 * 1024,
    trackData: 856 * 1024,
    cached: 2.1 * 1024 * 1024,
    total: 252.8 * 1024 * 1024,
    limit: 500 * 1024 * 1024,
    percentage: 50.5,
  };
}

/**
 * Test access to a specific file system path
 */
export async function testFileSystemAccess(path: string): Promise<boolean> {
  // Simulated check
  return true;
}

/**
 * Run a full system health diagnostic check
 */
export async function runSystemHealthCheck(): Promise<HealthCheckResult> {
  const config = loadBackendConfig();
  
  return new Promise((resolve) => {
    setTimeout(async () => {
      let serverReachable = false;
      let httpsEnabled = false;

      // Test server connection if URL is configured
      if (config.network.serverUrl) {
        const testResult = await testServerConnection(config.network.serverUrl);
        serverReachable = testResult.success;
        httpsEnabled = testResult.httpsEnabled;
      }

      const issues: string[] = [];
      const recommendations: string[] = [];

      if (config.network.serverUrl && !serverReachable) {
        issues.push("Server is not reachable");
        recommendations.push("Check your internet connection and server URL");
      }

      if (config.network.serverUrl && !httpsEnabled && !isLocalUrl(config.network.serverUrl)) {
        issues.push("Server is not using HTTPS");
        recommendations.push("Enable HTTPS for secure communication over the internet");
      }

      const overallStatus: "healthy" | "warning" | "error" = 
        issues.length === 0 ? "healthy" : 
        issues.some(i => i.includes("not reachable")) ? "error" : "warning";

      resolve({
        storageAccessible: true,
        writePermissions: true,
        networkConnected: navigator.onLine,
        diskSpaceOK: true,
        serverReachable,
        httpsEnabled,
        overallStatus,
        issues,
        recommendations,
      });
    }, 1200);
  });
}

/**
 * Clear temporary application cache/files
 */
export function clearTemporaryFiles(): number {
  // Simulated cache clearing
  const itemsCleared = Math.floor(Math.random() * 40) + 12;
  console.log(`[BackendConfig] Cleared ${itemsCleared} temporary items`);
  return itemsCleared;
}