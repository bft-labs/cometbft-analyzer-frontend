"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, FileText, Clock, Download, Eye, BarChart3, Upload } from "lucide-react";
import { apiService, ApiSimulation } from "@/services/api";

const mapApiStatusToSimulationStatus = (apiStatus: string): 'waiting_for_logs' | 'ready_to_process' | 'processing' | 'completed' | 'failed' => {
  switch (apiStatus) {
    case 'logfile_required':
      return 'waiting_for_logs';
    case 'processed':
      return 'completed';
    case 'processing':
      return 'processing';
    case 'failed':
      return 'failed';
    default:
      return 'waiting_for_logs';
  }
};

const mockSimulations = [
  {
    id: "1",
    projectId: "1",
    projectName: "Network Latency Optimization",
    name: "Baseline Performance",
    description: "Initial baseline measurement of network latency across all CometBFT nodes. This simulation captures the default behavior before any optimizations are applied.",
    status: "completed" as const,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-16"),
    logFiles: [
      { id: "1", name: "node1.log", size: 1024000, uploadedAt: new Date("2024-01-15"), status: "processed" as const },
      { id: "2", name: "node2.log", size: 952000, uploadedAt: new Date("2024-01-15"), status: "processed" as const },
      { id: "3", name: "node3.log", size: 1156000, uploadedAt: new Date("2024-01-15"), status: "processed" as const },
      { id: "4", name: "node4.log", size: 998000, uploadedAt: new Date("2024-01-15"), status: "processed" as const }
    ],
    results: {
      consensusMetrics: { avgBlockTime: "6.2s", totalBlocks: 1250, successRate: "99.8%" },
      latencyMetrics: { avgLatency: "142ms", p95Latency: "280ms", maxLatency: "450ms" },
      performanceMetrics: { throughput: "201 tx/s", nodeUptime: "99.9%" }
    }
  },
  {
    id: "2",
    projectId: "1", 
    projectName: "Network Latency Optimization",
    name: "Processing Simulation",
    description: "Currently processing uploaded logs to generate analysis.",
    status: "processing" as const,
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
    logFiles: [
      { id: "5", name: "node1-new.log", size: 2048000, uploadedAt: new Date("2024-01-20"), status: "processing" as const },
      { id: "6", name: "node2-new.log", size: 1876000, uploadedAt: new Date("2024-01-20"), status: "processing" as const }
    ]
  },
  {
    id: "3",
    projectId: "1",
    projectName: "Network Latency Optimization", 
    name: "Waiting for Logs",
    description: "Simulation created, waiting for log files to be uploaded.",
    status: "waiting_for_logs" as const,
    createdAt: new Date("2024-01-22"),
    updatedAt: new Date("2024-01-22"),
    logFiles: []
  },
  {
    id: "4",
    projectId: "1",
    projectName: "Network Latency Optimization",
    name: "No Logs Simulation",
    description: "Simulation without any log files to demonstrate result page access.",
    status: "waiting_for_logs" as const,
    createdAt: new Date("2024-01-23"),
    updatedAt: new Date("2024-01-23"),
    logFiles: []
  },
  {
    id: "5",
    projectId: "1",
    projectName: "Network Latency Optimization",
    name: "Failed Processing",
    description: "Processing failed due to log format issues.",
    status: "failed" as const,
    createdAt: new Date("2024-01-24"),
    updatedAt: new Date("2024-01-24"),
    logFiles: [
      { id: "9", name: "corrupted.log", size: 500000, uploadedAt: new Date("2024-01-24"), status: "failed" as const }
    ],
    errorMessage: "Invalid log format: Expected CometBFT log format but found unknown structure. Please ensure logs are from CometBFT nodes and contain proper timestamp and event data."
  }
];

const statusColors = {
  waiting_for_logs: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  ready_to_process: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  processing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  failed: "bg-red-500/20 text-red-400 border-red-500/30"
};

const fileStatusColors = {
  uploading: "bg-yellow-500/20 text-yellow-400",
  processing: "bg-blue-500/20 text-blue-400",
  processed: "bg-green-500/20 text-green-400",
  failed: "bg-red-500/20 text-red-400"
};

const getEffectiveStatus = (status: string | undefined) => {
  return status || 'waiting_for_logs';
};

