/**
 * API: Single inspection operations
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { inspectionStorage } from "@/lib/inspectionStorage";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = getCurrentUser();
  
  if (!user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  const { id } = req.query;
  
  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid inspection ID" });
  }
  
  try {
    switch (req.method) {
      case "GET":
        // Get single inspection
        if (!hasPermission(user, "canViewAllInspections")) {
          return res.status(403).json({ error: "Permission denied" });
        }
        
        const inspection = inspectionStorage.getInspection(id);
        
        if (!inspection) {
          return res.status(404).json({ error: "Inspection not found" });
        }
        
        return res.status(200).json({ inspection });
      
      case "PUT":
        // Update inspection
        if (!hasPermission(user, "canEditInspections")) {
          return res.status(403).json({ error: "Permission denied" });
        }
        
        const updates = req.body;
        inspectionStorage.updateInspection(id, updates);
        
        const updated = inspectionStorage.getInspection(id);
        return res.status(200).json({ inspection: updated });
      
      case "DELETE":
        // Delete inspection
        if (!hasPermission(user, "canDeleteInspections")) {
          return res.status(403).json({ error: "Permission denied" });
        }
        
        inspectionStorage.deleteInspection(id);
        return res.status(200).json({ success: true });
      
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("[API Inspection] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}