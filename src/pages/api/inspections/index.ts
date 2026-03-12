/**
 * API: Inspections CRUD operations
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { inspectionStorage } from "@/lib/inspectionStorage";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = getCurrentUser();
  
  if (!user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  try {
    switch (req.method) {
      case "GET":
        // Get all inspections
        if (!hasPermission(user, "canViewAllInspections")) {
          return res.status(403).json({ error: "Permission denied" });
        }
        
        const inspections = inspectionStorage.getAllInspections();
        return res.status(200).json({ inspections });
      
      case "POST":
        // Create new inspection
        if (!hasPermission(user, "canCreateInspections")) {
          return res.status(403).json({ error: "Permission denied" });
        }
        
        const newInspection = req.body;
        inspectionStorage.saveInspection(newInspection);
        return res.status(201).json({ inspection: newInspection });
      
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("[API Inspections] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}