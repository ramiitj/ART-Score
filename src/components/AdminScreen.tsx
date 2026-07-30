import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Lock, Settings, Download, Search, LogOut, Globe, Cpu, Eye, 
  RefreshCw, FileText, CheckCircle, ArrowLeft, Terminal, ShieldAlert 
} from "lucide-react";

interface AdminScreenProps {
  onBack: () => void;
}

export default function AdminScreen({ onBack }: AdminScreenProps) {
  // Login credentials. The password doubles as the admin API key: it is
  // verified server-side and then sent as X-Admin-Key on each admin request.
  // It is held in memory only -- never localStorage, so it does not outlive
  // the tab or survive into another session.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [errorLogin, setErrorLogin] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [validityReport, setValidityReport] = useState<any | null>(null);

  // Administrative stats
  const [activePrompt, setActivePrompt] = useState("");
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [filteredAttempts, setFilteredAttempts] = useState<any[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Expandable row state
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null);

  // Every admin route is guarded by requireAdminAuth server-side, so each
  // request must carry the key. These fetches previously sent no header at
  // all, so they 401'd and the dashboard silently rendered empty.
  const authHeaders = (extra: Record<string, string> = {}) => ({
    "X-Admin-Key": adminKey,
    ...extra,
  });

  const loadAdminData = async () => {
    setLoadingAttempts(true);
    setLoadError("");
    try {
      const [promptRes, attemptsRes, auditRes, validityRes] = await Promise.all([
        fetch("/api/system-prompt", { headers: authHeaders() }),
        fetch("/api/admin/attempts", { headers: authHeaders() }),
        fetch("/api/admin/audit-log", { headers: authHeaders() }),
        fetch("/api/admin/validity-report", { headers: authHeaders() }),
      ]);

      if (promptRes.ok) {
        const pData = await promptRes.json();
        setActivePrompt(pData.systemPrompt || "");
      }

      if (attemptsRes.ok) {
        const aData = await attemptsRes.json();
        setAttempts(aData || []);
        setFilteredAttempts(aData || []);
      } else {
        // Surface it rather than showing a convincing but empty dashboard.
        setLoadError(
          attemptsRes.status === 401
            ? "Session rejected by the server. Please sign in again."
            : `Could not load attempts (HTTP ${attemptsRes.status}).`
        );
      }

      if (auditRes.ok) setAuditLog((await auditRes.json()) || []);
      if (validityRes.ok) setValidityReport(await validityRes.json());
    } catch (e) {
      console.error("Failed to load admin dashboard.", e);
      setLoadError("Could not reach the server. Check your connection and retry.");
    } finally {
      setLoadingAttempts(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }
  }, [isAuthenticated]);

  // Search filter effect
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredAttempts(attempts);
      return;
    }
    const lower = searchTerm.toLowerCase();
    const filtered = attempts.filter(att => 
      (att.userName || "").toLowerCase().includes(lower) ||
      (att.userEmail || "").toLowerCase().includes(lower) ||
      (att.domain || "").toLowerCase().includes(lower) ||
      (att.difficulty || "").toLowerCase().includes(lower) ||
      (att.ipAddress || "").toLowerCase().includes(lower) ||
      (att.geolocation?.city || "").toLowerCase().includes(lower) ||
      (att.geolocation?.country || "").toLowerCase().includes(lower)
    );
    setFilteredAttempts(filtered);
  }, [searchTerm, attempts]);

  // Login execution. Credentials are verified by the server against
  // ADMIN_KEYS (constant-time) -- they are no longer compared against values
  // baked into this bundle, which shipped the real password to every visitor.
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setErrorLogin("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setAdminKey(password);
        setIsAuthenticated(true);
        setPassword("");
      } else {
        setErrorLogin(data?.error || "Invalid credentials.");
      }
    } catch (_) {
      setErrorLogin("Could not reach the server. Check your connection and try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Save prompt execution
  const handleSavePrompt = async () => {
    if (!activePrompt.trim()) return;
    setIsSavingPrompt(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/system-prompt", {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ systemPrompt: activePrompt }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingPrompt(false);
    }
  };

  // Generic JSON export. The CSV below flattens nested fields (geolocation,
  // judge metadata, headroomShadow, the gap manifest results), so the raw
  // JSON is what you want for any real analysis.
  const downloadJSON = (data: any, name: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ART_${name}_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // CSV compiler & downloader
  const handleDownloadCSV = () => {
    if (attempts.length === 0) return;

    // Define column headers
    const headers = [
      "Timestamp",
      "Session ID",
      "Anonymized User ID",
      "User Name",
      "User Email",
      "Domain",
      "Challenge Tier",
      "ART Score",
      "Time Allocated (s)",
      "Time Taken (s)",
      "User Signals Edit Count",
      "User Signals Retried",
      "Age",
      "Gender",
      "Education",
      "Work Experience",
      "IP Address",
      "Geo City",
      "Geo Region",
      "Geo Country",
      "Geo Lat/Lng",
      "Geo ISP",
      "System OS",
      "System Browser",
      "System Screen Size",
      "System Timezone",
      "System Touch",
      "Task Description",
      "AI Baseline Document",
      "Human Edited Prompt",
      "Feedback Comment",
      "Judge Model Version",
      "Judge Prompt Hash",
      "Triage Guardrail Fired",
      "Triage Cap Applied",
      "Baseline Length",
      "Revision Length",
      "Dim: Clarity (Score)",
      "Dim: Clarity (Rationale)",
      "Dim: Depth (Score)",
      "Dim: Depth (Rationale)",
      "Dim: Structure (Score)",
      "Dim: Structure (Rationale)",
      "Dim: Actionability (Score)",
      "Dim: Actionability (Rationale)",
      "Dim: Domain (Score)",
      "Dim: Domain (Rationale)",
      "Score Dimension Strengths"
    ];

    // Build row blocks mapping
    const rows = attempts.map(att => {
      const timestamp = att.timestamp || "";
      const sessionId = att.sessionId || "";
      const anonymizedUserId = att.anonymizedUserId || "";
      const name = att.userName || "";
      const userEmail = att.userEmail || "";
      const domain = att.domain || "";
      const difficulty = att.difficulty || "";
      const score = att.score !== undefined ? att.score : "";
      const allocated = att.timeAllocated !== undefined ? att.timeAllocated : "";
      const taken = att.timeTaken !== undefined ? att.timeTaken : "";
      const editCount = att.userSignals?.editCount !== undefined ? att.userSignals.editCount : "";
      const retried = att.userSignals?.retried !== undefined ? att.userSignals.retried : "";
      const age = att.age || "";
      const gender = att.gender || "";
      const education = att.education || "";
      const experience = att.workExperience || "";
      const ip = att.ipAddress || "";
      const city = att.geolocation?.city || "";
      const region = att.geolocation?.region || "";
      const country = att.geolocation?.country || "";
      const coord = att.geolocation?.latitude !== undefined ? `${att.geolocation.latitude}/${att.geolocation.longitude}` : "";
      const isp = att.geolocation?.isp || "";
      const os = att.systemDetails?.platform || "";
      const ua = att.systemDetails?.userAgent || "";
      const screen = att.systemDetails?.screenWidth ? `${att.systemDetails.screenWidth}x${att.systemDetails.screenHeight}` : "";
      const tz = att.systemDetails?.timezone || "";
      const touch = att.systemDetails?.touchSupported !== undefined ? String(att.systemDetails.touchSupported) : "";
      const task = att.task || "";
      const baseline = att.baseline || "";
      const revision = att.editedPrompt || "";
      const feedback = att.feedback || "";
      
      const evalMetadata = att.evaluation?.judgeMetadata;
      const modelVersion = evalMetadata?.modelVersion || "";
      const promptHash = evalMetadata?.promptHash || "";
      
      const triage = att.evaluation?.triageFlags;
      const guardrailFired = triage?.guardrailFired !== undefined ? String(triage.guardrailFired) : "";
      const capApplied = triage?.capApplied !== undefined ? String(triage.capApplied) : "";
      
      const textTel = att.evaluation?.textTelemetry;
      const baselineLength = textTel?.baselineLength !== undefined ? textTel.baselineLength : "";
      const revisionLength = textTel?.revisionLength !== undefined ? textTel.revisionLength : "";
      
      const mapDim = (title: string) => {
        const d = att.evaluation?.dimensionScores?.find(s => s.dimension.includes(title));
        return { score: d?.score !== undefined ? String(d.score) : "", rationale: d?.rationale || "" };
      };
      const dimClarity = mapDim("Clarity");
      const dimDepth = mapDim("Depth");
      const dimStructure = mapDim("Structure");
      const dimActionability = mapDim("Actionability");
      const dimDomain = mapDim("Domain");

      const dimensions = att.evaluation?.strengths ? att.evaluation.strengths.join(" | ") : "";

      // Escape fields with quotes and handle inner quotes
      const cleanField = (val: any) => {
        let text = typeof val === "string" ? val : String(val);
        text = text.replace(/"/g, '""'); // double up quotes
        return `"${text}"`;
      };

      return [
        cleanField(timestamp),
        cleanField(sessionId),
        cleanField(anonymizedUserId),
        cleanField(name),
        cleanField(userEmail),
        cleanField(domain),
        cleanField(difficulty),
        cleanField(score),
        cleanField(allocated),
        cleanField(taken),
        cleanField(editCount),
        cleanField(retried),
        cleanField(age),
        cleanField(gender),
        cleanField(education),
        cleanField(experience),
        cleanField(ip),
        cleanField(city),
        cleanField(region),
        cleanField(country),
        cleanField(coord),
        cleanField(isp),
        cleanField(os),
        cleanField(ua),
        cleanField(screen),
        cleanField(tz),
        cleanField(touch),
        cleanField(task),
        cleanField(baseline),
        cleanField(revision),
        cleanField(feedback),
        cleanField(modelVersion),
        cleanField(promptHash),
        cleanField(guardrailFired),
        cleanField(capApplied),
        cleanField(baselineLength),
        cleanField(revisionLength),
        cleanField(dimClarity.score),
        cleanField(dimClarity.rationale),
        cleanField(dimDepth.score),
        cleanField(dimDepth.rationale),
        cleanField(dimStructure.score),
        cleanField(dimStructure.rationale),
        cleanField(dimActionability.score),
        cleanField(dimActionability.rationale),
        cleanField(dimDomain.score),
        cleanField(dimDomain.rationale),
        cleanField(dimensions)
      ].join(",");
    });

    // Assemble file content
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\r\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ART_User_Database_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Convert ISO string to legible datetime
  const formatDatetime = (isoStr: string) => {
    if (!isoStr) return "";
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (_) {
      return isoStr;
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-3 px-4 font-sans select-none">
      
      {/* 1. Login State */}
      {!isAuthenticated ? (
        <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="bg-neutral-900 px-6 py-5 text-center text-white">
            <div className="inline-flex w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/20 text-amber-500 items-center justify-center mb-2">
              <Lock className="w-5 h-5 animate-pulse" />
            </div>
            <h2 className="font-mono text-sm uppercase tracking-widest font-bold">Admin Portal</h2>
            <p className="text-neutral-400 text-xs mt-1">Authenticate to access evaluation metrics and prompts.</p>
          </div>
          
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            {errorLogin && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-[11px] font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{errorLogin}</span>
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 font-mono block">
                Security Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full text-xs px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 font-mono block">
                Security Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 font-medium"
              />
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onBack}
                className="text-neutral-500 hover:text-neutral-800 text-xs font-bold leading-none py-2 px-3 hover:bg-neutral-50 rounded-lg transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to App
              </button>
              
              <button
                type="submit"
                disabled={isLoggingIn || !email.trim() || !password}
                className="bg-neutral-900 border border-neutral-900 text-white rounded-lg px-4 py-2 text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 hover:bg-neutral-950 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isLoggingIn ? "Signing in..." : "Sign In"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        
        // 2. Authenticated Board State
        <div className="space-y-6">

          {/* Never render a convincing-looking empty dashboard when the data
              actually failed to load -- say so. */}
          {loadError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-4 py-3 text-xs font-semibold flex items-center justify-between gap-3">
              <span>{loadError}</span>
              <button
                onClick={loadAdminData}
                className="bg-white border border-rose-300 text-rose-700 rounded px-3 py-1 text-[11px] font-bold uppercase tracking-wider hover:bg-rose-50 cursor-pointer flex-shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {/* Header Action Row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-neutral-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold font-mono text-amber-600 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded">
                  Admin Active Control panel
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-neutral-800 tracking-tight font-sans mt-1">
                Evaluation Engine Controller
              </h2>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={loadAdminData}
                disabled={loadingAttempts}
                className="p-1.5 border border-neutral-200 rounded-lg text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 transition-colors flex items-center justify-center disabled:opacity-50"
                title="Refresh Panel Data"
              >
                <RefreshCw className={`w-4 h-4 ${loadingAttempts ? "animate-spin" : ""}`} />
              </button>
              
              <button
                onClick={onBack}
                className="text-neutral-700 bg-neutral-100 hover:bg-neutral-200 text-xs font-bold px-3.5 py-1.5 rounded-lg border border-neutral-250 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Go back to App
              </button>
              
              <button
                onClick={() => setIsAuthenticated(false)}
                className="text-white bg-rose-600 hover:bg-rose-700 text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>

          {/* Prompt Section Card */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-xs space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-neutral-500" />
                <h3 className="text-xs font-mono uppercase font-bold text-neutral-600 tracking-wider">
                  Active Evaluator Instruction Model (System Prompt)
                </h3>
              </div>
              {saveSuccess && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Prompt Updated Successfully!
                </span>
              )}
            </div>

            <p className="text-xs text-neutral-400 font-medium select-none">
              This prompt regulates Gemini's intelligence scenarios and grading weights. Modifying it changes prompt guidelines, baseline generation parameters, difficulty calculations, and ART score benchmarks dynamically.
            </p>

            <textarea
              className="w-full h-44 text-xs font-mono p-3 bg-neutral-900 text-neutral-200 border border-neutral-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 selection:bg-amber-600/30"
              value={activePrompt}
              onChange={e => setActivePrompt(e.target.value)}
              placeholder="System prompt text..."
            />

            <div className="flex justify-end pt-1">
              <button
                onClick={handleSavePrompt}
                disabled={isSavingPrompt}
                className="bg-neutral-900 text-white hover:bg-black transition-colors border border-black rounded-lg text-xs font-bold uppercase tracking-wider px-4 py-2 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Settings className={`w-4 h-4 ${isSavingPrompt ? "animate-spin" : ""}`} />
                {isSavingPrompt ? "Saving to Firestore..." : "Update System Prompt & Instruction"}
              </button>
            </div>
          </div>

          {/* Attempts Data Database Section */}
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
            
            {/* Top Table Control Bar */}
            <div className="px-5 py-4 bg-neutral-50/50 border-b border-neutral-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="font-bold text-neutral-800 text-sm">Participant Submissions Log</h3>
                <p className="text-[11px] text-neutral-400 font-medium">
                  Showing {filteredAttempts.length} of {attempts.length} attempts retrieved from Cloud Firestore.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 text-neutral-450 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search candidate, domain..."
                    className="w-full text-xs pl-8 pr-3 py-1.5 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400 font-medium bg-white"
                  />
                </div>

                <button
                  onClick={() => downloadJSON(attempts, "attempts")}
                  disabled={attempts.length === 0}
                  className="bg-white text-neutral-700 cursor-pointer hover:bg-neutral-50 font-bold text-xs uppercase tracking-wider px-3.5 py-1.8 rounded-lg border border-neutral-300 flex items-center gap-1.5 text-nowrap disabled:opacity-50"
                  title="Full attempt records, including every field the CSV flattens away"
                >
                  <Download className="w-4 h-4" /> JSON
                </button>

                <button
                  onClick={() => downloadJSON(auditLog, "admin-audit-log")}
                  disabled={auditLog.length === 0}
                  className="bg-white text-neutral-700 cursor-pointer hover:bg-neutral-50 font-bold text-xs uppercase tracking-wider px-3.5 py-1.8 rounded-lg border border-neutral-300 flex items-center gap-1.5 text-nowrap disabled:opacity-50"
                  title="Admin action audit log"
                >
                  <Download className="w-4 h-4" /> Audit ({auditLog.length})
                </button>

                <button
                  onClick={() => validityReport && downloadJSON(validityReport, "validity-report")}
                  disabled={!validityReport}
                  className="bg-white text-neutral-700 cursor-pointer hover:bg-neutral-50 font-bold text-xs uppercase tracking-wider px-3.5 py-1.8 rounded-lg border border-neutral-300 flex items-center gap-1.5 text-nowrap disabled:opacity-50"
                  title="Variance decomposition, score-shift report and validity monitors"
                >
                  <Download className="w-4 h-4" /> Validity
                </button>

                <button
                  onClick={handleDownloadCSV}
                  disabled={attempts.length === 0}
                  className="bg-amber-500 text-white cursor-pointer hover:bg-amber-600 font-bold text-xs uppercase tracking-wider px-3.5 py-1.8 rounded-lg border border-amber-600 flex items-center gap-1.5 text-nowrap disabled:opacity-50"
                >
                  <Download className="w-4 h-4" /> Download CSV
                </button>
              </div>
            </div>

            {/* Complete Data Matrix View Grid */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-left border-collapse select-none">
                <thead>
                  <tr className="bg-neutral-50 text-[10px] text-neutral-400 font-mono uppercase tracking-wider border-b border-neutral-200">
                    <th className="py-2.5 px-4 font-bold">Timestamp</th>
                    <th className="py-2.5 px-4 font-bold">Candidate Details</th>
                    <th className="py-2.5 px-4 font-bold">Selected Domain</th>
                    <th className="py-2.5 px-4 font-bold text-center">Difficulty</th>
                    <th className="py-2.5 px-4 font-bold text-center">Score</th>
                    <th className="py-2.5 px-4 font-bold">IP & Geolocation</th>
                    <th className="py-2.5 px-4 font-bold">System details</th>
                    <th className="py-2.5 px-4 font-bold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs font-medium text-neutral-700">
                  {filteredAttempts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-neutral-400 font-medium">
                        {loadingAttempts ? "Loading participant database..." : "No participant attempts located in cloud database."}
                      </td>
                    </tr>
                  ) : (
                    filteredAttempts.map((att: any) => {
                      const isExpanded = expandedAttemptId === att.id;
                      
                      // Resolve score colors
                      let badgeColor = "bg-rose-50 border-rose-200 text-rose-600";
                      if (att.score >= 80) badgeColor = "bg-emerald-50 border-emerald-200 text-emerald-600";
                      else if (att.score >= 40) badgeColor = "bg-amber-50 border-amber-200 text-amber-600";
                      else if (att.score > 0) badgeColor = "bg-zinc-100 border-zinc-200 text-zinc-600";

                      // Shorten user details to keep interface tidy
                      const systemLabel = att.systemDetails?.platform 
                        ? `${att.systemDetails.platform} (${att.systemDetails.screenWidth}x${att.systemDetails.screenHeight})` 
                        : "N/A";
                      
                      const locationLabel = att.geolocation?.city 
                        ? `${att.geolocation.city}, ${att.geolocation.country}` 
                        : "No Geo / Local IP";

                      return (
                        <React.Fragment key={att.id || Math.random().toString()}>
                          <tr className="hover:bg-neutral-50/50 transition-colors">
                            <td className="py-3 px-4 text-neutral-500 text-[11px] font-mono">
                              {formatDatetime(att.timestamp)}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-neutral-800 leading-tight">{att.userName}</div>
                              <div className="text-[10px] text-neutral-450 font-mono tracking-xs leading-none mt-0.5">{att.userEmail}</div>
                              <div className="text-[10px] text-neutral-500 mt-1">
                                Exp: {att.workExperience || "N/A"}y | {att.education || "N/A"}
                              </div>
                            </td>
                            <td className="py-3 px-4 font-semibold text-neutral-700">
                              {att.domain || "General"}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-neutral-150 bg-neutral-100/60 leading-none">
                                {att.difficulty || "Intermediate"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-black">
                              <span className={`px-2 py-0.5 rounded border text-[11px] font-mono font-bold leading-none ${badgeColor}`}>
                                {att.score}%
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <Globe className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                                <div className="leading-tight">
                                  <div className="text-[11px] font-mono font-semibold text-neutral-800">{att.ipAddress || "Unknown IP"}</div>
                                  <div className="text-[10px] text-neutral-500 font-medium">{locationLabel}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-neutral-500 text-[11px] max-w-44 truncate">
                              <div className="flex items-center gap-1 text-[11px] text-neutral-600">
                                <Cpu className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                                <span className="truncate" title={att.systemDetails?.userAgent}>{systemLabel}</span>
                              </div>
                              <div className="text-[10px] text-neutral-400 font-mono mt-0.5">{att.systemDetails?.timezone || "UTC"}</div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => setExpandedAttemptId(isExpanded ? null : att.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] uppercase font-mono font-bold text-neutral-500 border border-neutral-200 bg-white hover:bg-neutral-800 hover:text-white hover:border-neutral-800 rounded transition-all cursor-pointer shadow-xs"
                              >
                                <Eye className="w-3 h-3" /> {isExpanded ? "Close" : "Inspect"}
                              </button>
                            </td>
                          </tr>

                          {/* Expansion Row displaying raw answers, directions feedback, and scoring reasons */}
                          {isExpanded && (
                            <tr className="bg-neutral-50/50">
                              <td colSpan={8} className="p-4 border-t border-b border-neutral-200">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                  
                                  {/* Task & Baseline */}
                                  <div className="space-y-1.5 p-3 bg-white border border-neutral-150 rounded-lg">
                                    <h4 className="font-mono text-[9px] uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-1">
                                      <FileText className="w-3.5 h-3.5 text-amber-500" /> CHALLENGE TASK SCENARIO & BASELINE
                                    </h4>
                                    <div className="space-y-2 mt-2 leading-relaxed text-neutral-600 font-sans max-h-56 overflow-y-auto pr-1">
                                      <div>
                                        <div className="font-black text-neutral-800 text-[10px] uppercase">Task Prompt:</div>
                                        <p className="mt-0.5 italic">{att.task}</p>
                                      </div>
                                      <hr className="border-neutral-100" />
                                      <div>
                                        <div className="font-black text-neutral-800 text-[10px] uppercase">AI Baseline Output:</div>
                                        <p className="mt-0.5">{att.baseline}</p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* User Edited Prompt */}
                                  <div className="space-y-1.5 p-3 bg-white border border-neutral-150 rounded-lg">
                                    <h4 className="font-mono text-[9px] uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-1">
                                      <Cpu className="w-3.5 h-3.5 text-neutral-500" /> CANDIDATE HUMAN EDITED PROMPT
                                    </h4>
                                    <div className="mt-2 text-neutral-750 font-sans leading-relaxed text-[11px] whitespace-pre-wrap max-h-56 overflow-y-auto pr-1">
                                      {att.editedPrompt}
                                    </div>
                                    <div className="pt-2 border-t border-neutral-100 mt-2 flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                                      <span>Time taken: {att.timeTaken}s (of {att.timeAllocated}s)</span>
                                      {att.feedback && <span className="text-amber-600 font-bold">Feedback Filed</span>}
                                    </div>
                                  </div>

                                  {/* Diagnostic Evaluation & Telemetry */}
                                  <div className="space-y-1.5 p-3 bg-white border border-neutral-150 rounded-lg">
                                    <h4 className="font-mono text-[9px] uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-1 text-nowrap">
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> COGNITIVE SCORE EXPLANATION & AGENT TRACE
                                    </h4>
                                    <div className="mt-2 font-sans space-y-2 max-h-56 overflow-y-auto pr-1 text-neutral-600">
                                      <div className="flex flex-wrap gap-1">
                                        {(att.evaluation?.strengths || []).map((s: string, index: number) => (
                                          <span key={index} className="text-[9px] bg-neutral-100 border border-neutral-150 px-1.5 py-0.5 rounded font-mono font-medium">
                                            {s}
                                          </span>
                                        ))}
                                      </div>
                                      
                                      <div>
                                        <span className="font-black text-neutral-800 text-[10px] uppercase block">Assessor Notes:</span>
                                        <p className="mt-0.5 leading-relaxed italic">{att.evaluation?.insight || "No automated assessor analysis available."}</p>
                                      </div>

                                      {att.feedback && (
                                        <div className="border-t border-neutral-100 pt-1.5 mt-1">
                                          <span className="font-black text-neutral-800 text-[10px] uppercase block">User Feedback Commentary:</span>
                                          <p className="mt-0.5 text-neutral-500 leading-normal bg-amber-50/40 p-1.5 border border-amber-100/50 rounded italic">"{att.feedback}"</p>
                                        </div>
                                      )}

                                      <div className="border-t border-neutral-100 pt-1.5 text-[10px] text-neutral-400 space-y-0.5 font-mono">
                                        <div>UA: {att.systemDetails?.userAgent || "N/A"}</div>
                                        <div>ISP: {att.geolocation?.isp || "N/A"}</div>
                                        <div>LOC: {att.geolocation?.latitude ? `${att.geolocation.latitude}, ${att.geolocation.longitude}` : "N/A"}</div>
                                      </div>
                                    </div>
                                  </div>

                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
