import { useState } from "react";
import { useRouter } from "next/router";
import { Download, Monitor, Smartphone, FileText, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";

export default function Downloads() {
  const router = useRouter();
  const [downloading, setDownloading] = useState<string | null>(null);

  const appVersion = "1.0.0";
  const serverVersion = "1.0.0";

  const handleDownload = async (type: string, url: string) => {
    setDownloading(type);
    
    // Simulate download initiation
    setTimeout(() => {
      // In production, this would trigger actual file download
      window.location.href = url;
      setDownloading(null);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white pb-safe-bottom-nav">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Downloads & Installation</h1>
            <p className="text-zinc-400 mt-1">Install desktop server or mobile apps</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-zinc-400 hover:text-white"
          >
            Back
          </Button>
        </div>

        {/* Desktop Server Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold">Desktop Server</h2>
          </div>

          <div className="bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden">
            {/* Server Header */}
            <div className="p-6 border-b border-zinc-700">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Tracking Sheet Server</h3>
                  <p className="text-sm text-zinc-400 mb-3">
                    Run on a Windows, Mac, or Linux computer to enable multi-device sync
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded border border-blue-600/30">
                      Version {serverVersion}
                    </span>
                    <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded border border-green-600/30">
                      Latest Release
                    </span>
                  </div>
                </div>
                <Monitor className="w-12 h-12 text-blue-400 opacity-50" />
              </div>
            </div>

            {/* Platform Downloads */}
            <div className="p-6 space-y-3">
              <p className="text-sm font-medium text-zinc-300 mb-4">Choose your platform:</p>

              {/* Windows */}
              <button
                onClick={() => handleDownload('windows', '/downloads/tracking-sheet-server-windows.exe')}
                disabled={downloading === 'windows'}
                className="w-full flex items-center justify-between p-4 bg-zinc-700/50 hover:bg-zinc-700 rounded-lg border border-zinc-600 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600/10 rounded-lg flex items-center justify-center border border-blue-600/30">
                    <Monitor className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Windows 10/11</p>
                    <p className="text-xs text-zinc-400">tracking-sheet-server-windows.exe • ~50MB</p>
                  </div>
                </div>
                <Download className={`w-5 h-5 transition-transform group-hover:translate-y-0.5 ${
                  downloading === 'windows' ? 'animate-bounce text-blue-400' : 'text-zinc-400'
                }`} />
              </button>

              {/* macOS */}
              <button
                onClick={() => handleDownload('macos', '/downloads/tracking-sheet-server-macos.dmg')}
                disabled={downloading === 'macos'}
                className="w-full flex items-center justify-between p-4 bg-zinc-700/50 hover:bg-zinc-700 rounded-lg border border-zinc-600 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600/10 rounded-lg flex items-center justify-center border border-blue-600/30">
                    <Monitor className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">macOS 10.15+</p>
                    <p className="text-xs text-zinc-400">tracking-sheet-server-macos.dmg • ~45MB</p>
                  </div>
                </div>
                <Download className={`w-5 h-5 transition-transform group-hover:translate-y-0.5 ${
                  downloading === 'macos' ? 'animate-bounce text-blue-400' : 'text-zinc-400'
                }`} />
              </button>

              {/* Linux */}
              <button
                onClick={() => handleDownload('linux', '/downloads/tracking-sheet-server-linux.AppImage')}
                disabled={downloading === 'linux'}
                className="w-full flex items-center justify-between p-4 bg-zinc-700/50 hover:bg-zinc-700 rounded-lg border border-zinc-600 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600/10 rounded-lg flex items-center justify-center border border-blue-600/30">
                    <Monitor className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Linux (AppImage)</p>
                    <p className="text-xs text-zinc-400">tracking-sheet-server-linux.AppImage • ~55MB</p>
                  </div>
                </div>
                <Download className={`w-5 h-5 transition-transform group-hover:translate-y-0.5 ${
                  downloading === 'linux' ? 'animate-bounce text-blue-400' : 'text-zinc-400'
                }`} />
              </button>
            </div>

            {/* Requirements */}
            <div className="p-6 bg-zinc-900/50 border-t border-zinc-700">
              <p className="text-xs font-medium text-zinc-400 mb-3">System Requirements:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-zinc-500">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>2GB RAM minimum (4GB recommended)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>500MB free disk space</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>WiFi or Local Network connection</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Port 3000 available (configurable)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Apps Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="w-5 h-5 text-green-400" />
            <h2 className="text-xl font-semibold">Mobile Apps</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Android */}
            <div className="bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Android</h3>
                  <Smartphone className="w-8 h-8 text-green-400 opacity-50" />
                </div>
                <p className="text-sm text-zinc-400 mb-4">
                  Android 8.0 or higher
                </p>
                <button
                  onClick={() => handleDownload('android', '/downloads/tracking-sheet-mobile.apk')}
                  disabled={downloading === 'android'}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
                >
                  <Download className={`w-4 h-4 ${downloading === 'android' ? 'animate-bounce' : ''}`} />
                  {downloading === 'android' ? 'Downloading...' : 'Download APK'}
                </button>
                <p className="text-xs text-zinc-500 mt-2 text-center">Version {appVersion} • 25MB</p>
              </div>
            </div>

            {/* iOS */}
            <div className="bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">iOS</h3>
                  <Smartphone className="w-8 h-8 text-green-400 opacity-50" />
                </div>
                <p className="text-sm text-zinc-400 mb-4">
                  iOS 13.0 or higher
                </p>
                <button
                  onClick={() => window.open('https://apps.apple.com/app/tracking-sheet', '_blank')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download from App Store
                </button>
                <p className="text-xs text-zinc-500 mt-2 text-center">Version {appVersion} • 22MB</p>
              </div>
            </div>
          </div>
        </div>

        {/* Installation Guide */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-yellow-400" />
            <h2 className="text-xl font-semibold">Installation Guide</h2>
          </div>

          <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
            <div className="space-y-6">
              {/* Server Setup */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center text-sm border border-blue-600/30">1</span>
                  Install Desktop Server
                </h3>
                <ol className="space-y-2 text-sm text-zinc-400 ml-8 list-decimal">
                  <li>Download the server for your operating system</li>
                  <li>Run the installer and follow the prompts</li>
                  <li>Launch "Tracking Sheet Server"</li>
                  <li>Note the IP address shown (e.g., 192.168.1.100:3000)</li>
                </ol>
              </div>

              {/* Mobile Setup */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-600/20 text-green-400 rounded-full flex items-center justify-center text-sm border border-green-600/30">2</span>
                  Connect Mobile Devices
                </h3>
                <ol className="space-y-2 text-sm text-zinc-400 ml-8 list-decimal">
                  <li>Install the mobile app on your phone/tablet</li>
                  <li>Open the app and go to Settings → Network & Server</li>
                  <li>Scan the QR code shown on the desktop server</li>
                  <li>Or manually enter the server IP address</li>
                  <li>Login with your credentials</li>
                </ol>
              </div>

              {/* Sync Setup */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-purple-600/20 text-purple-400 rounded-full flex items-center justify-center text-sm border border-purple-600/30">3</span>
                  Enable Sync
                </h3>
                <ol className="space-y-2 text-sm text-zinc-400 ml-8 list-decimal">
                  <li>On mobile: Settings → Network & Server → Enable Sync</li>
                  <li>Data will automatically sync when connected</li>
                  <li>Green status indicator shows active sync</li>
                  <li>Works on same WiFi network or local network</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="font-medium text-yellow-400">Important Notes:</p>
              <ul className="space-y-1 text-yellow-400/80">
                <li>• All devices must be on the same local network (WiFi)</li>
                <li>• Server computer must remain powered on for sync to work</li>
                <li>• Configure firewall to allow port 3000 (or your custom port)</li>
                <li>• First-time setup requires admin credentials</li>
                <li>• Data is stored locally - no cloud backup by default</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm text-zinc-400">
              <p className="font-medium text-white">Need Help?</p>
              <p>
                Having trouble with installation? Check the documentation or contact support.
              </p>
              <div className="flex gap-3 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('/docs', '_blank')}
                  className="text-xs"
                >
                  View Documentation
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('/support', '_blank')}
                  className="text-xs"
                >
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}