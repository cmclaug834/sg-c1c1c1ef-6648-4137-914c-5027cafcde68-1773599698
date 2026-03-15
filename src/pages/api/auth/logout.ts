/**
 * API: Logout endpoint
 */

import type { NextApiResponse } from "next";
import { withMiddleware, AuthenticatedRequest } from "@/lib/apiMiddleware";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // With JWT, logout is client-side (delete token)
  // Server can maintain a blacklist for extra security (optional)
  
  console.log(`[API Logout] User ${req.user?.username} logged out`);

  res.status(200).json({ success: true });
}

export default withMiddleware(handler, { auth: false, rateLimit: true });