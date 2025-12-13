import { useApp } from "@/contexts/AppContext";
import { useRouter } from "next/router";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";

export default function Settings() {
  const { currentUser, setUser } = useApp();
  const router = useRouter();
  const [name, setName] = useState("");
  const [crewId, setCrewId] = useState("");

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setCrewId(currentUser.crewId);
    }
  }, [currentUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && crewId.trim()) {
      setUser({
        id: currentUser?.id || `user-${Date.now()}`,
        name: name.trim(),
        crewId: crewId.trim(),
      });
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          {currentUser && (
            <button
              onClick={() => router.push("/")}
              className="p-3 hover:bg-zinc-800 rounded-lg"
            >
              <ArrowLeft className="w-7 h-7" />
            </button>
          )}
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <div className="w-14" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-zinc-400 mb-2 text-lg">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-800 text-white text-xl px-4 py-4 rounded-lg border-2 border-zinc-700 focus:border-green-500 focus:outline-none"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-2 text-lg">Crew ID</label>
            <input
              type="text"
              value={crewId}
              onChange={(e) => setCrewId(e.target.value)}
              className="w-full bg-zinc-800 text-white text-xl font-mono px-4 py-4 rounded-lg border-2 border-zinc-700 focus:border-green-500 focus:outline-none"
              placeholder="CREW-001"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-green-600 hover:bg-green-700 rounded-lg text-xl font-medium mt-8"
          >
            Save Settings
          </button>
        </form>
      </div>
    </div>
  );
}