/**
 * API: Server health check
 */

import type { NextApiResponse } from "next";
import { withMiddleware, AuthenticatedRequest } from "@/lib/apiMiddleware";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    server: "Rail Yard Tracker Desktop Server",
    version: "1.0.0",
    user: req.user?.username || "anonymous",
  });
}

export default withMiddleware(handler, { auth: false, rateLimit: true });