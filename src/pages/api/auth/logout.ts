/**
 * API: User logout
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { logout, getCurrentSession } from "@/lib/auth";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  
  try {
    const session = getCurrentSession();
    
    if (!session) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    logout();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("[API Logout] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}