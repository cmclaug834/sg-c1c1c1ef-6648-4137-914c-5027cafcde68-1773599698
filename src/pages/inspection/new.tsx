import { useRouter } from "next/router";
import { ArrowLeft, Calendar, ChevronDown, ScanBarcode } from "lucide-react";
import { useState, useEffect } from "react";
import { inspectionStorage } from "@/lib/inspectionStorage";
import { useApp } from "@/contexts/AppContext";

const SITE_OPTIONS = ["CCF", "CI IF", "FM", "FR", "GMF", "GP", "NB"];
const HOUSE_OPTIONS = ["H2-1", "H2-2", "H2-3", "H1-1", "H1-2", "H1-3"];

export default function NewInspection() {
  const router = useRouter();
  const { currentUser } = useApp();
  const [mounted, setMounted] = useState(false);
  
  // Form State
  const [siteConducted, setSiteConducted] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [loadNo, setLoadNo] = useState("");
  
  // Sheet State
  const [showSiteSheet, setShowSiteSheet] = useState(false);
  const [showHouseSheet, setShowHouseSheet] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Set current date/time in local format slightly formatted for input if needed
    // or just display string. Screenshot implies a display string or picker.
    // We'll use ISO string for storage, formatted string for display
    const now = new Date();
    // Format: YYYY-MM-DDTHH:mm
    const localIso = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    setDateTime(localIso);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (currentUser === null) {
      router.push("/");
    }
  }, [mounted, currentUser, router]);

  if (!mounted || !currentUser) return null;

  const handleNext = () => {
    // Create the inspection record
    const newInspection = inspectionStorage.createInspection({
      templateId: "gp-rail-car-inspection-v1",
      status: "draft",
      siteConducted,
      dateTime,
      houseNumber,
      vehicleId,
      loadNo,
      media: {},
    });

    // Navigate to Page 1
    router.push(`/inspection/${newInspection.id}/page/1`);
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Start Inspection</h1>
            <p className="text-zinc-400 text-sm">Title Page</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          
          {/* Site Conducted */}
          <div>
            <label className="block text-zinc-400 text-sm mb-2">
              Site Conducted <span className="text-red-500">*</span>
            </label>
            <button
              onClick={() => setShowSiteSheet(true)}
              className="w-full bg-zinc-800 text-left px-4 py-4 rounded-lg border-2 border-zinc-700 flex items-center justify-between group hover:border-zinc-600 transition-colors"
            >
              <span className={siteConducted ? "text-white" : "text-zinc-500"}>
                {siteConducted || "Select site..."}
              </span>
              <ChevronDown className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300" />
            </button>
          </div>

          {/* Date/Time */}
          <div>
            <label className="block text-zinc-400 text-sm mb-2">
              Date/Time
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full bg-zinc-800 text-white px-4 py-4 rounded-lg border-2 border-zinc-700 focus:border-green-500 focus:outline-none appearance-none"
              />
              <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          {/* House # */}
          <div>
            <label className="block text-zinc-400 text-sm mb-2">
              House #
            </label>
            <button
              onClick={() => setShowHouseSheet(true)}
              className="w-full bg-zinc-800 text-left px-4 py-4 rounded-lg border-2 border-zinc-700 flex items-center justify-between group hover:border-zinc-600 transition-colors"
            >
              <span className={houseNumber ? "text-white" : "text-zinc-500"}>
                {houseNumber || "Select house number..."}
              </span>
              <ChevronDown className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300" />
            </button>
          </div>

          {/* Vehicle ID */}
          <div>
            <label className="block text-zinc-400 text-sm mb-2">
              Vehicle ID <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                placeholder="Enter vehicle ID"
                className="w-full bg-zinc-800 text-white pl-4 pr-12 py-4 rounded-lg border-2 border-zinc-700 focus:border-green-500 focus:outline-none"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors">
                <ScanBarcode className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Load No */}
          <div>
            <label className="block text-zinc-400 text-sm mb-2">
              Load No
            </label>
            <input
              type="text"
              value={loadNo}
              onChange={(e) => setLoadNo(e.target.value)}
              placeholder="Enter load number"
              className="w-full bg-zinc-800 text-white px-4 py-4 rounded-lg border-2 border-zinc-700 focus:border-green-500 focus:outline-none"
            />
          </div>

        </div>

        {/* Next Button */}
        <div className="mt-12">
          <button
            onClick={handleNext}
            disabled={!siteConducted || !vehicleId}
            className={`w-full py-4 rounded-lg text-lg font-bold transition-colors ${
              siteConducted && vehicleId
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            }`}
          >
            Next
          </button>
        </div>
      </div>

      {/* Site Selection Sheet */}
      {showSiteSheet && (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50">
          <div className="bg-zinc-900 rounded-t-3xl w-full max-w-2xl border-t-2 border-zinc-800 p-6 animate-slide-up max-h-[80vh] overflow-y-auto">
            <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-6 flex-shrink-0" />
            <h3 className="text-xl font-bold mb-4">Select Site</h3>
            <div className="space-y-2">
              {SITE_OPTIONS.map((site) => (
                <button
                  key={site}
                  onClick={() => {
                    setSiteConducted(site);
                    setShowSiteSheet(false);
                  }}
                  className={`w-full text-left px-4 py-4 rounded-lg text-lg font-medium transition-colors ${
                    siteConducted === site
                      ? "bg-green-600/20 text-green-500 border border-green-600/50"
                      : "bg-zinc-800 hover:bg-zinc-700 text-white"
                  }`}
                >
                  {site}
                </button>
              ))}
              <button
                onClick={() => setShowSiteSheet(false)}
                className="w-full text-center px-4 py-4 mt-4 text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* House Selection Sheet */}
      {showHouseSheet && (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50">
          <div className="bg-zinc-900 rounded-t-3xl w-full max-w-2xl border-t-2 border-zinc-800 p-6 animate-slide-up max-h-[80vh] overflow-y-auto">
            <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-6 flex-shrink-0" />
            <h3 className="text-xl font-bold mb-4">Select House #</h3>
            <div className="space-y-2">
              {HOUSE_OPTIONS.map((house) => (
                <button
                  key={house}
                  onClick={() => {
                    setHouseNumber(house);
                    setShowHouseSheet(false);
                  }}
                  className={`w-full text-left px-4 py-4 rounded-lg text-lg font-medium transition-colors ${
                    houseNumber === house
                      ? "bg-green-600/20 text-green-500 border border-green-600/50"
                      : "bg-zinc-800 hover:bg-zinc-700 text-white"
                  }`}
                >
                  {house}
                </button>
              ))}
              <button
                onClick={() => setShowHouseSheet(false)}
                className="w-full text-center px-4 py-4 mt-4 text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}