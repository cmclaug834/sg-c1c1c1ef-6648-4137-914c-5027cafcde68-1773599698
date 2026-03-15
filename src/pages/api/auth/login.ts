/**
 * API: Login endpoint
 * Authenticates users and returns JWT tokens
 */

import type { NextApiResponse } from "next";
import { verifyPassword, generateJWT } from "@/lib/auth";
import { withMiddleware, AuthenticatedRequest } from "@/lib/apiMiddleware";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const result = verifyPassword(username, password);

    if (!result.valid || !result.user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = generateJWT({
      userId: result.user.id,
      username: result.user.username,
      role: result.user.role,
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: result.user.id,
        username: result.user.username,
        displayName: result.user.displayName,
        role: result.user.role,
      },
    });
  } catch (error) {
    console.error("[API Login] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export default withMiddleware(handler, { auth: false, rateLimit: true });
