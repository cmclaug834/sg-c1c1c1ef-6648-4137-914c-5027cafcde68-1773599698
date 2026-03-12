/**
 * API: User management
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getCurrentUser, hasPermission, getUsers, saveUser } from "@/lib/auth";
import { User } from "@/types/auth";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  if (!hasPermission(currentUser, "canManageUsers")) {
    return res.status(403).json({ error: "Permission denied" });
  }
  
  try {
    switch (req.method) {
      case "GET":
        // Get all users
        const users = getUsers();
        return res.status(200).json({ users });
      
      case "POST":
        // Create new user
        const newUser = req.body as { user: User; password: string };
        
        if (!newUser.user || !newUser.password) {
          return res.status(400).json({ error: "User data and password required" });
        }
        
        saveUser(newUser.user, newUser.password);
        return res.status(201).json({ user: newUser.user });
      
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("[API Users] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}