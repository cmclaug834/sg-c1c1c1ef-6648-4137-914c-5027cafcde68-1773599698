/**
 * API: Get current session
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getCurrentSession, getCurrentUser } from "@/lib/auth";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  
  try {
    const session = getCurrentSession();
    
    if (!session) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = getCurrentUser();
    
    res.status(200).json({ session, user });
  } catch (error) {
    console.error("[API Session] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}