/**
 * API: Get latest data
 */

import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  
  // TODO: Return latest data from server
  // For now, return empty
  res.status(200).json({
    changes: [],
    timestamp: new Date().toISOString(),
  });
}