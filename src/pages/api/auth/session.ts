/**
 * API: Session validation endpoint
 */

import type { NextApiResponse } from "next";
import { withMiddleware, AuthenticatedRequest } from "@/lib/apiMiddleware";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // If we got here, middleware validated the token
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  res.status(200).json({
    valid: true,
    user: req.user,
  });
}

export default withMiddleware(handler, { auth: true, rateLimit: true });
