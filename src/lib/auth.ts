/**
 * Authentication and User Management
 * Updated to support JWT-based authentication for internet-accessible servers
 */
import { User, AuthSession, LoginCredentials, UserRole, UserPermissions, ROLE_PERMISSIONS } from "@/types/auth";
import { loadBackendConfig, saveBackendConfig } from "./backendConfig";

const USERS_STORAGE_KEY = "railyard_users";
const SESSIONS_STORAGE_KEY = "railyard_sessions";
const CURRENT_SESSION_KEY = "railyard_current_session";
const JWT_TOKEN_KEY = "railyard_jwt_token";
const REFRESH_TOKEN_KEY = "railyard_refresh_token";

export interface JWTPayload {
  userId: string;
  username: string;
  role: string;
  iat: number; // Issued at
  exp: number; // Expires at
}

// Default admin user (created on first use)
const DEFAULT_ADMIN: User = {
  id: "admin-default",
  username: "admin",
  displayName: "Administrator",
  role: "admin",
  email: "admin@railyard.local",
  createdAt: new Date().toISOString(),
  isActive: true,
};

// Password storage (in production, use proper hashing)
const PASSWORDS_KEY = "railyard_passwords";

interface PasswordEntry {
  userId: string;
  hash: string; // In production: bcrypt hash
}

/**
 * Simple hash function (REPLACE WITH BCRYPT IN PRODUCTION)
 */
function simpleHash(password: string): string {
  // This is NOT secure - just for demonstration
  // In production, use: bcrypt.hash(password, 10)
  return btoa(password + "salt_railyard_2026");
}

function verifyPassword(password: string, hash: string): boolean {
  return simpleHash(password) === hash;
}

/**
 * Verify username and password for API
 */
export function verifyCredentials(username: string, password: string): { valid: boolean; user?: User } {
  const user = getUserByUsername(username);
  if (!user || !user.isActive) return { valid: false };
  
  const passwords: PasswordEntry[] = JSON.parse(localStorage.getItem(PASSWORDS_KEY) || "[]");
  const passwordEntry = passwords.find((p) => p.userId === user.id);
  
  if (!passwordEntry || !verifyPassword(password, passwordEntry.hash)) {
    return { valid: false };
  }
  
  return { valid: true, user };
}

/**
 * Initialize default admin user
 */
export function initializeAuth(): void {
  const users = getUsers();
  if (users.length === 0) {
    // Create default admin
    saveUser(DEFAULT_ADMIN, "admin123"); // Default password
    console.log("[Auth] Default admin user created (username: admin, password: admin123)");
  }
}

/**
 * Get all users
 */
export function getUsers(): User[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(USERS_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Save user
 */
function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

/**
 * Create or update user
 */
export function saveUser(user: User, password?: string): void {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === user.id);
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
  saveUsers(users);
  
  // Save password if provided
  if (password) {
    const passwords: PasswordEntry[] = JSON.parse(localStorage.getItem(PASSWORDS_KEY) || "[]");
    const passIndex = passwords.findIndex((p) => p.userId === user.id);
    const hash = simpleHash(password);
    if (passIndex >= 0) {
      passwords[passIndex].hash = hash;
    } else {
      passwords.push({ userId: user.id, hash });
    }
    localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
  }
}

/**
 * Delete user
 */
export function deleteUser(userId: string): void {
  const users = getUsers().filter((u) => u.id !== userId);
  saveUsers(users);
  
  // Delete password
  const passwords: PasswordEntry[] = JSON.parse(localStorage.getItem(PASSWORDS_KEY) || "[]");
  const filtered = passwords.filter((p) => p.userId !== userId);
  localStorage.setItem(PASSWORDS_KEY, JSON.stringify(filtered));
  
  // Delete sessions
  const sessions = getSessions().filter((s) => s.userId !== userId);
  saveSessions(sessions);
}

/**
 * Get user by ID
 */
export function getUserById(userId: string): User | null {
  const users = getUsers();
  return users.find((u) => u.id === userId) || null;
}

/**
 * Get user by username
 */
export function getUserByUsername(username: string): User | null {
  const users = getUsers();
  return users.find((u) => u.username === username) || null;
}

/**
 * Decode JWT token without verification (client-side only)
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    console.error("[Auth] Failed to decode JWT:", error);
    return null;
  }
}

const JWT_SECRET = "railyard_jwt_secret_demo_2026";

/**
 * Generate JWT Token
 */
export function generateJWT(payload: Omit<JWTPayload, "iat" | "exp">): string {
  const iat = Date.now();
  const exp = iat + 24 * 60 * 60 * 1000; // 24 hours
  const fullPayload: JWTPayload = { ...payload, iat, exp };
  
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(fullPayload));
  const signature = btoa(header + body + JWT_SECRET);
  
  return `${header}.${body}.${signature}`;
}

/**
 * Verify JWT Token
 */
