import { useApp } from "@/contexts/AppContext";
import { useRouter } from "next/router";
import { CheckCircle2, Circle, Clock, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { normalizeCarId } from "@/lib/carIdFormatter";
import { User } from "@/types";

export default function TrackSelect() {
  const { tracks, updateLastChecked, currentUser } = useApp();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCrewEdit, setShowCrewEdit] = useState(false);
  const [isOnline] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Allow hydration to occur before enforcing guard
    if (!mounted) return;
    if (currentUser === null) {
      router.push("/");
    }
  }, [mounted, currentUser, router]);

  if (!mounted) {
    return null;
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Start Morning Yard Check</h2>
          <p className="text-zinc-400">Please enter your crew name and ID to begin.</p>
        </div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Search logic: tracks and cars
  const searchLower = searchQuery.toLowerCase().trim();
  const hasDigits = /\d/.test(searchQuery);

  // Filter tracks by name
  const matchingTracks = tracks.filter(track =>
    track.enabled !== false && track.name.toLowerCase().includes(searchLower)
  );

  // Find cars matching the search query
  interface CarMatch {
    car: typeof tracks[0]["cars"][0];
    track: typeof tracks[0];
  }

  const matchingCars: CarMatch[] = [];
  if (searchQuery.trim()) {
    tracks.forEach(track => {
      if (track.enabled === false) return;
      track.cars.forEach(car => {
        const normalized = normalizeCarId(car.carNumber);
        if (normalized.toLowerCase().includes(searchLower)) {
          matchingCars.push({ car, track });
        }
      });
    });
  }

  // Order results: if query has digits (looks like car ID), show cars first
  const showCarsFirst = hasDigits && matchingCars.length > 0;

  const handleTrackClick = (trackId: string) => {
    updateLastChecked(trackId);
    router.push(`/track/${trackId}`);
  };

  const handleCarClick = (trackId: string) => {
    router.push(`/track/${trackId}`);
  };

  const getTrackStatus = (track: typeof tracks[0]) => {
    if (track.totalCars === 0) return "empty";
    if (track.confirmedCars === track.totalCars) return "complete";
    if (track.confirmedCars > 0) return "progress";
    return "pending";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle2 className="w-8 h-8 text-green-500" />;
      case "progress":
        return <Clock className="w-8 h-8 text-yellow-500" />;
      default:
        return <Circle className="w-8 h-8 text-zinc-600" />;
    }
  };

  const getCarStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case "missing":
        return <Clock className="w-6 h-6 text-yellow-500" />;
      default:
        return <Circle className="w-6 h-6 text-zinc-600" />;
    }
  };

  const formatLastChecked = (timestamp?: string) => {
    if (!timestamp) return "Not checked";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const hasResults = matchingTracks.length > 0 || matchingCars.length > 0;

  return (
    <div className="min-h-screen bg-zinc-900 text-white pb-safe-bottom-nav">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* A.headerTitle + A.headerDate */}
        <div className="mb-6">
          <h1 id="A.headerTitle" className="text-3xl md:text-4xl font-bold tracking-tight mb-1">
            Morning Yard Check
          </h1>
          <p id="A.headerDate" className="text-zinc-500 text-sm md:text-base">
            {currentDate}
          </p>
        </div>

        {/* A.crewBadge */}
        <button
          id="A.crewBadge"
          onClick={() => setShowCrewEdit(true)}
          className="mb-6 px-5 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-base md:text-lg font-medium transition-colors inline-flex items-center gap-2"
        >
          <span className="text-zinc-400">Crew:</span>
          <span className="font-mono">{currentUser.crewId}</span>
          <span className="text-xs text-zinc-500">✎</span>
        </button>

        {/* A.searchTrack */}
        <div id="A.searchTrack" className="mb-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tracks or cars…"
            className="w-full bg-zinc-800 text-white pl-12 pr-4 py-4 rounded-lg border-2 border-zinc-700 focus:border-zinc-600 focus:outline-none text-base md:text-lg"
          />
        </div>

        {/* Results */}
        {!searchQuery.trim() ? (
          // Default view: show all tracks
          <div id="A.trackList" className="space-y-3 md:space-y-4">
            {tracks.filter(t => t.enabled !== false).map(track => {
              const status = getTrackStatus(track);

              return (
                <button
                  key={track.id}
                  onClick={() => handleTrackClick(track.id)}
                  className="A.trackRow w-full bg-zinc-800 hover:bg-zinc-700 p-5 md:p-6 rounded-xl text-left transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* A.trackName */}
                      <h2 className="A.trackName text-2xl md:text-3xl font-bold mb-1 truncate">
                        {track.name}
                      </h2>
                      
                      {/* Display name centered below track name */}
                      {track.displayName && track.displayName.trim() && (
                        <div className="text-center mb-2">
                          <p className="text-zinc-400 text-base md:text-lg font-medium">
                            {track.displayName}
                          </p>
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        <div className="text-zinc-400 text-sm md:text-base">
                          Cars: <span className="font-mono font-semibold text-white">
                            {track.confirmedCars} / {track.totalCars}
                          </span>
                        </div>
                        
                        {/* A.lastChecked */}
                        <div className="A.lastChecked text-zinc-500 text-xs md:text-sm">
                          {formatLastChecked(track.lastChecked)}
                        </div>
                      </div>
                    </div>

                    {/* Right side: Status icon only */}
                    <div className="flex-shrink-0">
                      {/* A.trackStatus */}
                      <div className="A.trackStatus">
                        {getStatusIcon(status)}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : !hasResults ? (
          // No results
          <div className="text-center py-12">
            <p className="text-xl text-zinc-400">No tracks or cars found</p>
            <p className="text-sm text-zinc-500 mt-2">Try a different search term</p>
          </div>
        ) : (
          // Search results
          <div className="space-y-6">
            {/* Car results (shown first if query has digits) */}
            {showCarsFirst && matchingCars.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-zinc-400 mb-3">
                  Matching Cars ({matchingCars.length})
                </h3>
                <div className="space-y-2">
                  {matchingCars.map(({ car, track }) => (
                    <button
                      key={`${track.id}-${car.id}`}
                      onClick={() => handleCarClick(track.id)}
                      className="w-full bg-zinc-800 hover:bg-zinc-700 p-4 rounded-xl text-left transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {getCarStatusIcon(car.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-2xl font-bold font-mono mb-1">
                            {normalizeCarId(car.carNumber)}
                          </div>
                          <div className="text-zinc-400 text-base">
                            On: <span className="font-semibold text-white">{track.name}</span>
                          </div>
                          <div className="text-zinc-500 text-sm mt-1">
                            {car.carType} • {car.status === "confirmed" ? "Confirmed" : car.status === "missing" ? "Missing" : "Pending"}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Track results */}
            {matchingTracks.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-zinc-400 mb-3">
                  Matching Tracks ({matchingTracks.length})
                </h3>
                <div className="space-y-3">
                  {matchingTracks.map(track => {
                    const status = getTrackStatus(track);

                    return (
                      <button
                        key={track.id}
                        onClick={() => handleTrackClick(track.id)}
                        className="w-full bg-zinc-800 hover:bg-zinc-700 p-5 rounded-xl text-left transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h2 className="text-2xl font-bold mb-1 truncate">
                              {track.name}
                            </h2>
                            
                            {/* Display name centered below track name */}
                            {track.displayName && track.displayName.trim() && (
                              <div className="text-center mb-2">
                                <p className="text-zinc-400 text-base font-medium">
                                  {track.displayName}
                                </p>
                              </div>
                            )}
                            
                            <div className="space-y-1">
                              <div className="text-zinc-400 text-sm">
                                Cars: <span className="font-mono font-semibold text-white">
                                  {track.confirmedCars} / {track.totalCars}
                                </span>
                              </div>
                              
                              <div className="text-zinc-500 text-xs">
                                {formatLastChecked(track.lastChecked)}
                              </div>
                            </div>
                          </div>

                          {/* Right side: Status icon only */}
                          <div className="flex-shrink-0">
                            {getStatusIcon(status)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Car results (shown after tracks if query doesn't have digits) */}
            {!showCarsFirst && matchingCars.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-zinc-400 mb-3">
                  Matching Cars ({matchingCars.length})
                </h3>
                <div className="space-y-2">
                  {matchingCars.map(({ car, track }) => (
                    <button
                      key={`${track.id}-${car.id}`}
                      onClick={() => handleCarClick(track.id)}
                      className="w-full bg-zinc-800 hover:bg-zinc-700 p-4 rounded-xl text-left transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {getCarStatusIcon(car.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-2xl font-bold font-mono mb-1">
                            {normalizeCarId(car.carNumber)}
                          </div>
                          <div className="text-zinc-400 text-base">
                            On: <span className="font-semibold text-white">{track.name}</span>
                          </div>
                          <div className="text-zinc-500 text-sm mt-1">
                            {car.carType} • {car.status === "confirmed" ? "Confirmed" : car.status === "missing" ? "Missing" : "Pending"}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* A.syncStatus */}
        <div id="A.syncStatus" className="mt-8 text-center text-sm text-zinc-500">
          Sync: {isOnline ? (
            <span className="text-green-500">● Online</span>
          ) : (
            <span className="text-red-500">● Offline</span>
          )}
        </div>
      </div>

      {/* Crew Edit Modal */}
      {showCrewEdit && (
        <CrewEditModal
          onClose={() => setShowCrewEdit(false)}
        />
      )}
    </div>
  );
}

interface CrewEditModalProps {
  onClose: () => void;
}

function CrewEditModal({ onClose }: CrewEditModalProps) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 p-6">
        <h2 className="text-2xl font-bold mb-6">Edit Crew Info</h2>
        
        <div className="space-y-4">
          <button
            onClick={() => {
              router.push("/settings");
              onClose();
            }}
            className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors"
          >
            Open Settings
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}