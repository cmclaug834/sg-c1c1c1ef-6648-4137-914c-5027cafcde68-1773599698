import { useRouter } from "next/router";
import { ArrowLeft, Calendar, ChevronDown, ScanBarcode, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { inspectionStorage } from "@/lib/inspectionStorage";
import { storage } from "@/lib/storage";
import { useApp } from "@/contexts/AppContext";

export default function NewInspection() {
  const router = useRouter();
  const { currentUser } = useApp();
  const [mounted, setMounted] = useState(false);
  
  // Load reference data
  const [referenceData, setReferenceData] = useState(storage.getReferenceData());
  
  // Form State
  const [site, setSite] = useState("");
  const [houseCode, setHouseCode] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [dateTime, setDateTime] = useState("");
  
  // Sheet State
  const [showSiteSheet, setShowSiteSheet] = useState(false);
  const [showHouseSheet, setShowHouseSheet] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  useEffect(() => {
    setMounted(true);
    const now = new Date();
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

  const handleBack = () => {
    setShowExitDialog(true);
  };

  const handleConfirmExit = () => {
    router.push("/inspections");
  };

  const handleNext = () => {
    if (!site || !carNumber) return;

    const newInspection = inspectionStorage.createInspection({
      templateId: "gp-rail-car-inspection-v1",
      status: "draft",
      currentStep: 1,
      
      houseCode,
      carNumber,
      site,
      startedAt: new Date().toISOString(),
      
      siteConducted: site,
      dateTime,
      houseNumber: houseCode,
      vehicleId: carNumber,
      
      media: {},
    });

    router.push(`/inspection/${newInspection.id}/page/1`);
  };

  const canProceed = site && carNumber;

  const siteOptions = referenceData.sites.length > 0 
    ? referenceData.sites 
    : ["CCF", "CI IF", "FM", "FR", "GMF", "GP", "NB"];

  const houseOptions = referenceData.houseCodes.length > 0
    ? referenceData.houseCodes
    : ["H2-1", "H2-2", "H2-3", "H1-1", "H1-2", "H1-3"];

  return (
    <div className="min-h-screen bg-zinc-900 text-white pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBack}
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
          
          {/* Site */}
          <div>
            <label className="block text-zinc-400 text-sm mb-2">
              Site <span className="text-red-500">*</span>
            </label>
            <button
              onClick={() => setShowSiteSheet(true)}
              className="w-full bg-zinc-800 text-left px-4 py-4 rounded-lg border-2 border-zinc-700 flex items-center justify-between group hover:border-zinc-600 transition-colors"
            >
              <span className={site ? "text-white" : "text-zinc-500"}>
                {site || "Select site..."}
              </span>
              <ChevronDown className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300" />
            </button>
          </div>

          {/* House Code */}
          <div>
            <label className="block text-zinc-400 text-sm mb-2">
              House Code
            </label>
            <button
              onClick={() => setShowHouseSheet(true)}
              className="w-full bg-zinc-800 text-left px-4 py-4 rounded-lg border-2 border-zinc-700 flex items-center justify-between group hover:border-zinc-600 transition-colors"
            >
              <span className={houseCode ? "text-white" : "text-zinc-500"}>
                {houseCode || "Select house code..."}
              </span>
              <ChevronDown className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300" />
            </button>
          </div>

          {/* Car Number */}
          <div>
            <label className="block text-zinc-400 text-sm mb-2">
              Car Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={carNumber}
                onChange={(e) => setCarNumber(e.target.value.toUpperCase())}
                placeholder="CN555555"
                className="w-full bg-zinc-800 text-white pl-4 pr-12 py-4 rounded-lg border-2 border-zinc-700 focus:border-green-500 focus:outline-none font-mono text-lg"
              />
              <button 
                onClick={() => alert("Barcode scan coming soon")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <ScanBarcode className="w-6 h-6" />
              </button>
            </div>
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

        </div>

        {/* Next Button */}
        <div className="mt-12">
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={`w-full py-4 rounded-lg text-lg font-bold transition-colors ${
              canProceed
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            }`}
          >
            Next
          </button>
          {!canProceed && (
            <p className="text-center text-sm text-zinc-500 mt-2">
              Site and Car Number are required
            </p>
          )}
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      {showExitDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-md border-2 border-zinc-800 p-6">
            <h3 className="text-xl font-bold mb-2">Exit Inspection?</h3>
            <p className="text-zinc-400 mb-6">
              You haven't started the inspection yet. Are you sure you want to exit?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitDialog(false)}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmExit}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Site Selection Sheet */}
      {showSiteSheet && (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50">
          <div className="bg-zinc-900 rounded-t-3xl w-full max-w-2xl border-t-2 border-zinc-800 p-6 animate-slide-up max-h-[80vh] overflow-y-auto">
            <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-6 flex-shrink-0" />
            <h3 className="text-xl font-bold mb-4">Select Site</h3>
            
            {siteOptions.length === 0 && (
              <div className="bg-amber-600/20 border border-amber-600/50 rounded-lg p-4 mb-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-400 text-sm font-medium mb-1">No sites configured</p>
                  <p className="text-amber-400/80 text-xs">
                    An admin needs to add site codes in Inspection Admin → Reference Lists
                  </p>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              {siteOptions.map((siteOption) => (
                <button
                  key={siteOption}
                  onClick={() => {
                    setSite(siteOption);
                    setShowSiteSheet(false);
                  }}
                  className={`w-full text-left px-4 py-4 rounded-lg text-lg font-medium transition-colors ${
                    site === siteOption
                      ? "bg-green-600/20 text-green-500 border border-green-600/50"
                      : "bg-zinc-800 hover:bg-zinc-700 text-white"
                  }`}
                >
                  {siteOption}
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
            <h3 className="text-xl font-bold mb-4">Select House Code</h3>
            
            {houseOptions.length === 0 && (
              <div className="bg-amber-600/20 border border-amber-600/50 rounded-lg p-4 mb-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-400 text-sm font-medium mb-1">No house codes configured</p>
                  <p className="text-amber-400/80 text-xs">
                    An admin needs to add house codes in Inspection Admin → Reference Lists
                  </p>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              {houseOptions.map((house) => (
                <button
                  key={house}
                  onClick={() => {
                    setHouseCode(house);
                    setShowHouseSheet(false);
                  }}
                  className={`w-full text-left px-4 py-4 rounded-lg text-lg font-medium transition-colors ${
                    houseCode === house
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