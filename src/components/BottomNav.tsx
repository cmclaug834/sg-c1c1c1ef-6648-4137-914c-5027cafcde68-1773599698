import { useRouter } from "next/router";
import { ClipboardList, ArrowUpDown, Settings, ClipboardCheck } from "lucide-react";

/**
 * Bottom Navigation Component
 * 
 * IMPORTANT: Pages using this component MUST add pb-safe-bottom-nav class
 * to their main container to prevent content from being hidden.
 * 
 * Example:
 * <div className="min-h-screen pb-safe-bottom-nav">
 *   {content}
 * </div>
 */
export function BottomNav() {
  const router = useRouter();
  const { pathname } = router;

  const isYardCheckActive = pathname === "/tracks" || pathname.startsWith("/track/");
  const isReorderActive = pathname.startsWith("/reorder");
  const isInspectionsActive = pathname.startsWith("/inspection");
  const isSettingsActive = pathname.startsWith("/settings");

  const handleYardCheck = () => {
    router.push("/tracks");
  };

  const handleReorder = () => {
    router.push("/reorder");
  };

  const handleInspections = () => {
    router.push("/inspections");
  };

  const handleSettings = () => {
    router.push("/settings");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-50 pointer-events-auto">
      <div className="max-w-4xl mx-auto px-2 py-2" style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}>
        <div className="grid grid-cols-4 gap-2">
          {/* NAV.tabYardCheck */}
          <button
            id="NAV.tabYardCheck"
            onClick={handleYardCheck}
            className={`flex flex-col items-center gap-1 py-3 px-2 rounded-lg transition-colors ${
              isYardCheckActive
                ? "bg-green-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            <span className="text-xs font-medium">Yard</span>
          </button>

          {/* NAV.tabInspections */}
          <button
            id="NAV.tabInspections"
            onClick={handleInspections}
            className={`flex flex-col items-center gap-1 py-3 px-2 rounded-lg transition-colors ${
              isInspectionsActive
                ? "bg-green-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            <ClipboardCheck className="w-5 h-5" />
            <span className="text-xs font-medium">Inspect</span>
          </button>

          {/* NAV.tabReorder */}
          <button
            id="NAV.tabReorder"
            onClick={handleReorder}
            className={`flex flex-col items-center gap-1 py-3 px-2 rounded-lg transition-colors ${
              isReorderActive
                ? "bg-green-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            <ArrowUpDown className="w-5 h-5" />
            <span className="text-xs font-medium">Reorder</span>
          </button>

          {/* NAV.tabSettings */}
          <button
            id="NAV.tabSettings"
            onClick={handleSettings}
            className={`flex flex-col items-center gap-1 py-3 px-2 rounded-lg transition-colors ${
              isSettingsActive
                ? "bg-green-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs font-medium">Settings</span>
          </button>
        </div>
      </div>
    </nav>
  );
}