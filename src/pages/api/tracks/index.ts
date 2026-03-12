/**
 * API: Tracks CRUD operations
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getTracks, saveTracks } from "@/lib/storage";
import { Track } from "@/types";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = getCurrentUser();
  
  if (!user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  try {
    switch (req.method) {
      case "GET":
        // Get all tracks
        const tracks = getTracks();
        return res.status(200).json({ tracks });
      
      case "POST":
        // Create new track
        if (!hasPermission(user, "canManageTracks")) {
          return res.status(403).json({ error: "Permission denied" });
        }
        
        const newTrack = req.body as Track;
        const currentTracks = getTracks();
        currentTracks.push(newTrack);
        saveTracks(currentTracks);
        
        return res.status(201).json({ track: newTrack });
      
      case "PUT":
        // Update multiple tracks
        if (!hasPermission(user, "canManageTracks")) {
          return res.status(403).json({ error: "Permission denied" });
        }
        
        const updatedTracks = req.body as Track[];
        saveTracks(updatedTracks);
        
        return res.status(200).json({ tracks: updatedTracks });
      
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("[API Tracks] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}