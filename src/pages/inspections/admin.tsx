import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Download, 
  Mail, 
  FileText, 
  Settings,
  Trash2,
  CheckCircle,
  Clock,
  Archive,
  RefreshCw,
  HardDrive
} from "lucide-react";
import { inspectionStorage } from "@/lib/inspectionStorage";
import { 
  exportAsJSON, 
  exportAsPDF, 
  getCompressedInspections,
  sendInspectionEmail
} from "@/lib/inspectionExport";
import { emailConfigStorage, EmailConfig } from "@/lib/emailConfig";
import { Inspection } from "@/types/inspection";

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "drafts" | "completed" | "storage" | "email">("all");
  
  // Data states
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [compressedStorage, setCompressedStorage] = useState<any[]>([]);
  const [emailConfig, setEmailConfig] = useState<EmailConfig | null>(null);
  
  // Filter/search states
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Email config states
  const [newEmail, setNewEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setIsRefreshing(true);
    try {
      // Load all inspections
      const active = inspectionStorage.getInspections();
      const completed = inspectionStorage.getCompletedInspections();
      const approved = inspectionStorage.getApprovedInspections();
      
      // Combine all types for admin view
      const all = [...active, ...completed, ...approved].sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      
      setInspections(all);
      
      // Load compressed storage stats
      setCompressedStorage(getCompressedInspections());
      
      // Load email config
      setEmailConfig(emailConfigStorage.getConfig());
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // --- Actions ---

  const handleDelete = (id: string, isCompleted: boolean) => {
    if (!confirm("Are you sure you want to delete this inspection permanently?")) return;
    
    if (isCompleted) {
      // Would need to add delete method to storage for completed/approved
      alert("Deleting completed inspections requires super-admin access.");
    } else {
      inspectionStorage.deleteInspection(id);
      loadData();
    }
  };

  const handleManualEmail = async (inspection: Inspection) => {
    if (!emailConfig || emailConfig.recipients.length === 0) {
      alert("Please configure email recipients in the Email Settings tab first.");
      setActiveTab("email");
      return;
    }

    setIsSending(true);
    try {
      // In a real app, you would pass the subject/body templates filled with data
      const subject = `Inspection Report: ${inspection.carNumber || 'Unknown'}`;
      const body = `Manual send of inspection report for ${inspection.carNumber}.`;
      
      await sendInspectionEmail(inspection, emailConfig.recipients, subject, body);
      alert("Email sent successfully!");
    } catch (error) {
      alert("Failed to send email. Check console for details.");
    } finally {
      setIsSending(false);
    }
  };

  // --- Email Config Actions ---

  const handleSaveEmailConfig = (updates: Partial<EmailConfig>) => {
    if (!emailConfig) return;
    const newConfig = { ...emailConfig, ...updates };
    setEmailConfig(newConfig);
    emailConfigStorage.saveConfig(newConfig);
  };

  const handleAddRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes("@")) return;
    
    emailConfigStorage.addRecipient(newEmail);
    setEmailConfig(emailConfigStorage.getConfig());
    setNewEmail("");
  };

  const handleRemoveRecipient = (email: string) => {
    emailConfigStorage.removeRecipient(email);
    setEmailConfig(emailConfigStorage.getConfig());
  };

  // --- Derived Data ---

  const filteredInspections = inspections.filter(i => {
    // Filter by tab
    if (activeTab === "drafts" && i.status === "complete") return false;
    if (activeTab === "completed" && i.status !== "complete") return false;
    
    // Filter by search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        i.carNumber?.toLowerCase().includes(term) ||
        i.id.toLowerCase().includes(term) ||
        i.site?.toLowerCase().includes(term)
      );
    }
    
    return true;
  });

  const totalStorageSize = compressedStorage.reduce((acc, curr) => acc + curr.size, 0);
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 p-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/settings')}
              className="p-2 -ml-2 rounded-full hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-white">Inspection Admin</h1>
          </div>
          
          <button 
            onClick={loadData}
            disabled={isRefreshing}
            className={`p-2 rounded-full hover:bg-zinc-800 transition-colors ${isRefreshing ? 'opacity-50' : ''}`}
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 flex flex-col md:flex-row gap-6">
        
        {/* Sidebar Navigation */}
        <aside className="md:w-64 flex-shrink-0">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden sticky top-24">
            <nav className="flex flex-col">
              <button 
                onClick={() => setActiveTab("all")}
                className={`flex items-center gap-3 p-4 text-left transition-colors ${activeTab === "all" ? "bg-blue-600/20 text-blue-400 border-l-2 border-blue-500" : "hover:bg-zinc-800 border-l-2 border-transparent"}`}
              >
                <FileText className="w-5 h-5" />
                <span className="font-medium">All Inspections</span>
              </button>
              
              <button 
                onClick={() => setActiveTab("drafts")}
                className={`flex items-center gap-3 p-4 text-left transition-colors ${activeTab === "drafts" ? "bg-orange-600/20 text-orange-400 border-l-2 border-orange-500" : "hover:bg-zinc-800 border-l-2 border-transparent"}`}
              >
                <Clock className="w-5 h-5" />
                <span className="font-medium">Active Drafts</span>
                <span className="ml-auto bg-zinc-800 text-xs px-2 py-1 rounded-full">
                  {inspections.filter(i => i.status !== "complete").length}
                </span>
              </button>
              
              <button 
                onClick={() => setActiveTab("completed")}
                className={`flex items-center gap-3 p-4 text-left transition-colors ${activeTab === "completed" ? "bg-green-600/20 text-green-400 border-l-2 border-green-500" : "hover:bg-zinc-800 border-l-2 border-transparent"}`}
              >
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Completed</span>
                <span className="ml-auto bg-zinc-800 text-xs px-2 py-1 rounded-full">
                  {inspections.filter(i => i.status === "complete").length}
                </span>
              </button>
              
              <div className="h-px bg-zinc-800 my-2"></div>
              
              <button 
                onClick={() => setActiveTab("email")}
                className={`flex items-center gap-3 p-4 text-left transition-colors ${activeTab === "email" ? "bg-purple-600/20 text-purple-400 border-l-2 border-purple-500" : "hover:bg-zinc-800 border-l-2 border-transparent"}`}
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">Auto-Email Config</span>
              </button>

              <button 
                onClick={() => setActiveTab("storage")}
                className={`flex items-center gap-3 p-4 text-left transition-colors ${activeTab === "storage" ? "bg-blue-600/20 text-blue-400 border-l-2 border-blue-500" : "hover:bg-zinc-800 border-l-2 border-transparent"}`}
              >
                <HardDrive className="w-5 h-5" />
                <span className="font-medium">Internal Storage</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          
          {/* TAB: Inspections List (All/Drafts/Completed) */}
          {(activeTab === "all" || activeTab === "drafts" || activeTab === "completed") && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search by car number, site, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* List */}
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                {filteredInspections.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No inspections found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800">
                    {filteredInspections.map((inspection) => (
                      <div key={inspection.id} className="p-4 hover:bg-zinc-800/50 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-bold text-white text-lg truncate">
                                {inspection.carNumber || "Unassigned Car"}
                              </h3>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                inspection.status === "complete" 
                                  ? "bg-green-500/20 text-green-400" 
                                  : "bg-orange-500/20 text-orange-400"
                              }`}>
                                {inspection.status.toUpperCase()}
                              </span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-400">
                              <span>ID: {inspection.id.split('-')[1]}</span>
                              <span>•</span>
                              <span>Site: {inspection.site || "N/A"}</span>
                              <span>•</span>
                              <span>Updated: {new Date(inspection.updatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {/* Edit (Drafts only) */}
                            {inspection.status !== "complete" && (
                              <button 
                                onClick={() => router.push(`/inspection/${inspection.id}/page/${inspection.currentStep || 1}`)}
                                className="px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg text-sm font-medium transition-colors"
                              >
                                Resume
                              </button>
                            )}
                            
                            {/* Review (Completed) */}
                            {inspection.status === "complete" && (
                              <button 
                                onClick={() => router.push('/inspections/review')}
                                className="px-3 py-1.5 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
                              >
                                View
                              </button>
                            )}

                            {/* Export PDF */}
                            <button 
                              onClick={() => exportAsPDF(inspection)}
                              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                              title="Export PDF"
                            >
                              <Download className="w-5 h-5" />
                            </button>

                            {/* Email */}
                            {inspection.status === "complete" && (
                              <button 
                                onClick={() => handleManualEmail(inspection)}
                                disabled={isSending}
                                className="p-1.5 text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 rounded-lg transition-colors"
                                title="Send Email"
                              >
                                <Mail className="w-5 h-5" />
                              </button>
                            )}

                            {/* Delete */}
                            <button 
                              onClick={() => handleDelete(inspection.id, inspection.status === "complete")}
                              className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: Email Configuration */}
          {activeTab === "email" && emailConfig && (
            <div className="space-y-6">
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <h2 className="text-xl font-bold text-white mb-2">Auto-Email Configuration</h2>
                <p className="text-zinc-400 text-sm mb-6">
                  Configure automatic email delivery when inspections are completed.
                </p>

                <div className="space-y-6">
                  {/* Master Toggle */}
                  <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                    <div>
                      <h3 className="font-medium text-white">Enable Auto-Send</h3>
                      <p className="text-sm text-zinc-500">Automatically send emails when inspection is finished</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={emailConfig.autoSendOnComplete}
                        onChange={(e) => handleSaveEmailConfig({ autoSendOnComplete: e.target.checked, enabled: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>

                  {/* Recipients List */}
                  <div>
                    <h3 className="font-medium text-white mb-3">Recipients List</h3>
                    <div className="space-y-2 mb-3">
                      {emailConfig.recipients.map(email => (
                        <div key={email} className="flex items-center justify-between bg-zinc-800 px-4 py-2 rounded-lg">
                          <span className="text-zinc-300">{email}</span>
                          <button 
                            onClick={() => handleRemoveRecipient(email)}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {emailConfig.recipients.length === 0 && (
                        <p className="text-sm text-orange-400 bg-orange-400/10 p-3 rounded-lg border border-orange-500/20">
                          No recipients configured. Auto-send will not work.
                        </p>
                      )}
                    </div>
                    
                    <form onSubmit={handleAddRecipient} className="flex gap-2">
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Add email address..."
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                      <button 
                        type="submit"
                        className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors font-medium"
                      >
                        Add
                      </button>
                    </form>
                  </div>

                  {/* Subject Template */}
                  <div>
                    <h3 className="font-medium text-white mb-2">Subject Template</h3>
                    <input
                      type="text"
                      value={emailConfig.subject}
                      onChange={(e) => handleSaveEmailConfig({ subject: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-xs text-zinc-500 mt-2">
                      Available variables: {'{{carNumber}}'}, {'{{date}}'}, {'{{site}}'}, {'{{status}}'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Internal Storage */}
          {activeTab === "storage" && (
            <div className="space-y-6">
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">Internal Storage</h2>
                    <p className="text-zinc-400 text-sm">Compressed copies of completed inspections.</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-400">{formatBytes(totalStorageSize)}</div>
                    <div className="text-xs text-zinc-500">Total Space Used</div>
                  </div>
                </div>

                <div className="bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
                      <tr>
                        <th className="p-3 font-medium">Car Number</th>
                        <th className="p-3 font-medium">Date</th>
                        <th className="p-3 font-medium">Size</th>
                        <th className="p-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {compressedStorage.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-zinc-500">
                            No compressed records found
                          </td>
                        </tr>
                      ) : (
                        compressedStorage.map((record) => (
                          <tr key={record.id} className="hover:bg-zinc-800/30">
                            <td className="p-3 font-medium text-white">{record.carNumber}</td>
                            <td className="p-3 text-zinc-400">{new Date(record.completedAt).toLocaleDateString()}</td>
                            <td className="p-3 text-zinc-400">{formatBytes(record.size)}</td>
                            <td className="p-3 text-right">
                              <button 
                                onClick={() => {
                                  // Mock download functionality for compressed record
                                  const a = document.createElement("a");
                                  a.href = record.dataUrl;
                                  a.download = `archive-${record.carNumber}.json`;
                                  a.click();
                                }}
                                className="text-blue-400 hover:text-blue-300 text-xs font-medium bg-blue-400/10 px-2 py-1 rounded"
                              >
                                Download RAW
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <h4 className="flex items-center gap-2 text-blue-400 font-medium mb-1">
                    <Archive className="w-4 h-4" /> About Internal Storage
                  </h4>
                  <p className="text-sm text-zinc-400">
                    When an inspection is completed, a "low-space" copy is generated by stripping out large media files (photos/videos). This compressed JSON string is saved permanently in localStorage to provide an audit trail without consuming too much device memory.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// Ensure X icon is available if used
function X(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" {...props}>
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}