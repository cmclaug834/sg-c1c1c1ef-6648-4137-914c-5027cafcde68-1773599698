import { useApp } from "@/contexts/AppContext";
import { useRouter } from "next/router";
import { CheckCircle2, Circle } from "lucide-react";
import { useEffect } from "react";

export default function TrackSelect() {
  const { tracks, currentUser } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.push("/settings");
    }
  }, [currentUser, router]);

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold tracking-tight">RAIL YARD TRACKER</h1>
          <button
            onClick={() => router.push("/settings")}
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium"
          >
            Settings
          </button>
        </div>

        <div className="space-y-4">
          {tracks.map(track => {
            const progress = track.totalCars > 0 
              ? Math.round((track.confirmedCars / track.totalCars) * 100) 
              : 0;

            return (
              <button
                key={track.id}
                onClick={() => router.push(`/track/${track.id}`)}
                className="w-full bg-zinc-800 hover:bg-zinc-700 p-6 rounded-xl text-left transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-2xl font-bold">{track.name}</h2>
                  {progress === 100 ? (
                    <CheckCircle2 className="w-8 h-8 text-green-500 flex-shrink-0" />
                  ) : (
                    <Circle className="w-8 h-8 text-zinc-600 flex-shrink-0" />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-lg">
                    <span className="text-zinc-400">Cars:</span>
                    <span className="font-mono font-bold">
                      {track.confirmedCars} / {track.totalCars}
                    </span>
                  </div>

                  <div className="h-3 bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="text-right text-zinc-400 text-sm font-mono">
                    {progress}%
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}