const getStatusMessage = (status: string | undefined) => {
  const effectiveStatus = getEffectiveStatus(status);
  
  if (effectiveStatus === "waiting_for_logs") {
    return "Upload log files to start analysis";
  }
  if (effectiveStatus === "processing") {
    return "Currently processing log files";
  }
  if (effectiveStatus === "failed") {
    return "Processing failed - check logs";
  }
  if (effectiveStatus === "completed") {
    return "Analysis complete";
  }
  return "Complete processing to view";
};

export default function SimulationDetailPage() {
  const params = useParams();
  const [simulation, setSimulation] = useState<(Simulation & { projectName: string }) | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchSimulation = async () => {
      try {
        const simulationId = params.id as string;
        const apiSimulation = await apiService.getSimulationById(simulationId);
        const apiProject = await apiService.getProjectById(apiSimulation.projectId);
        
        console.log("API Simulation:", apiSimulation);
        console.log("API Project:", apiProject);
        
        const transformedSimulation = {
          id: apiSimulation.id,
          projectId: apiSimulation.projectId,
          projectName: apiProject.name,
          name: apiSimulation.name,
          description: apiSimulation.description,
          status: mapApiStatusToSimulationStatus(apiSimulation.status || "waiting_for_logs"),
          createdAt: new Date(apiSimulation.createdAt),
          updatedAt: new Date(apiSimulation.updatedAt),
          logFiles: apiSimulation.logFiles?.map(logFile => {
            console.log("Mapping log file:", logFile);
            return {
              id: logFile.filePath,
              name: logFile.originalFilename,
              size: logFile.fileSize,
              uploadedAt: new Date(logFile.uploadedAt),
              status: "processed" as const
            };
          }) || 
          // Fallback: if logFilePaths exists (legacy format)
          (apiSimulation as ApiSimulation & { logFilePaths?: string[] }).logFilePaths?.map((filePath: string, index: number) => ({
            id: filePath,
            name: `log-file-${index + 1}.log`,
            size: 1024000,
            uploadedAt: new Date(),
            status: "processed" as const
          })) || [],
          results: {
            consensusMetrics: { avgBlockTime: "6.2s", totalBlocks: 1250, successRate: "99.8%" },
            latencyMetrics: { avgLatency: "142ms", p95Latency: "280ms", maxLatency: "450ms" },
            performanceMetrics: { throughput: "201 tx/s", nodeUptime: "99.9%" }
          }
        };
        
        setSimulation(transformedSimulation);
      } catch (error) {
        console.error("Failed to fetch simulation:", error);
        // Fallback to mock data if API fails
        const foundSimulation = mockSimulations.find(s => s.id === params.id);
        setSimulation(foundSimulation || null);
      }
    };

    fetchSimulation();
  }, [params.id]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0 || !simulation) return;
    setIsUploading(true);
    try {
      // Call backend upload API
      await apiService.uploadLogFiles(simulation.id, selectedFiles);

      // Refresh simulation from backend to reflect new files and status
      const apiSimulation = await apiService.getSimulationById(simulation.id);
      const transformedSimulation = {
        ...simulation,
        name: apiSimulation.name,
        description: apiSimulation.description,
        status: mapApiStatusToSimulationStatus(apiSimulation.status || "waiting_for_logs"),
        createdAt: new Date(apiSimulation.createdAt),
        updatedAt: new Date(apiSimulation.updatedAt),
        logFiles:
          apiSimulation.logFiles?.map((logFile) => ({
            id: logFile.filePath,
            name: logFile.originalFilename,
            size: logFile.fileSize,
            uploadedAt: new Date(logFile.uploadedAt),
            status: "processed" as const,
          })) || [],
      } as typeof simulation;
      setSimulation(transformedSimulation);
      setSelectedFiles([]);
    } catch (err: unknown) {
      console.error("Upload failed:", err);
      const message = err instanceof Error ? err.message : "Upload failed. Please check server logs.";
      alert(message);
    } finally {
      setIsUploading(false);
    }
  };

  const startProcessing = async () => {
    if (!simulation) return;
    
    // TODO: Implement processing start logic
    console.log("Starting processing for simulation:", simulation.id);
    
    // Simulate processing start
    const updatedSimulation = {
      ...simulation,
      status: "processing" as const
    };
    
    setSimulation(updatedSimulation);
  };

  const retryProcessing = async () => {
    if (!simulation) return;
    
    // Reset to ready_to_process state for retry
    const updatedSimulation = {
      ...simulation,
      status: "ready_to_process" as const,
      errorMessage: undefined
    };
    
    setSimulation(updatedSimulation);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (!simulation) {
    return (
      <div className="px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-gray-400">Loading simulation...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href={`/projects/${simulation.projectId}`}
            className="p-2 hover:bg-[#2E364D] rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-400" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Link href={`/projects/${simulation.projectId}`} className="text-gray-400 hover:text-white text-sm">
                {simulation.projectName}
              </Link>
              <span className="text-gray-600">/</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">{simulation.name}</h1>
            <p className="text-gray-400">{simulation.description}</p>
          </div>
          <span className={`px-3 py-2 text-sm rounded-full border ${statusColors[getEffectiveStatus(simulation.status) as keyof typeof statusColors] || statusColors.waiting_for_logs}`}>
            {getEffectiveStatus(simulation.status)?.replace('_', ' ')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#2E364D] border border-gray-600 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Play size={20} className="text-[#2864FF]" />
              <h3 className="font-medium text-white">Status</h3>
            </div>
            <p className="text-white capitalize">{getEffectiveStatus(simulation.status)?.replace('_', ' ')}</p>
          </div>
          
          <div className="bg-[#2E364D] border border-gray-600 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <FileText size={20} className="text-green-400" />
              <h3 className="font-medium text-white">Log Files</h3>
            </div>
            <p className="text-2xl font-bold text-white">{simulation.logFiles?.length || 0}</p>
          </div>
          
          <div className="bg-[#2E364D] border border-gray-600 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Clock size={20} className="text-yellow-400" />
              <h3 className="font-medium text-white">Created</h3>
            </div>
            <p className="text-gray-400">{simulation.createdAt.toLocaleDateString()}</p>
          </div>

          <div className="bg-[#2E364D] border border-gray-600 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Clock size={20} className="text-blue-400" />
              <h3 className="font-medium text-white">Updated</h3>
            </div>
            <p className="text-gray-400">{simulation.updatedAt.toLocaleDateString()}</p>
          </div>
        </div>

        {/* Main Analysis Actions - Always show but conditionally enable */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Analysis Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href={`/simulations/${simulation.id}/consensus-trace`}
              className={`block p-6 border rounded-lg transition-all ${
                getEffectiveStatus(simulation.status) === "completed"
                  ? "bg-[#2E364D] border-[#2864FF] hover:bg-[#3A4255] cursor-pointer"
                  : "bg-[#2E364D] border-yellow-500/30 hover:bg-[#3A4255] cursor-pointer"
              }`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-lg ${getEffectiveStatus(simulation.status) === "completed" ? "bg-[#2864FF]/20" : "bg-gray-600/20"}`}>
                  <BarChart3 size={32} className={getEffectiveStatus(simulation.status) === "completed" ? "text-[#2864FF]" : "text-gray-500"} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">Consensus Trace</h3>
                  <p className={`text-sm ${getEffectiveStatus(simulation.status) === "completed" ? "text-gray-300" : "text-gray-500"}`}>
                    Visualize consensus protocol events and node interactions
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  {getEffectiveStatus(simulation.status) === "completed"
                    ? "Interactive timeline and event analysis" 
                    : "Development mode - Click to view (may show empty data)"
                  }
                </div>
                <div className={`text-sm font-medium ${getEffectiveStatus(simulation.status) === "completed" ? "text-[#2864FF]" : "text-yellow-500"}`}>
                  {getEffectiveStatus(simulation.status) === "completed" ? "View →" : "Dev View →"}
                </div>
              </div>
            </Link>

            <Link
              href={`/simulations/${simulation.id}/latency`}
              className={`block p-6 border rounded-lg transition-all ${
                getEffectiveStatus(simulation.status) === "completed"
                  ? "bg-[#2E364D] border-[#2864FF] hover:bg-[#3A4255] cursor-pointer"
                  : "bg-[#2E364D] border-yellow-500/30 hover:bg-[#3A4255] cursor-pointer"
              }`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-lg ${getEffectiveStatus(simulation.status) === "completed" ? "bg-[#2864FF]/20" : "bg-gray-600/20"}`}>
                  <BarChart3 size={32} className={getEffectiveStatus(simulation.status) === "completed" ? "text-[#2864FF]" : "text-gray-500"} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">Network Latency</h3>
                  <p className={`text-sm ${getEffectiveStatus(simulation.status) === "completed" ? "text-gray-300" : "text-gray-500"}`}>
                    Analyze network performance and latency patterns
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  {getEffectiveStatus(simulation.status) === "completed"
                    ? "Detailed latency metrics and bottleneck detection" 
                    : "Development mode - Click to view (may show empty data)"
                  }
                </div>
                <div className={`text-sm font-medium ${getEffectiveStatus(simulation.status) === "completed" ? "text-[#2864FF]" : "text-yellow-500"}`}>
                  {getEffectiveStatus(simulation.status) === "completed" ? "View →" : "Dev View →"}
                </div>
              </div>
            </Link>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Analysis Results</h2>
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${getEffectiveStatus(simulation.status) !== "completed" ? "opacity-50 pointer-events-none" : ""}`}>
            <div className="bg-[#2E364D] border border-gray-600 rounded-lg p-4 relative">
              {getEffectiveStatus(simulation.status) !== "completed" && (
                <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-400 text-sm font-medium">Processing Required</div>
                    <div className="text-gray-500 text-xs mt-1">{getStatusMessage(simulation.status)}</div>
                  </div>
                </div>
              )}
              <h3 className="font-medium text-white mb-3">Consensus Metrics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Block Time:</span>
                  <span className="text-white">{getEffectiveStatus(simulation.status) === "completed" ? simulation.results?.consensusMetrics?.avgBlockTime || "6.2s" : "--"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Blocks:</span>
                  <span className="text-white">{getEffectiveStatus(simulation.status) === "completed" ? simulation.results?.consensusMetrics?.totalBlocks || "1250" : "--"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Success Rate:</span>
                  <span className="text-green-400">{getEffectiveStatus(simulation.status) === "completed" ? simulation.results?.consensusMetrics?.successRate || "99.8%" : "--"}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#2E364D] border border-gray-600 rounded-lg p-4 relative">
              {getEffectiveStatus(simulation.status) !== "completed" && (
                <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-400 text-sm font-medium">Processing Required</div>
                    <div className="text-gray-500 text-xs mt-1">{getStatusMessage(simulation.status)}</div>
                  </div>
                </div>
              )}
              <h3 className="font-medium text-white mb-3">Latency Metrics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Latency:</span>
                  <span className="text-white">{getEffectiveStatus(simulation.status) === "completed" ? simulation.results?.latencyMetrics?.avgLatency || "142ms" : "--"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">P95 Latency:</span>
                  <span className="text-white">{getEffectiveStatus(simulation.status) === "completed" ? simulation.results?.latencyMetrics?.p95Latency || "280ms" : "--"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Latency:</span>
                  <span className="text-yellow-400">{getEffectiveStatus(simulation.status) === "completed" ? simulation.results?.latencyMetrics?.maxLatency || "450ms" : "--"}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#2E364D] border border-gray-600 rounded-lg p-4 relative">
              {getEffectiveStatus(simulation.status) !== "completed" && (
                <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-400 text-sm font-medium">Processing Required</div>
                    <div className="text-gray-500 text-xs mt-1">{getStatusMessage(simulation.status)}</div>
                  </div>
                </div>
              )}
              <h3 className="font-medium text-white mb-3">Performance Metrics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Throughput:</span>
                  <span className="text-white">{getEffectiveStatus(simulation.status) === "completed" ? simulation.results?.performanceMetrics?.throughput || "201 tx/s" : "--"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Node Uptime:</span>
                  <span className="text-green-400">{getEffectiveStatus(simulation.status) === "completed" ? simulation.results?.performanceMetrics?.nodeUptime || "99.9%" : "--"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {getEffectiveStatus(simulation.status) === "waiting_for_logs" && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Upload Log Files</h2>
            <div className="bg-[#2E364D] border border-gray-600 rounded-lg p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-white mb-2">
                  Upload CometBFT Log Files
                </label>
                <div className="relative">
                  <input
                    type="file"
                    multiple
                    accept=".log,.txt"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-gray-500 transition-colors">
                    <Upload size={32} className="text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400 mb-1">Drop log files here or click to browse</p>
                    <p className="text-gray-500 text-sm">Supported formats: .log, .txt</p>
                  </div>
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2 mb-4">
                  <h3 className="text-sm font-medium text-white">Selected Files ({selectedFiles.length})</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-[#1C2337] border border-gray-600 rounded px-3 py-2"
                      >
                        <div className="flex-1">
                          <div className="text-white text-sm font-medium">{file.name}</div>
                          <div className="text-gray-400 text-xs">{formatFileSize(file.size)}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={uploadFiles}
                    disabled={selectedFiles.length === 0 || isUploading}
                    className="bg-[#2864FF] hover:bg-[#1E4ED8] disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        Upload Files
                      </>
                    )}
                  </button>
                </div>
              )}

              {simulation.status === "ready_to_process" && (simulation.logFiles?.length || 0) > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-600">
                  <p className="text-sm text-gray-400 mb-3">
                    You have {simulation.logFiles?.length || 0} log file(s) uploaded. You can add more files above or proceed to processing.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {simulation.status === "ready_to_process" && (
          <div className="mb-8 bg-[#2E364D] border border-orange-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Ready to Process</h2>
                <p className="text-gray-400">Log files have been uploaded successfully. Start processing to generate analysis results.</p>
              </div>
              <button
                onClick={startProcessing}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors font-medium"
              >
                <Play size={18} />
                Start Processing
              </button>
            </div>
          </div>
        )}

        {simulation.status === "processing" && (
          <div className="mb-8 bg-[#2E364D] border border-blue-500/30 rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">Processing Log Files</h2>
                <p className="text-gray-400">Analyzing uploaded logs and generating results. This may take a few minutes...</p>
              </div>
            </div>
          </div>
        )}

        {simulation.status === "failed" && simulation.errorMessage && (
          <div className="mb-8 bg-[#2E364D] border border-red-500/30 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-red-400 mb-2">Processing Failed</h2>
                <p className="text-gray-400 mb-4">{simulation.errorMessage}</p>
                <div className="text-sm text-gray-500">
                  <p>Common solutions:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Ensure log files are from CometBFT nodes</li>
                    <li>Check that files contain proper timestamp and event data</li>
                    <li>Verify files are not corrupted during upload</li>
                  </ul>
                </div>
              </div>
              <button
                onClick={retryProcessing}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
              >
                <Upload size={16} />
                Retry Processing
              </button>
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white">Log Files</h2>
          </div>
          
          <div className="space-y-3">
            {(simulation.logFiles || []).map((file) => (
              <div
                key={file.id}
                className="bg-[#2E364D] border border-gray-600 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-gray-400" />
                    <div>
                      <h3 className="font-medium text-white">{file.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>{formatFileSize(file.size)}</span>
                        <span>Uploaded {file.uploadedAt.toLocaleDateString()}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${fileStatusColors[file.status]}`}>
                          {file.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-[#3A4255] rounded-lg transition-colors">
                    <Eye size={16} className="text-gray-400" />
                  </button>
                  <button className="p-2 hover:bg-[#3A4255] rounded-lg transition-colors">
                    <Download size={16} className="text-gray-400" />
                  </button>
                  {(simulation.status === "waiting_for_logs" || simulation.status === "failed") && (
                    <button 
                      onClick={() => {
                        // TODO: Implement individual file removal
                        const updatedLogFiles = (simulation.logFiles || []).filter(f => f.id !== file.id);
                        setSimulation({
                          ...simulation, 
                          logFiles: updatedLogFiles,
                          status: updatedLogFiles.length === 0 ? "waiting_for_logs" : simulation.status
                        });
                      }}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <span className="text-red-400 text-sm">×</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {(simulation.logFiles?.length || 0) === 0 && simulation.status !== "waiting_for_logs" && (
            <div className="text-center py-8 bg-[#2E364D] border border-gray-600 rounded-lg">
              <Upload size={32} className="text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">No log files uploaded</h3>
              <p className="text-gray-500">This simulation was created without log files</p>
            </div>
          )}
          
          {(simulation.logFiles?.length || 0) === 0 && simulation.status === "waiting_for_logs" && (
            <div className="text-center py-8 bg-[#2E364D] border border-gray-600 rounded-lg">
              <Upload size={32} className="text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">Ready for log files</h3>
              <p className="text-gray-500">Use the upload section above to add your CometBFT log files</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
