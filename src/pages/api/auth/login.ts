/**
 * API: User login
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { login } from "@/lib/auth";
import { LoginCredentials } from "@/types/auth";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  
  try {
    const credentials = req.body as LoginCredentials;
    
    if (!credentials.username || !credentials.password) {
      return res.status(400).json({ error: "Username and password required" });
    }
    
    const session = login(credentials);
    
    if (!session) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    res.status(200).json({ session });
  } catch (error) {
    console.error("[API Login] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}