import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { ArrowLeft, Wifi, WifiOff, Smartphone, Users, RefreshCw, Copy, Check, Globe, Server, QrCode, UserPlus, Shield, Clock, AlertCircle, ExternalLink, Zap } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { loadSyncConfig, saveSyncConfig, testServerConnection, getSyncStatus, syncNow } from "@/lib/sync";
import { getUsers, saveUser, deleteUser, initializeAuth } from "@/lib/auth";
import { loadBackendConfig, saveBackendConfig, validateServerUrl, isLocalUrl, detectServerType } from "@/lib/backendConfig";
import type { User } from "@/types/auth";

export default function NetworkServerSettings() {
  const router = useRouter();
  const [config, setConfig] = useState(loadSyncConfig());
  const [backendConfig, setBackendConfig] = useState(loadBackendConfig());
  const [syncStatus, setSyncStatus] = useState(getSyncStatus());
  const [serverEnabled, setServerEnabled] = useState(false);
  const [serverUrl, setServerUrl] = useState("");
  const [showQRCode, setShowQRCode] = useState(false);
  const [copiedURL, setCopiedURL] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    displayName: "",
    role: "inspector" as "admin" | "inspector" | "viewer",
    password: "",
  });
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{ success: boolean; httpsEnabled?: boolean; latency?: number; error?: string } | null>(null);
  const [urlValidation, setUrlValidation] = useState<{ valid: boolean; error?: string } | null>(null);

  useEffect(() => {
    // Initialize auth system
    initializeAuth();
    loadUsers();
    
    // Load existing server URL
    const savedConfig = loadSyncConfig();
    const savedBackendConfig = loadBackendConfig();
    
    if (savedConfig.enabled && savedConfig.serverUrl) {
      setServerEnabled(true);
      setServerUrl(savedConfig.serverUrl);
    } else if (savedBackendConfig.network.serverUrl) {
      setServerUrl(savedBackendConfig.network.serverUrl);
    }
    
    // Periodic sync status update
    const interval = setInterval(() => {
      setSyncStatus(getSyncStatus());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const loadUsers = () => {
    const allUsers = getUsers();
    setUsers(allUsers);
  };

  const handleServerUrlChange = (url: string) => {
    setServerUrl(url);
    
    // Validate URL as user types
    if (url.trim()) {
      const validation = validateServerUrl(url);
      setUrlValidation(validation);
    } else {
      setUrlValidation(null);
    }
  };

  const handleEnableServer = () => {
    if (!serverEnabled) {
      // Enabling server - validate URL first
      if (!serverUrl.trim()) {
        alert("Please enter a server URL first");
        return;
      }
      
      const validation = validateServerUrl(serverUrl);
      if (!validation.valid) {
        alert(validation.error || "Invalid server URL");
        return;
      }
      
      const normalizedUrl = validation.normalized!;
      const serverType = detectServerType(normalizedUrl);
      const useHTTPS = normalizedUrl.startsWith("https://");
      
      // Update sync config
      const updatedConfig = {
        ...config,
        enabled: true,
        serverUrl: normalizedUrl,
        autoSync: true,
      };
      saveSyncConfig(updatedConfig);
      setConfig(updatedConfig);
      
      // Update backend config
      const updatedBackendConfig = {
        ...backendConfig,
        network: {
          ...backendConfig.network,
          serverUrl: normalizedUrl,
          useHTTPS,
          allowHTTP: isLocalUrl(normalizedUrl),
        },
        serverType,
      };
      saveBackendConfig(updatedBackendConfig);
      setBackendConfig(updatedBackendConfig);
      
      setServerEnabled(true);
      setServerUrl(normalizedUrl);
      
      console.log("[Network] Server enabled:", normalizedUrl, "Type:", serverType, "HTTPS:", useHTTPS);
    } else {
      // Disable server
      const updatedConfig = {
        ...config,
        enabled: false,
        serverUrl: "",
        autoSync: false,
      };
      saveSyncConfig(updatedConfig);
      setConfig(updatedConfig);
      
      const updatedBackendConfig = {
        ...backendConfig,
        network: {
          ...backendConfig.network,
          serverUrl: "",
        },
      };
      saveBackendConfig(updatedBackendConfig);
      setBackendConfig(updatedBackendConfig);
      
      setServerEnabled(false);
    }
  };

  const handleTestConnection = async () => {
    if (!serverUrl.trim()) {
      alert("Please enter a server URL first");
      return;
    }
    
    setTestingConnection(true);
    setConnectionResult(null);
    
    const result = await testServerConnection(serverUrl);
    
    setConnectionResult(result);
    setTestingConnection(false);
  };

  const handleManualSync = async () => {
    await syncNow();
    setSyncStatus(getSyncStatus());
  };

  const handleCopyURL = () => {
    navigator.clipboard.writeText(serverUrl);
    setCopiedURL(true);
    setTimeout(() => setCopiedURL(false), 2000);
  };

  const handleAddUser = () => {
    if (!newUser.username || !newUser.displayName || !newUser.password) {
      alert("Please fill all fields");
      return;
    }
    
    const user: User = {
      id: `user-${Date.now()}`,
      username: newUser.username,
      displayName: newUser.displayName,
      role: newUser.role,
      createdAt: new Date().toISOString(),
      isActive: true,
    };
    
    saveUser(user, newUser.password);
    loadUsers();
    
    // Reset form
    setNewUser({
      username: "",
      displayName: "",
      role: "inspector",
      password: "",
    });
    setShowAddUser(false);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm("Delete this user? They will lose access to the system.")) {
      deleteUser(userId);
      loadUsers();
    }
  };

  const generateQRCodeData = () => {
    return JSON.stringify({
      serverUrl: serverUrl,
      setupType: "mobile",
      timestamp: new Date().toISOString(),
    });
  };

  const getServerTypeInfo = () => {
    if (!serverUrl) return { label: "Not Configured", color: "zinc" };
    
    const type = detectServerType(serverUrl);
    const isHTTPS = serverUrl.startsWith("https://");
    
    if (type === "local") {
      return { 
        label: "Local Network", 
        color: "blue",
        description: "Only accessible on same WiFi network"
      };
    } else if (type === "tunnel") {
      return { 
        label: "Tunnel Service", 
        color: "purple",
        description: "Accessible from anywhere via tunnel"
      };
    } else {
      return { 
        label: isHTTPS ? "Cloud Server (HTTPS)" : "Cloud Server", 
        color: isHTTPS ? "green" : "yellow",
        description: isHTTPS ? "Accessible from anywhere (secure)" : "Accessible from anywhere (use HTTPS!)"
      };
    }
  };

  const serverTypeInfo = getServerTypeInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 pb-safe-bottom-nav">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/settings")}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-400" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Server className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Network & Server</h1>
                <p className="text-sm text-zinc-400">Multi-device sync configuration</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="space-y-6">
          
          {/* Server Configuration */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${serverEnabled ? "bg-green-500/10" : "bg-zinc-700"}`}>
                  {serverEnabled ? (
                    <Wifi className="w-5 h-5 text-green-400" />
                  ) : (
                    <WifiOff className="w-5 h-5 text-zinc-400" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Server Connection</h2>
                  <p className="text-sm text-zinc-400">
                    {serverEnabled ? "Connected - Devices can sync" : "Disabled - No network sync"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleEnableServer}
                disabled={!serverUrl.trim() && !serverEnabled}
                className={`px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  serverEnabled
                    ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                    : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                }`}
              >
                {serverEnabled ? "Disable" : "Enable"}
              </button>
            </div>

            {/* Server URL Input */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Server URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={serverUrl}
                    onChange={(e) => handleServerUrlChange(e.target.value)}
                    placeholder="https://tracking.yourcompany.com or http://192.168.1.100:3000"
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white font-mono text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                  <button
                    onClick={handleCopyURL}
                    disabled={!serverUrl.trim()}
                    className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {copiedURL ? (
                      <>
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-zinc-300" />
                        <span className="text-zinc-300">Copy</span>
                      </>
                    )}
                  </button>
                </div>
                
                {/* URL Validation Feedback */}
                {urlValidation && !urlValidation.valid && (
                  <div className="mt-2 flex items-start gap-2 text-sm text-red-400">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{urlValidation.error}</span>
                  </div>
                )}
                {urlValidation && urlValidation.valid && urlValidation.error && (
                  <div className="mt-2 flex items-start gap-2 text-sm text-yellow-400">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{urlValidation.error}</span>
                  </div>
                )}
                
                <p className="mt-2 text-xs text-zinc-500">
                  Enter your server domain (e.g., tracking.company.com) or IP address (e.g., 192.168.1.100:3000)
                </p>
              </div>

              {/* Server Type Badge */}
              {serverUrl && (
                <div className={`p-4 bg-${serverTypeInfo.color}-500/10 border border-${serverTypeInfo.color}-500/20 rounded-lg`}>
                  <div className="flex items-start gap-3">
                    <Globe className={`w-5 h-5 text-${serverTypeInfo.color}-400 mt-0.5`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-semibold text-${serverTypeInfo.color}-400`}>
                          {serverTypeInfo.label}
                        </span>
                        {serverUrl.startsWith("https://") && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                            HTTPS Secure
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400">{serverTypeInfo.description}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Connection Test */}
              <div className="flex gap-2">
                <button
                  onClick={handleTestConnection}
                  disabled={testingConnection || !serverUrl.trim()}
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Globe className={`w-4 h-4 ${testingConnection ? "animate-spin" : ""}`} />
                  {testingConnection ? "Testing..." : "Test Connection"}
                </button>
                {connectionResult && (
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    connectionResult.success ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                  }`}>
                    {connectionResult.success ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Connected ({connectionResult.latency}ms)</span>
                        {connectionResult.httpsEnabled && (
                          <Shield className="w-4 h-4 ml-1" />
                        )}
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4" />
                        <span>Failed: {connectionResult.error}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* QR Code */}
              {serverUrl && (
                <div>
                  <button
                    onClick={() => setShowQRCode(!showQRCode)}
                    className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <QrCode className="w-4 h-4" />
                    {showQRCode ? "Hide QR Code" : "Show QR Code"}
                  </button>
                  
                  {showQRCode && (
                    <div className="mt-4 bg-white p-6 rounded-lg">
                      <div className="text-center">
                        <p className="text-sm text-zinc-600 mb-4">Scan with mobile device to auto-configure</p>
                        <div className="inline-block p-4 bg-white border-4 border-zinc-200 rounded-lg">
                          <QRCodeSVG
                            value={generateQRCodeData()}
                            size={192}
                            level="H"
                            includeMargin={false}
                          />
                        </div>
                        <p className="text-xs text-zinc-500 mt-4 font-mono">{serverUrl}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sync Status */}
          {serverEnabled && (
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${syncStatus.isConnected ? "bg-green-500/10" : "bg-red-500/10"}`}>
                    <RefreshCw className={`w-5 h-5 ${syncStatus.isConnected ? "text-green-400" : "text-red-400"}`} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Sync Status</h2>
                    <p className="text-sm text-zinc-400">
                      {syncStatus.isSyncing ? "Syncing..." : syncStatus.isConnected ? "Connected" : "Disconnected"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleManualSync}
                  disabled={syncStatus.isSyncing}
                  className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${syncStatus.isSyncing ? "animate-spin" : ""}`} />
                  Sync Now
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-zinc-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm text-zinc-400">Last Sync</span>
                  </div>
                  <p className="text-white font-medium">
                    {syncStatus.lastSyncAt
                      ? new Date(syncStatus.lastSyncAt).toLocaleString()
                      : "Never"}
                  </p>
                </div>
                <div className="bg-zinc-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm text-zinc-400">Pending Changes</span>
                  </div>
                  <p className="text-white font-medium">{syncStatus.pendingChanges}</p>
                </div>
              </div>

              {syncStatus.error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400">{syncStatus.error}</p>
                </div>
              )}
            </div>
          )}

          {/* User Management */}
          {serverEnabled && (
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Users className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">User Management</h2>
                    <p className="text-sm text-zinc-400">Control who can access this server</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddUser(!showAddUser)}
                  className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-colors flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Add User
                </button>
              </div>

              {/* Add User Form */}
              {showAddUser && (
                <div className="mb-6 p-4 bg-zinc-900 border border-zinc-700 rounded-lg">
                  <h3 className="text-sm font-semibold text-white mb-4">Create New User</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">Username</label>
                      <input
                        type="text"
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                        placeholder="john.doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">Display Name</label>
                      <input
                        type="text"
                        value={newUser.displayName}
                        onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">Role</label>
                      <select
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="viewer">Viewer (Read Only)</option>
                        <option value="inspector">Inspector (Create/Edit)</option>
                        <option value="admin">Admin (Full Access)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">Password</label>
                      <input
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleAddUser}
                      className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                    >
                      Create User
                    </button>
                    <button
                      onClick={() => setShowAddUser(false)}
                      className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Users List */}
              <div className="space-y-2">
                {users.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No users yet. Add a user to get started.</p>
                  </div>
                ) : (
                  users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {user.displayName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.displayName}</p>
                          <p className="text-sm text-zinc-400">@{user.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Shield className={`w-4 h-4 ${
                            user.role === "admin" ? "text-red-400" :
                            user.role === "inspector" ? "text-blue-400" :
                            "text-zinc-400"
                          }`} />
                          <span className={`text-sm capitalize ${
                            user.role === "admin" ? "text-red-400" :
                            user.role === "inspector" ? "text-blue-400" :
                            "text-zinc-400"
                          }`}>
                            {user.role}
                          </span>
                        </div>
                        {user.username !== "admin" && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="px-3 py-1 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Role Descriptions */}
              <div className="mt-6 p-4 bg-zinc-900 rounded-lg">
                <h3 className="text-sm font-semibold text-white mb-3">Role Permissions</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-red-400 mt-0.5" />
                    <div>
                      <span className="text-red-400 font-medium">Admin:</span>
                      <span className="text-zinc-400"> Full access - manage users, tracks, settings, delete inspections</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-blue-400 mt-0.5" />
                    <div>
                      <span className="text-blue-400 font-medium">Inspector:</span>
                      <span className="text-zinc-400"> Create/edit inspections, export data, view all inspections</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-zinc-400 mt-0.5" />
                    <div>
                      <span className="text-zinc-400 font-medium">Viewer:</span>
                      <span className="text-zinc-400"> Read-only access - view and export inspections only</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-blue-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-2">Setup Instructions</h3>
                <ol className="space-y-2 text-sm text-zinc-300">
                  <li className="flex gap-2">
                    <span className="font-semibold">1.</span>
                    <span>Enter your server URL above (domain or IP address)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold">2.</span>
                    <span>Click "Test Connection" to verify server is reachable</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold">3.</span>
                    <span>Click "Enable" to activate sync</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold">4.</span>
                    <span>On mobile: Scan QR code OR manually enter server URL in settings</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold">5.</span>
                    <span>Login with user credentials created above</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold">6.</span>
                    <span>Data will sync automatically every 30 seconds</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>

          {/* Deployment Options */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h3 className="text-white font-semibold">Deployment Options</h3>
            </div>
            <div className="space-y-3 text-sm text-zinc-300">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-blue-500/10 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-400 font-semibold text-xs">1</span>
                </div>
                <div>
                  <span className="text-white font-medium">Local Network:</span>
                  <span className="text-zinc-400"> Use IP address (e.g., http://192.168.1.100:3000) - WiFi only</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-purple-500/10 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-400 font-semibold text-xs">2</span>
                </div>
                <div>
                  <span className="text-white font-medium">Tunnel Service:</span>
                  <span className="text-zinc-400"> Use Cloudflare Tunnel, ngrok, or Tailscale - works from anywhere, auto HTTPS</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-green-500/10 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-400 font-semibold text-xs">3</span>
                </div>
                <div>
                  <span className="text-white font-medium">Cloud Hosting:</span>
                  <span className="text-zinc-400"> Deploy to DigitalOcean, AWS, or similar - professional setup with domain</span>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-300">
                  <strong>Security Tip:</strong> Always use HTTPS (https://) for internet-accessible servers. HTTP is only safe for local network testing.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}