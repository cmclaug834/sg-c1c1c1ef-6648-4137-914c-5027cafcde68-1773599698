import { useRouter } from "next/router";

const MASTER_TRACK_LIST = [
  "AS28", "AS29", "AS30", "AS31", "AS32", "AS33",
  "AS34", "AS38", "AS39", "AS46", "AS47", "AS48"
];

export default function ReorderTrackSelect() {
  const router = useRouter();

  const handleTrackSelect = (trackName: string) => {
    router.push(`/reorder/${trackName}`);
  };

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
          {MASTER_TRACK_LIST.map(trackName => (
            <button
              key={trackName}
              onClick={() => handleTrackSelect(trackName)}
              className="H.trackRow w-full bg-zinc-800 hover:bg-zinc-700 p-5 md:p-6 rounded-xl text-left transition-colors"
            >
              {/* H.trackName */}
              <h2 className="H.trackName text-2xl md:text-3xl font-bold font-mono">
                {trackName}
              </h2>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}