import { useApp } from "@/contexts/AppContext";
import { useRouter } from "next/router";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { profileStorage, CrewProfile } from "@/lib/profileStorage";

export default function FrontPage() {
  const { setUser, siteName } = useApp();
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [crewId, setCrewId] = useState("");
  const [profiles, setProfiles] = useState<CrewProfile[]>([]);
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [showCrewDropdown, setShowCrewDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const loadedProfiles = profileStorage.getProfiles();
    setProfiles(loadedProfiles);
    
    // Pre-fill with most recent profile if available
    const mostRecent = profileStorage.getMostRecent();
    if (mostRecent) {
      setName(mostRecent.name);
      setCrewId(mostRecent.crewId);
    }
  }, []);

  if (!mounted) {
    return null;
  }

  const handleProfileSelect = (profile: CrewProfile) => {
    setName(profile.name);
    setCrewId(profile.crewId);
    setShowNameDropdown(false);
    setShowCrewDropdown(false);
  };

  const handleStartYardCheck = () => {
    if (!name.trim() || !crewId.trim()) {
      return;
    }

    // Save/update profile
    profileStorage.upsertProfile(name.trim(), crewId.trim());

    // Set user in context (same as Settings used to do)
    setUser({
      id: `user-${Date.now()}`,
      name: name.trim(),
      crewId: crewId.trim(),
    });

    // Navigate to track list
    router.push("/tracks");
  };

  const mostRecent = profileStorage.getMostRecent();
  const isValid = name.trim() && crewId.trim();

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const uniqueNames = Array.from(new Set(profiles.map(p => p.name)));
  const uniqueCrewIds = Array.from(new Set(profiles.map(p => p.crewId)));

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
      <div className="max-w-md w-full px-4 py-8">
        {/* FRONT.headerTitle */}
        <div className="text-center mb-8">
          <h1 id="FRONT.headerTitle" className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
            {siteName}
          </h1>
          
          {/* FRONT.headerDate */}
          <p id="FRONT.headerDate" className="text-zinc-500 text-base md:text-lg">
            {currentDate}
          </p>
        </div>

        {/* FRONT.crewProfileSection */}
        <div id="FRONT.crewProfileSection" className="bg-zinc-800 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-6">Crew Profile</h2>

          {/* FRONT.nameField */}
          <div id="FRONT.nameField" className="mb-6 relative">
            <label className="block text-zinc-400 mb-2 text-base">Your Name</label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => uniqueNames.length > 0 && setShowNameDropdown(true)}
                className="w-full bg-zinc-900 text-white text-xl px-4 py-4 pr-12 rounded-lg border-2 border-zinc-700 focus:border-green-500 focus:outline-none"
                placeholder="John Doe"
              />
              {uniqueNames.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowNameDropdown(!showNameDropdown)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Name Dropdown */}
            {showNameDropdown && uniqueNames.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-zinc-900 border-2 border-zinc-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                {uniqueNames.map((profileName, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const profile = profiles.find(p => p.name === profileName);
                      if (profile) handleProfileSelect(profile);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-zinc-800 transition-colors text-base"
                  >
                    {profileName}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* FRONT.crewIdField */}
          <div id="FRONT.crewIdField" className="mb-4 relative">
            <label className="block text-zinc-400 mb-2 text-base">Crew ID</label>
            <div className="relative">
              <input
                type="text"
                value={crewId}
                onChange={(e) => setCrewId(e.target.value)}
                onFocus={() => uniqueCrewIds.length > 0 && setShowCrewDropdown(true)}
                className="w-full bg-zinc-900 text-white text-xl font-mono px-4 py-4 pr-12 rounded-lg border-2 border-zinc-700 focus:border-green-500 focus:outline-none"
                placeholder="CREW-001"
              />
              {uniqueCrewIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowCrewDropdown(!showCrewDropdown)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Crew ID Dropdown */}
            {showCrewDropdown && uniqueCrewIds.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-zinc-900 border-2 border-zinc-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                {uniqueCrewIds.map((profileCrewId, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const profile = profiles.find(p => p.crewId === profileCrewId);
                      if (profile) handleProfileSelect(profile);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-zinc-800 transition-colors text-base font-mono"
                  >
                    {profileCrewId}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* FRONT.lastUsedText */}
          {mostRecent && (
            <p id="FRONT.lastUsedText" className="text-sm text-zinc-500">
              Last used: {new Date(mostRecent.lastUsedAt).toLocaleString()}
            </p>
          )}
        </div>

        {/* FRONT.startBtn */}
        <button
          id="FRONT.startBtn"
          onClick={handleStartYardCheck}
          disabled={!isValid}
          className={`w-full py-5 rounded-xl text-xl font-bold transition-colors flex items-center justify-center gap-3 ${
            isValid
              ? "bg-green-600 hover:bg-green-700"
              : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
          }`}
        >
          Start Morning Yard Check
          <ArrowRight className="w-6 h-6" />
        </button>

        {/* FRONT.settingsLink */}
        <button
          id="FRONT.settingsLink"
          onClick={() => router.push("/settings")}
          className="w-full mt-4 py-3 text-zinc-400 hover:text-zinc-300 text-base transition-colors"
        >
          Go to Settings
        </button>
      </div>
    </div>
  );
}