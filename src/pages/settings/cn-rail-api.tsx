import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { ChevronLeft, Save, TestTube2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface CNRailAPIConfig {
  apiKey: string;
  apiEndpoint: string;
  enabled: boolean;
  lastTested?: string;
  testStatus?: "success" | "failed" | "pending" | null;
}

export default function CNRailAPISettings() {
  const router = useRouter();
  const [config, setConfig] = useState<CNRailAPIConfig>({
    apiKey: "",
    apiEndpoint: "https://api.cn.ca/v1",
    enabled: false,
    testStatus: null,
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Load config from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cn_rail_api_config");
      if (saved) {
        try {
          setConfig(JSON.parse(saved));
        } catch (error) {
          console.error("Failed to load CN Rail API config:", error);
        }
      }
    }
  }, []);

  const handleSave = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cn_rail_api_config", JSON.stringify(config));
      setSaveMessage("Configuration saved successfully");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setConfig({ ...config, testStatus: "pending" });

    // Simulate API test - replace with actual API call later
    setTimeout(() => {
      const testSuccess = config.apiKey.length > 0 && config.apiEndpoint.length > 0;
      setConfig({
        ...config,
        testStatus: testSuccess ? "success" : "failed",
        lastTested: new Date().toISOString(),
      });
      setIsTesting(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-950 text-white pb-safe-bottom-nav">
      {/* Header */}
      <div className="bg-zinc-900/50 border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push("/settings")}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold">CN Rail API Settings</h1>
            <p className="text-sm text-zinc-400">Configure Canadian National Railway API integration</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Save Message */}
        {saveMessage && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-green-400">
            {saveMessage}
          </div>
        )}

        {/* API Configuration Card */}
        <Card className="bg-zinc-800 border-zinc-700 p-6">
          <h2 className="text-lg font-semibold mb-4">API Configuration</h2>
          
          <div className="space-y-4">
            {/* Enable Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enabled" className="text-base">Enable CN Rail API</Label>
                <p className="text-sm text-zinc-400">Activate integration with Canadian National Railway</p>
              </div>
              <button
                id="enabled"
                onClick={() => setConfig({ ...config, enabled: !config.enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.enabled ? "bg-blue-600" : "bg-zinc-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* API Endpoint */}
            <div className="space-y-2">
              <Label htmlFor="endpoint">API Endpoint URL</Label>
              <Input
                id="endpoint"
                type="text"
                value={config.apiEndpoint}
                onChange={(e) => setConfig({ ...config, apiEndpoint: e.target.value })}
                placeholder="https://api.cn.ca/v1"
                className="bg-zinc-900 border-zinc-700"
              />
              <p className="text-xs text-zinc-500">Base URL for CN Rail API requests</p>
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder="Enter your CN Rail API key"
                  className="bg-zinc-900 border-zinc-700 pr-10"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-zinc-500">Your authentication key for CN Rail API access</p>
            </div>

            {/* Test Connection */}
            <div className="pt-4 border-t border-zinc-700">
              <div className="flex items-center justify-between mb-2">
                <Label>Connection Status</Label>
                {config.lastTested && (
                  <span className="text-xs text-zinc-500">
                    Last tested: {new Date(config.lastTested).toLocaleString()}
                  </span>
                )}
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={handleTestConnection}
                  disabled={isTesting || !config.apiKey || !config.apiEndpoint}
                  className="flex-1 bg-zinc-700 hover:bg-zinc-600"
                >
                  <TestTube2 className="w-4 h-4 mr-2" />
                  {isTesting ? "Testing..." : "Test Connection"}
                </Button>
                
                {config.testStatus && (
                  <div className={`flex items-center px-4 py-2 rounded-lg ${
                    config.testStatus === "success" 
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : config.testStatus === "failed"
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                  }`}>
                    {config.testStatus === "success" && "✓ Connected"}
                    {config.testStatus === "failed" && "✗ Failed"}
                    {config.testStatus === "pending" && "⏳ Testing..."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* API Documentation Card */}
        <Card className="bg-zinc-800 border-zinc-700 p-6">
          <h2 className="text-lg font-semibold mb-4">API Documentation</h2>
          <div className="space-y-3 text-sm text-zinc-300">
            <p>
              The CN Rail API integration allows you to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Automatically fetch railcar availability and status</li>
              <li>Sync inspection data with CN Rail systems</li>
              <li>Retrieve real-time track and yard information</li>
              <li>Update car location and movement records</li>
            </ul>
            <div className="mt-4 pt-4 border-t border-zinc-700">
              <p className="text-zinc-400">
                For API credentials and documentation, contact your CN Rail representative or visit{" "}
                <a 
                  href="https://www.cn.ca/en/customer-centre/developer-resources" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  CN Developer Resources
                </a>
              </p>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex gap-3 sticky bottom-4">
          <Button
            onClick={() => router.push("/settings")}
            variant="outline"
            className="flex-1 bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </div>
    </div>
  );
}