import { useApp } from "@/contexts/AppContext";
import { useRouter } from "next/router";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";

export default function Settings() {
  const { currentUser, setUser, settings, updateSettings } = useApp();
  const router = useRouter();
  const [name, setName] = useState("");
  const [crewId, setCrewId] = useState("");
  const [requireDialog, setRequireDialog] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && currentUser) {
      setName(currentUser.name);
      setCrewId(currentUser.crewId);
    }
    if (mounted) {
      setRequireDialog(settings.requireUnconfirmDialog);
    }
  }, [mounted, currentUser, settings]);

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

  const handleToggleDialog = () => {
    const newValue = !requireDialog;
    setRequireDialog(newValue);
    updateSettings({ requireUnconfirmDialog: newValue });
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          {currentUser && (
            <button
              onClick={() => router.push("/")}
              className="p-3 hover:bg-zinc-800 rounded-lg transition-colors"
              aria-label="Back to track list"
            >
              <ArrowLeft className="w-7 h-7" />
            </button>
          )}
          {/* D.headerTitle */}
          <h1 id="D.headerTitle" className="text-3xl font-bold tracking-tight">
            Settings
          </h1>
          <div className="w-14" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
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
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-green-600 hover:bg-green-700 rounded-lg text-xl font-medium transition-colors"
          >
            Save Settings
          </button>
        </form>

        {/* D.sectionConfirmations */}
        <div id="D.sectionConfirmations" className="mt-12 pt-8 border-t border-zinc-800">
          <h2 className="text-2xl font-bold mb-6">Confirmations</h2>

          {/* D.unconfirmDialogToggle */}
          <button
            id="D.unconfirmDialogToggle"
            onClick={handleToggleDialog}
            className="w-full bg-zinc-800 hover:bg-zinc-700 p-5 rounded-xl text-left transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-medium">Require confirmation to unconfirm</span>
              <div className={`w-12 h-7 rounded-full transition-colors relative ${
                requireDialog ? "bg-green-600" : "bg-zinc-700"
              }`}>
                <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  requireDialog ? "translate-x-5" : ""
                }`} />
              </div>
            </div>
            
            {/* D.unconfirmHelpText */}
            <p id="D.unconfirmHelpText" className="text-sm text-zinc-500">
              When enabled, you'll be asked to confirm before unmarking a car as unconfirmed
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}