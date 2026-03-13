import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  ArrowLeft,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Download,
  Clock,
  Database,
  Server,
  Shield,
  Zap,
  FileText,
  Copy,
  Check,
} from "lucide-react";
import {
  runSystemHealthChecks,
  validateDependencies,
  testFeatureInteractions,
  exportHealthReport,
  saveHealthReport,
  getHealthReports,
  type SystemHealthReport,
  type HealthCheck,
  type DependencyValidation,
} from "@/lib/systemHealth";

export default function SystemHealthPage() {
  const router = useRouter();
  const [currentReport, setCurrentReport] = useState<SystemHealthReport | null>(null);
  const [historicalReports, setHistoricalReports] = useState<SystemHealthReport[]>([]);
  const [dependencies, setDependencies] = useState<DependencyValidation[]>([]);
  const [interactionTests, setInteractionTests] = useState<HealthCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "dependencies" | "interactions" | "history">("overview");

  useEffect(() => {
    loadHistoricalReports();
  }, []);

  const loadHistoricalReports = () => {
    const reports = getHealthReports();
    setHistoricalReports(reports);
    if (reports.length > 0 && !currentReport) {
      setCurrentReport(reports[0]);
    }
  };

  const runHealthCheck = async () => {
    setIsRunning(true);

    try {
      // Run all checks
      const report = await runSystemHealthChecks();
      const deps = await validateDependencies();
      const interactions = await testFeatureInteractions();

      setCurrentReport(report);
      setDependencies(deps);
      setInteractionTests(interactions);

      // Save to history
      saveHealthReport(report);
      loadHistoricalReports();
    } catch (error) {
      console.error("[SystemHealth] Health check failed:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopyReport = async () => {
    if (!currentReport) return;

    const reportText = exportHealthReport(currentReport);
    await navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const handleDownloadReport = () => {
    if (!currentReport) return;

    const reportText = exportHealthReport(currentReport);
    const blob = new Blob([reportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `health-report-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pass":
      case "healthy":
      case "valid":
        return "text-green-400 bg-green-500/10 border-green-500/20";
      case "warning":
      case "degraded":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
      case "fail":
      case "critical":
      case "missing":
        return "text-red-400 bg-red-500/10 border-red-500/20";
      default:
        return "text-zinc-400 bg-zinc-800 border-zinc-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
      case "healthy":
      case "valid":
        return <CheckCircle2 className="w-5 h-5" />;
      case "warning":
      case "degraded":
        return <AlertTriangle className="w-5 h-5" />;
      case "fail":
      case "critical":
      case "missing":
        return <XCircle className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "storage":
        return <Database className="w-4 h-4" />;
      case "api":
        return <Server className="w-4 h-4" />;
      case "sync":
        return <RefreshCw className="w-4 h-4" />;
      case "auth":
        return <Shield className="w-4 h-4" />;
      case "data":
        return <FileText className="w-4 h-4" />;
      case "ui":
        return <Zap className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/settings")}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-400" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Activity className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">System Health & Stability</h1>
                <p className="text-sm text-zinc-400">Ensure all dependencies and interactions remain stable</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="space-y-6">

          {/* Run Health Check Button */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white mb-2">Run System Health Check</h2>
                <p className="text-sm text-zinc-400">
                  Comprehensive validation of all system components, dependencies, and interactions
                </p>
              </div>
              <button
                onClick={runHealthCheck}
                disabled={isRunning}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <RefreshCw className={`w-5 h-5 ${isRunning ? "animate-spin" : ""}`} />
                {isRunning ? "Running..." : "Run Health Check"}
              </button>
            </div>
          </div>

          {/* Overall Status */}
          {currentReport && (
            <div className={`border-2 rounded-xl p-6 ${getStatusColor(currentReport.overall)}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(currentReport.overall)}
                  <div>
                    <h2 className="text-xl font-bold">
                      System Status: {currentReport.overall.toUpperCase()}
                    </h2>
                    <p className="text-sm opacity-80">
                      Last checked: {new Date(currentReport.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyReport}
                    className="p-2 bg-zinc-800/50 hover:bg-zinc-700 rounded-lg transition-colors"
                    title="Copy report to clipboard"
                  >
                    {copiedReport ? (
                      <Check className="w-5 h-5 text-green-400" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={handleDownloadReport}
                    className="p-2 bg-zinc-800/50 hover:bg-zinc-700 rounded-lg transition-colors"
                    title="Download report"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-zinc-900/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium">Passed</span>
                  </div>
                  <div className="text-2xl font-bold">{currentReport.passCount}</div>
                </div>
                <div className="bg-zinc-900/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium">Warnings</span>
                  </div>
                  <div className="text-2xl font-bold">{currentReport.warningCount}</div>
                </div>
                <div className="bg-zinc-900/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-medium">Failed</span>
                  </div>
                  <div className="text-2xl font-bold">{currentReport.failureCount}</div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          {currentReport && (
            <>
              <div className="flex gap-2 border-b border-zinc-800">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                    activeTab === "overview"
                      ? "text-white border-green-500"
                      : "text-zinc-400 border-transparent hover:text-white"
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("dependencies")}
                  className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                    activeTab === "dependencies"
                      ? "text-white border-green-500"
                      : "text-zinc-400 border-transparent hover:text-white"
                  }`}
                >
                  Dependencies
                </button>
                <button
                  onClick={() => setActiveTab("interactions")}
                  className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                    activeTab === "interactions"
                      ? "text-white border-green-500"
                      : "text-zinc-400 border-transparent hover:text-white"
                  }`}
                >
                  Interactions
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                    activeTab === "history"
                      ? "text-white border-green-500"
                      : "text-zinc-400 border-transparent hover:text-white"
                  }`}
                >
                  History
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {["storage", "api", "sync", "auth", "data", "ui"].map((category) => {
                    const checks = currentReport.checks.filter((c) => c.category === category);
                    if (checks.length === 0) return null;

                    return (
                      <div key={category} className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                          {getCategoryIcon(category)}
                          <h3 className="text-lg font-semibold text-white capitalize">{category}</h3>
                        </div>

                        <div className="space-y-3">
                          {checks.map((check) => (
                            <div
                              key={check.id}
                              className={`border rounded-lg p-4 ${getStatusColor(check.status)}`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-start gap-3">
                                  {getStatusIcon(check.status)}
                                  <div>
                                    <h4 className="font-semibold">{check.name}</h4>
                                    <p className="text-sm opacity-90 mt-1">{check.message}</p>
                                    {check.errorDetails && (
                                      <p className="text-xs opacity-75 mt-2 font-mono">
                                        Error: {check.errorDetails}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <span className="text-xs opacity-75">
                                  {new Date(check.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === "dependencies" && (
                <div className="space-y-4">
                  {dependencies.map((dep, idx) => (
                    <div
                      key={idx}
                      className={`border rounded-xl p-6 ${getStatusColor(dep.status)}`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">{dep.component}</h3>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(dep.status)}
                          <span className="font-semibold uppercase text-sm">{dep.status}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium opacity-75">Required Dependencies:</h4>
                        <ul className="space-y-1">
                          {dep.dependencies.map((d, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="w-4 h-4" />
                              {d}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {dep.issues.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-current/20">
                          <h4 className="text-sm font-medium mb-2">Issues:</h4>
                          <ul className="space-y-1">
                            {dep.issues.map((issue, i) => (
                              <li key={i} className="flex items-center gap-2 text-sm">
                                <XCircle className="w-4 h-4" />
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "interactions" && (
                <div className="space-y-3">
                  {interactionTests.map((test) => (
                    <div
                      key={test.id}
                      className={`border rounded-lg p-4 ${getStatusColor(test.status)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getStatusIcon(test.status)}
                          <div>
                            <h4 className="font-semibold">{test.name}</h4>
                            <p className="text-sm opacity-90 mt-1">{test.message}</p>
                            {test.errorDetails && (
                              <p className="text-xs opacity-75 mt-2 font-mono">
                                Error: {test.errorDetails}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-xs opacity-75">
                          {new Date(test.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "history" && (
                <div className="space-y-3">
                  {historicalReports.map((report, idx) => (
                    <div
                      key={idx}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        currentReport === report ? "border-green-500" : ""
                      } ${getStatusColor(report.overall)}`}
                      onClick={() => setCurrentReport(report)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(report.overall)}
                          <div>
                            <h4 className="font-semibold">
                              {report.overall.toUpperCase()} - {new Date(report.timestamp).toLocaleString()}
                            </h4>
                            <p className="text-sm opacity-75 mt-1">
                              {report.passCount} passed, {report.warningCount} warnings, {report.failureCount} failed
                            </p>
                          </div>
                        </div>
                        {idx === 0 && (
                          <span className="text-xs bg-zinc-900/50 px-2 py-1 rounded">Latest</span>
                        )}
                      </div>
                    </div>
                  ))}

                  {historicalReports.length === 0 && (
                    <div className="text-center py-12 text-zinc-500">
                      <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No health check history yet</p>
                      <p className="text-sm mt-1">Run your first health check to start tracking</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* No Report State */}
          {!currentReport && !isRunning && (
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-12 text-center">
              <Activity className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
              <h3 className="text-xl font-semibold text-white mb-2">No Health Check Run Yet</h3>
              <p className="text-zinc-400 mb-6">
                Run a comprehensive system health check to validate all dependencies and interactions
              </p>
              <button
                onClick={runHealthCheck}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Run First Health Check
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}