export function verifyJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1])) as JWTPayload;
    
    if (payload.exp && payload.exp < Date.now()) {
      return null; // Expired
    }
    
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Login user (Hybrid: Local fallback + Remote JWT)
 */
export async function loginWithServer(credentials: LoginCredentials): Promise<AuthSession | null> {
  const config = loadBackendConfig();
  const serverUrl = config.network.serverUrl;

  // If we have a server URL, try remote login first
  if (serverUrl) {
    try {
      const response = await fetch(`${serverUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.token && data.user) {
          // Store JWT token
          localStorage.setItem(JWT_TOKEN_KEY, data.token);
          if (data.refreshToken) {
            localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
          }

          // Update backend config with token
          config.network.jwtToken = data.token;
          saveBackendConfig(config);

          // Create local session object to match existing types
          const session: AuthSession = {
            userId: data.user.id,
            token: data.token,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            deviceId: generateDeviceId(),
            deviceName: credentials.deviceName,
          };
          
          localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session));
          
          // Save user locally for offline access
          saveUser(data.user);
          
          return session;
        }
      }
    } catch (error) {
      console.warn("[Auth] Remote login failed, falling back to local auth", error);
    }
  }

  // Fallback to local authentication
  return login(credentials);
}

/**
 * Original Local Login (Kept for compatibility and offline fallback)
 */
export function login(credentials: LoginCredentials): AuthSession | null {
  const user = getUserByUsername(credentials.username);
  if (!user || !user.isActive) return null;
  
  // Verify password
  const passwords: PasswordEntry[] = JSON.parse(localStorage.getItem(PASSWORDS_KEY) || "[]");
  const passwordEntry = passwords.find((p) => p.userId === user.id);
  if (!passwordEntry || !verifyPassword(credentials.password, passwordEntry.hash)) {
    return null;
  }
  
  // Create session
  const session: AuthSession = {
    userId: user.id,
    token: generateToken(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    deviceId: generateDeviceId(),
    deviceName: credentials.deviceName,
  };
  
  // Save session
  const sessions = getSessions();
  sessions.push(session);
  saveSessions(sessions);
  
  // Set current session
  localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session));
  
  // Update last login
  user.lastLogin = new Date().toISOString();
  saveUser(user);
  
  return session;
}

/**
 * Logout
 */
export function logout(): void {
  const session = getCurrentSession();
  if (session) {
    // Remove session
    const sessions = getSessions().filter((s) => s.token !== session.token);
    saveSessions(sessions);
  }
  
  localStorage.removeItem(CURRENT_SESSION_KEY);
  localStorage.removeItem(JWT_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  
  // Clear token from config
  try {
    const config = loadBackendConfig();
    config.network.jwtToken = undefined;
    saveBackendConfig(config);
  } catch (e) {
    console.error("Failed to clear token from config", e);
  }
}

/**
 * Get current session
 */
export function getCurrentSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(CURRENT_SESSION_KEY);
  if (!data) return null;
  
  const session: AuthSession = JSON.parse(data);
  
  // Check if expired
  if (new Date(session.expiresAt) < new Date()) {
    logout();
    return null;
  }
  
  return session;
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
  const session = getCurrentSession();
  if (!session) return null;
  return getUserById(session.userId);
}

/**
 * Get all sessions
 */
function getSessions(): AuthSession[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(SESSIONS_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Save sessions
 */
function saveSessions(sessions: AuthSession[]): void {
  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
}

/**
 * Get user permissions
 */
export function getUserPermissions(user: User | null): UserPermissions {
  if (!user) {
    return {
      canCreateInspections: false,
      canEditInspections: false,
      canDeleteInspections: false,
      canViewAllInspections: false,
      canManageUsers: false,
      canManageTracks: false,
      canExportData: false,
      canAccessAdmin: false,
      canConfigureSystem: false,
    };
  }
  return ROLE_PERMISSIONS[user.role];
}

/**
 * Check permission
 */
export function hasPermission(user: User | null, permission: keyof UserPermissions): boolean {
  const permissions = getUserPermissions(user);
  return permissions[permission];
}

/**
 * Generate token
 */
function generateToken(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate device ID
 */
function generateDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let deviceId = localStorage.getItem("railyard_device_id");
  if (!deviceId) {
    deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("railyard_device_id", deviceId);
  }
  return deviceId;
}

/**
 * Clean up expired sessions
 */
export function cleanupExpiredSessions(): void {
  const sessions = getSessions();
  const now = new Date();
  const active = sessions.filter((s) => new Date(s.expiresAt) > now);
  saveSessions(active);
}

/**
 * Get authorization header for API requests
 */
export function getAuthHeader(): { Authorization?: string } {
  if (typeof window === "undefined") return {};
  
  // Try JWT first
  const jwt = localStorage.getItem(JWT_TOKEN_KEY);
  if (jwt) {
    return { Authorization: `Bearer ${jwt}` };
  }
  
  // Fallback to local session token
  const session = getCurrentSession();
  if (session?.token) {
    return { Authorization: `Bearer ${session.token}` };
  }
  
  return {};
}