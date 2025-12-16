import { useState } from "react";
import { Search, X } from "lucide-react";

interface TrackPickerModalProps {
  onSelectTrack: (trackId: string, trackName: string) => void;
  onCancel: () => void;
  excludeTrackId?: string;
  title?: string;
}

const MASTER_TRACK_LIST = [
  "AS28", "AS29", "AS30", "AS31", "AS32", "AS33",
  "AS34", "AS38", "AS39", "AS46", "AS47", "AS48"
];

export function TrackPickerModal({ onSelectTrack, onCancel, excludeTrackId, title }: TrackPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTracks = MASTER_TRACK_LIST
    .filter(trackName => trackName !== excludeTrackId)
    .filter(trackName => trackName.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800">
        <div className="p-6">
          {/* F.modalTitle */}
          <div className="flex items-center justify-between mb-6">
            <h2 id="F.modalTitle" className="text-2xl font-bold">
              {title || "Move to which track?"}
            </h2>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-zinc-400" />
            </button>
          </div>

          {/* F.searchTrack */}
          <div id="F.searchTrack" className="mb-4 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search AS track…"
              className="w-full bg-zinc-800 text-white pl-12 pr-4 py-3 rounded-lg border-2 border-zinc-700 focus:border-zinc-600 focus:outline-none text-base"
            />
          </div>

          {/* F.trackList */}
          <div id="F.trackList" className="space-y-2 max-h-96 overflow-y-auto mb-6">
            {filteredTracks.map(trackName => (
              <button
                key={trackName}
                onClick={() => onSelectTrack(trackName, trackName)}
                className="F.trackRow w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-left px-4 transition-colors"
              >
                {/* F.trackName */}
                <span className="F.trackName text-lg font-medium font-mono">
                  {trackName}
                </span>
              </button>
            ))}

            {filteredTracks.length === 0 && (
              <div className="text-center py-8 text-zinc-500">
                <p className="text-base">No tracks found</p>
              </div>
            )}
          </div>

          {/* F.cancelBtn */}
          <button
            id="F.cancelBtn"
            onClick={onCancel}
            className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}