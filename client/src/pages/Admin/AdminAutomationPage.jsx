import { useState, useEffect, useRef } from "react";
import {
  Cpu,
  Play,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
  Video,
  Github,
  BookOpen,
  Globe,
  FileText,
  Code2,
  Terminal,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";
import { adminService } from "../../services/adminService";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import toast from "react-hot-toast";

const SOURCES = [
  {
    id: "youtube",
    name: "YouTube",
    description: "Curated videos, tutorials, and playlists with multi-language tagging and public fallback.",
    icon: Video,
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    id: "github",
    name: "GitHub",
    description: "Open-source repositories, awesome-lists, and developer curriculum with 50+ stars.",
    icon: Github,
    color: "text-slate-800 dark:text-slate-200",
    bg: "bg-slate-500/10",
  },
  {
    id: "open-library",
    name: "Open Library",
    description: "Open-access educational books, textbooks, and guides across all 20 learning domains.",
    icon: BookOpen,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    id: "wikipedia",
    name: "Wikipedia",
    description: "Encyclopedic overviews and foundational concepts for science, mathematics, and humanities.",
    icon: Globe,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    id: "arxiv",
    name: "arXiv",
    description: "Academic papers and technical reports in AI, machine learning, physics, and computer science.",
    icon: FileText,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    id: "freecodecamp",
    name: "freeCodeCamp",
    description: "Full-length developer guides, coding roadmaps, and programming walkthroughs.",
    icon: Code2,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
];

export default function AdminAutomationPage() {
  const [status, setStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [runningMaster, setRunningMaster] = useState(false);
  const [runningHealth, setRunningHealth] = useState(false);
  const [runningSource, setRunningSource] = useState(null);
  const [maxPerQuery, setMaxPerQuery] = useState(3);
  const [logs, setLogs] = useState([]);
  const pollRef = useRef(null);

  const fetchStatus = async () => {
    try {
      const res = await adminService.getAutomationStatus();
      if (res.data?.success) {
        setStatus(res.data.data);
      }
    } catch (err) {
      // Quiet fail on status polling
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll every 5s for active state updates
    pollRef.current = setInterval(fetchStatus, 5000);
    return () => clearInterval(pollRef.current);
  }, []);

  const addLog = (type, source, message) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [
      { id: Date.now() + Math.random(), time, type, source, message },
      ...prev.slice(0, 99),
    ]);
  };

  // Master Universal Ingestion trigger
  const handleRunAll = async () => {
    try {
      setRunningMaster(true);
      addLog("info", "Master", `Initiating Universal Ingestion across all 6 sources (max ${maxPerQuery}/query)...`);
      toast.loading("Starting universal ingestion pipeline...", { id: "automation-run" });

      const res = await adminService.runAutomation({
        ytMaxPerQuery: maxPerQuery,
        ghMaxPerQuery: maxPerQuery,
        olMaxPerQuery: maxPerQuery,
      });

      if (res.data?.success) {
        toast.success(res.data.message || "Universal ingestion started successfully!", { id: "automation-run" });
        addLog("complete", "Master", res.data.message || "Job queued and processing in background.");
      } else {
        toast.error(res.data?.message || "Failed to start ingestion", { id: "automation-run" });
        addLog("error", "Master", res.data?.message || "Ingestion initiation failed.");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Server error";
      toast.error(msg, { id: "automation-run" });
      addLog("error", "Master", `Error: ${msg}`);
    } finally {
      setRunningMaster(false);
      fetchStatus();
    }
  };

  // Granular individual source trigger
  const handleRunSource = async (sourceId, sourceName) => {
    try {
      setRunningSource(sourceId);
      addLog("info", sourceName, `Triggering ${sourceName} ingestion (max ${maxPerQuery}/query)...`);
      toast.loading(`Starting ${sourceName} ingestion...`, { id: `source-${sourceId}` });

      const res = await adminService.runSourceAutomation(sourceId, {
        maxPerQuery,
      });

      if (res.data?.success) {
        toast.success(res.data.message || `${sourceName} ingestion started!`, { id: `source-${sourceId}` });
        addLog("complete", sourceName, res.data.message || `${sourceName} job completed.`);
      } else {
        toast.error(res.data?.message || `Failed to run ${sourceName}`, { id: `source-${sourceId}` });
        addLog("error", sourceName, res.data?.message || "Failed.");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Server error";
      toast.error(msg, { id: `source-${sourceId}` });
      addLog("error", sourceName, `Error: ${msg}`);
    } finally {
      setRunningSource(null);
      fetchStatus();
    }
  };

  // Run Link Health Check
  const handleRunHealthCheck = async () => {
    try {
      setRunningHealth(true);
      addLog("info", "HealthCheck", "Scanning stored resources for 404 dead links...");
      toast.loading("Starting URL health verification...", { id: "health-check" });

      const res = await adminService.runHealthCheck();
      if (res.data?.success) {
        toast.success(res.data.message || "Health check started!", { id: "health-check" });
        addLog("complete", "HealthCheck", res.data.message);
      } else {
        toast.error(res.data?.message || "Failed to start health check", { id: "health-check" });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Server error";
      toast.error(msg, { id: "health-check" });
      addLog("error", "HealthCheck", `Error: ${msg}`);
    } finally {
      setRunningHealth(false);
      fetchStatus();
    }
  };

  const isAnyRunning = runningMaster || runningSource || runningHealth || status?.status === "running";

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <Cpu className="h-7 w-7 text-primary" />
              Resource Automation & Ingestion
            </h1>
            <Badge variant={isAnyRunning ? "default" : "secondary"} className="animate-pulse">
              {isAnyRunning ? "Active" : "Idle"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Automated multi-source discovery, taxonomy classification, multi-language detection, and dead-link healing.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-muted-foreground">
            <span>Per Query:</span>
            <select
              value={maxPerQuery}
              onChange={(e) => setMaxPerQuery(Number(e.target.value))}
              className="bg-transparent font-medium text-foreground outline-none cursor-pointer"
            >
              <option value={1}>1 item</option>
              <option value={2}>2 items</option>
              <option value={3}>3 items</option>
              <option value={5}>5 items</option>
              <option value={10}>10 items</option>
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRunHealthCheck}
            disabled={isAnyRunning}
            className="gap-2"
          >
            <ShieldCheck className={`h-4 w-4 ${runningHealth ? "animate-spin" : "text-emerald-500"}`} />
            {runningHealth ? "Checking Links..." : "Run Health Check"}
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleRunAll}
            disabled={isAnyRunning}
            className="gap-2 shadow-sm"
          >
            <Play className={`h-4 w-4 ${runningMaster ? "animate-spin" : "fill-current"}`} />
            {runningMaster ? "Ingesting Resources..." : "Run Universal Ingestion"}
          </Button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Pipeline State</p>
            <p className="text-xl font-bold capitalize text-foreground">
              {status?.status || (isAnyRunning ? "Running" : "Idle")}
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Active Sources</p>
            <p className="text-xl font-bold text-foreground">6 Integrated</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Daily Scheduled Cron</p>
            <p className="text-sm font-semibold text-foreground">03:00 AM IST</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-violet-500/10 text-violet-500">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">DB Protection</p>
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">$setOnInsert Active</p>
          </div>
        </Card>
      </div>

      {/* Individual Source Ingestion Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Layers className="h-5 w-5 text-muted-foreground" />
            Individual Ingestion Sources
          </h2>
          <span className="text-xs text-muted-foreground">Trigger individual fetchers on demand</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SOURCES.map((src) => {
            const Icon = src.icon;
            const isThisRunning = runningSource === src.id;

            return (
              <Card key={src.id} className="flex flex-col justify-between hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${src.bg}`}>
                        <Icon className={`h-5 w-5 ${src.color}`} />
                      </div>
                      <CardTitle className="text-base font-semibold">{src.name}</CardTitle>
                    </div>
                    {src.id === "youtube" && (
                      <Badge variant="outline" className="text-[10px] text-red-500 border-red-500/30">
                        Zero-Key Fallback
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    {src.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-xs"
                    onClick={() => handleRunSource(src.id, src.name)}
                    disabled={isAnyRunning}
                  >
                    {isThisRunning ? (
                      <>
                        <RotateCw className="h-3.5 w-3.5 animate-spin text-primary" />
                        Fetching {src.name}...
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 fill-current" />
                        Run {src.name} Ingestion
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Live Activity & Telemetry Console */}
      <Card className="border border-border bg-card">
        <CardHeader className="py-3 px-4 border-b border-border flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Live Telemetry & Activity Stream</span>
            <Badge variant="outline" className="text-[10px] ml-2">
              {logs.length} events
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLogs([])}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear Log
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="h-64 overflow-y-auto font-mono text-xs p-4 bg-muted/30 space-y-2">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-1.5 py-12">
                <Terminal className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-xs">No active runs yet. Click "Run Universal Ingestion" or an individual source above to start.</p>
                <p className="text-[10px] text-muted-foreground/60">Real-time status, language tagging, and database upserts will appear here.</p>
              </div>
            ) : (
              logs.map((log) => {
                let badgeVariant = "secondary";
                let textClass = "text-foreground";
                let Icon = CheckCircle2;

                if (log.type === "error") {
                  badgeVariant = "destructive";
                  textClass = "text-red-500 dark:text-red-400";
                  Icon = XCircle;
                } else if (log.type === "warning") {
                  textClass = "text-amber-500 dark:text-amber-400";
                  Icon = AlertTriangle;
                } else if (log.type === "complete") {
                  textClass = "text-emerald-500 dark:text-emerald-400";
                  Icon = CheckCircle2;
                }

                return (
                  <div key={log.id} className="flex items-start gap-2.5 hover:bg-muted/50 p-1.5 rounded transition-colors">
                    <span className="text-muted-foreground shrink-0 select-none">{log.time}</span>
                    <Badge variant={badgeVariant} className="text-[10px] uppercase font-bold shrink-0 px-1.5 py-0">
                      {log.source}
                    </Badge>
                    <Icon className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${textClass}`} />
                    <span className={`break-all ${textClass}`}>{log.message}</span>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
