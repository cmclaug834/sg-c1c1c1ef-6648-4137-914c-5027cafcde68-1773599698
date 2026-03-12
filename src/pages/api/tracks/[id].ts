/**
 * API: Single track operations
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getTracks, saveTracks } from "@/lib/storage";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = getCurrentUser();
  
  if (!user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  const { id } = req.query;
  
  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid track ID" });
  }
  
  try {
    switch (req.method) {
      case "GET":
        // Get single track
        const tracks = getTracks();
        const track = tracks.find((t) => t.id === id);
        
        if (!track) {
          return res.status(404).json({ error: "Track not found" });
        }
        
        return res.status(200).json({ track });
      
      case "PUT":
        // Update track
        if (!hasPermission(user, "canManageTracks")) {
          return res.status(403).json({ error: "Permission denied" });
        }
        
        const allTracks = getTracks();
        const index = allTracks.findIndex((t) => t.id === id);
        
        if (index === -1) {
          return res.status(404).json({ error: "Track not found" });
        }
        
        allTracks[index] = { ...allTracks[index], ...req.body };
        saveTracks(allTracks);
        
        return res.status(200).json({ track: allTracks[index] });
      
      case "DELETE":
        // Delete track
        if (!hasPermission(user, "canManageTracks")) {
          return res.status(403).json({ error: "Permission denied" });
        }
        
        const tracksAfterDelete = getTracks().filter((t) => t.id !== id);
        saveTracks(tracksAfterDelete);
        
        return res.status(200).json({ success: true });
      
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("[API Track] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}