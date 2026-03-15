/**
 * API: Sync endpoint
 * Handles incoming changes from mobile devices
 */

import type { NextApiResponse } from "next";
import { SyncChange } from "@/lib/sync";
import { withMiddleware, AuthenticatedRequest } from "@/lib/apiMiddleware";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }
  
  try {
    const { changes } = req.body as { changes: SyncChange[] };
    
    if (!Array.isArray(changes)) {
      return res.status(400).json({ error: "Invalid request format" });
    }
    
    // Log authenticated user
    console.log(`[API Sync] User: ${req.user?.username} | Changes: ${changes.length}`);
    
    // Process each change
    changes.forEach((change) => {
      console.log(`[API Sync] Received change: ${change.type} ${change.action} ${change.id}`);
      // In desktop server mode, save to local database/filesystem
      // For now, we'll just log them
    });
    
    // TODO: Query for changes made by other devices that this device doesn't have
    // const outgoingChanges = getChangesSince(lastSyncTimestamp);
    
    res.status(200).json({
      success: true,
      receivedCount: changes.length,
      changes: [], // Return changes from other devices
    });
  } catch (error) {
    console.error("[API Sync] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export default withMiddleware(handler, { auth: true, rateLimit: true });
