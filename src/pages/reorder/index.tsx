import { useRouter } from "next/router";
import { useApp } from "@/contexts/AppContext";

export default function ReorderTrackSelect() {
  const router = useRouter();
  const { tracks } = useApp();

  const handleTrackSelect = (trackId: string) => {
    router.push(`/reorder/${trackId}`);
  };

  // Filter to only enabled tracks
  const enabledTracks = tracks.filter(track => track.enabled !== false);

  return (
    <div className="min-h-screen bg-zinc-900 text-white pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* H.headerTitle */}
        <h1 id="H.headerTitle" className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
          Reorder
        </h1>

        {/* H.subText */}
        <p id="H.subText" className="text-zinc-400 text-base md:text-lg mb-6">
          Choose a track to reorder cars.
        </p>

        {/* H.trackList */}
        <div id="H.trackList" className="space-y-3 md:space-y-4">
          {enabledTracks.map(track => (
            <button
              key={track.id}
              onClick={() => handleTrackSelect(track.id)}
              className="H.trackRow w-full bg-zinc-800 hover:bg-zinc-700 p-5 md:p-6 rounded-xl text-left transition-colors"
            >
              {/* H.trackName */}
              <h2 className="H.trackName text-2xl md:text-3xl font-bold font-mono">
                {track.name}
              </h2>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}