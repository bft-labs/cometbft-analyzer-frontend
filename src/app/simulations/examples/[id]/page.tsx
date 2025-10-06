"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, Play, FileText, Clock } from "lucide-react";
import { useParams } from "next/navigation";

export default function SimulationExamplePage() {
  const params = useParams();
  const simulationId = params.id as string;

  const getSimulationName = (id: string) => {
    switch (id) {
      case "example-1":
        return "Baseline Performance";
      case "example-2":
        return "Optimized Config V1";
      case "example-3":
        return "Load Test - High Traffic";
      default:
        return "Example Simulation";
    }
  };

  const getSimulationDescription = (id: string) => {
    switch (id) {
      case "example-1":
        return "Initial baseline measurement of network latency across all CometBFT nodes. This simulation captures the default behavior before any optimizations are applied.";
      case "example-2":
        return "First optimization attempt with modified timeout values to reduce network latency.";
      case "example-3":
        return "Testing under high network load conditions to identify performance bottlenecks.";
      default:
        return "This is an example simulation showing how the visualization would look with real data.";
    }
  };

  // For example-1 (Baseline Performance), we'll show it as completed with results
  const isBaselineExample = simulationId === "example-1";

  return (
    <div className="px-6 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/projects/examples"
            className="p-2 hover:bg-[#2E364D] rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-400" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Link href="/projects/examples" className="text-gray-400 hover:text-white text-sm">
                Network Latency Optimization
              </Link>
              <span className="text-gray-600">/</span>
            </div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-white">{getSimulationName(simulationId)}</h1>
              <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-1 text-xs rounded-full">
                EXAMPLE
              </span>
            </div>
            <p className="text-gray-400">
              {getSimulationDescription(simulationId)}
            </p>
          </div>
          <span className={`px-3 py-2 text-sm rounded-full border ${
            isBaselineExample ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-orange-500/20 text-orange-400 border-orange-500/30"
          }`}>
            {isBaselineExample ? "completed" : "processing"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#2E364D] border border-gray-600 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Play size={20} className="text-[#2864FF]" />
              <h3 className="font-medium text-white">Status</h3>
            </div>
            <p className="text-white capitalize">{isBaselineExample ? "completed" : "processing"}</p>
          </div>
          
          <div className="bg-[#2E364D] border border-gray-600 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <FileText size={20} className="text-green-400" />
              <h3 className="font-medium text-white">Log Files</h3>
            </div>
            <p className="text-2xl font-bold text-white">{isBaselineExample ? "4" : "2"}</p>
          </div>
          
          <div className="bg-[#2E364D] border border-gray-600 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Clock size={20} className="text-yellow-400" />
              <h3 className="font-medium text-white">Created</h3>
            </div>
            <p className="text-gray-400">1/15/2024</p>
          </div>

          <div className="bg-[#2E364D] border border-gray-600 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Clock size={20} className="text-blue-400" />
              <h3 className="font-medium text-white">Updated</h3>
            </div>
            <p className="text-gray-400">{isBaselineExample ? "1/16/2024" : "1/18/2024"}</p>
          </div>
        </div>

        {/* Main Analysis Actions - Only show for baseline example */}
        {isBaselineExample && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Analysis Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link
                href="/consensus-trace"
                className="block p-6 border rounded-lg transition-all bg-[#2E364D] border-[#2864FF] hover:bg-[#3A4255] cursor-pointer"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-[#2864FF]/20">
                    <BarChart3 size={32} className="text-[#2864FF]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-1">Consensus Trace</h3>
                    <p className="text-sm text-gray-300">
                      Visualize consensus protocol events and node interactions
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    Interactive timeline and event analysis
                  </div>
                  <div className="text-[#2864FF] text-sm font-medium">View →</div>
                </div>
              </Link>

              <Link
                href="/latency"
                className="block p-6 border rounded-lg transition-all bg-[#2E364D] border-[#2864FF] hover:bg-[#3A4255] cursor-pointer"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-[#2864FF]/20">
                    <BarChart3 size={32} className="text-[#2864FF]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-1">Network Latency</h3>
                    <p className="text-sm text-gray-300">
                      Analyze network performance and latency patterns
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    Detailed latency metrics and bottleneck detection
                  </div>
                  <div className="text-[#2864FF] text-sm font-medium">View →</div>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Analysis Results */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Analysis Results</h2>
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${!isBaselineExample ? "opacity-50 pointer-events-none" : ""}`}>
            <div className="bg-[#2E364D] border border-gray-600 rounded-lg p-4 relative">
              {!isBaselineExample && (
                <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-400 text-sm font-medium">Processing Required</div>
                    <div className="text-gray-500 text-xs mt-1">Complete log processing to view</div>
                  </div>
                </div>
              )}
              <h3 className="font-medium text-white mb-3">Consensus Metrics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Block Time:</span>
                  <span className="text-white">{isBaselineExample ? "6.2s" : "--"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Blocks:</span>
                  <span className="text-white">{isBaselineExample ? "1250" : "--"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Success Rate:</span>
                  <span className="text-green-400">{isBaselineExample ? "99.8%" : "--"}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#2E364D] border border-gray-600 rounded-lg p-4 relative">
              {!isBaselineExample && (
                <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-400 text-sm font-medium">Processing Required</div>
                    <div className="text-gray-500 text-xs mt-1">Complete log processing to view</div>
                  </div>
                </div>
              )}
              <h3 className="font-medium text-white mb-3">Latency Metrics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Latency:</span>
                  <span className="text-white">{isBaselineExample ? "142ms" : "--"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">P95 Latency:</span>
                  <span className="text-white">{isBaselineExample ? "280ms" : "--"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Latency:</span>
                  <span className="text-yellow-400">{isBaselineExample ? "450ms" : "--"}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#2E364D] border border-gray-600 rounded-lg p-4 relative">
              {!isBaselineExample && (
                <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-400 text-sm font-medium">Processing Required</div>
                    <div className="text-gray-500 text-xs mt-1">Complete log processing to view</div>
                  </div>
                </div>
              )}
              <h3 className="font-medium text-white mb-3">Performance Metrics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Throughput:</span>
                  <span className="text-white">{isBaselineExample ? "201 tx/s" : "--"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Node Uptime:</span>
                  <span className="text-green-400">{isBaselineExample ? "99.9%" : "--"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Show message for non-baseline examples */}
        {!isBaselineExample && (
          <div className="bg-[#2E364D] border border-blue-500/30 rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">Processing Example Data</h2>
                <p className="text-gray-400">This example simulation is currently being processed. Check back later for results, or explore the Baseline Performance example which shows completed analysis.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}