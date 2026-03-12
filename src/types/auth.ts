/**
 * Authentication and User Management Types
 */

export type UserRole = "admin" | "inspector" | "viewer";

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  email?: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface AuthSession {
  userId: string;
  token: string;
  expiresAt: string;
  deviceId: string;
  deviceName: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  deviceName: string;
}

export interface UserPermissions {
  canCreateInspections: boolean;
  canEditInspections: boolean;
  canDeleteInspections: boolean;
  canViewAllInspections: boolean;
  canManageUsers: boolean;
  canManageTracks: boolean;
  canExportData: boolean;
  canAccessAdmin: boolean;
  canConfigureSystem: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  admin: {
    canCreateInspections: true,
    canEditInspections: true,
    canDeleteInspections: true,
    canViewAllInspections: true,
    canManageUsers: true,
    canManageTracks: true,
    canExportData: true,
    canAccessAdmin: true,
    canConfigureSystem: true,
  },
  inspector: {
    canCreateInspections: true,
    canEditInspections: true,
    canDeleteInspections: false,
    canViewAllInspections: true,
    canManageUsers: false,
    canManageTracks: false,
    canExportData: true,
    canAccessAdmin: false,
    canConfigureSystem: false,
  },
  viewer: {
    canCreateInspections: false,
    canEditInspections: false,
    canDeleteInspections: false,
    canViewAllInspections: true,
    canManageUsers: false,
    canManageTracks: false,
    canExportData: true,
    canAccessAdmin: false,
    canConfigureSystem: false,
  },
};