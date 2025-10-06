"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Play, Clock, FileText, FolderOpen } from "lucide-react";
import { apiService } from "@/services/api";
import { DEFAULT_USER_ID } from "@/config/env";

const statusColors = {
  waiting_for_logs: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  ready_to_process: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  processing: "bg-blue-500/20 text-blue-400 border-blue-500/30", 
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  failed: "bg-red-500/20 text-red-400 border-red-500/30"
};

export default function SimulationsPage() {
  const [simulations, setSimulations] = useState<(Simulation & { projectName: string })[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSimulations();
  }, []);

  const fetchSimulations = async () => {
    try {
      setLoading(true);
      const [apiSimulations, apiProjects] = await Promise.all([
        apiService.getSimulationsByUser(DEFAULT_USER_ID),
        apiService.getProjectsByUser(DEFAULT_USER_ID)
      ]);

      const projectMap = new Map(apiProjects.map(p => [p.id, p.name]));

      const transformedSimulations: (Simulation & { projectName: string })[] = apiSimulations.map((simulation) => ({
        id: simulation.id,
        projectId: simulation.projectId,
        projectName: projectMap.get(simulation.projectId) || "Unknown Project",
        name: simulation.name,
        description: simulation.description,
        status: "waiting_for_logs" as const,
        createdAt: new Date(simulation.createdAt),
        updatedAt: new Date(simulation.updatedAt),
        logFiles: [],
        userId: simulation.userId,
      }));

      setSimulations(transformedSimulations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch simulations");
      console.error("Error fetching simulations:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSimulations = statusFilter === "all" 
    ? simulations 
    : simulations.filter(sim => sim.status === statusFilter);

  const statusCounts = {
    all: simulations.length,
    waiting_for_logs: simulations.filter(s => s.status === "waiting_for_logs").length,
    ready_to_process: simulations.filter(s => s.status === "ready_to_process").length,
    processing: simulations.filter(s => s.status === "processing").length,
    completed: simulations.filter(s => s.status === "completed").length,
    failed: simulations.filter(s => s.status === "failed").length
  };

  if (loading) {
    return (
      <div className="px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2864FF] mx-auto mb-4"></div>
            <p className="text-gray-400">Loading simulations...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg p-4 mb-4">
              <p>Error loading simulations: {error}</p>
            </div>
            <button
              onClick={fetchSimulations}
              className="bg-[#2864FF] hover:bg-[#1E4ED8] text-white px-4 py-2 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Simulations</h1>
            <p className="text-gray-400">All simulations across your projects</p>
          </div>
          <Link
            href="/simulations/new"
            className="bg-[#2864FF] hover:bg-[#1E4ED8] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={18} />
            New Simulation
          </Link>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {Object.entries(statusCounts).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === status
                  ? "bg-[#2864FF] text-white"
                  : "bg-[#2E364D] text-gray-400 hover:bg-[#3A4255] hover:text-white"
              }`}
            >
              {status === "all" ? "All" : status === "waiting_for_logs" ? "Waiting for logs" : status === "ready_to_process" ? "Ready to process" : status.charAt(0).toUpperCase() + status.slice(1)} ({count})
            </button>
          ))}
        </div>

        <div className="grid gap-4">
          {filteredSimulations.map((simulation) => (
            <Link
              key={simulation.id}
              href={`/simulations/${simulation.id}`}
              className="bg-[#2E364D] hover:bg-[#3A4255] border border-gray-600 rounded-lg p-6 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Play size={20} className="text-[#2864FF]" />
                    <h3 className="text-lg font-semibold text-white">{simulation.name}</h3>
                    {simulation.status && (
                      <span className={`px-2 py-1 text-xs rounded-full border ${statusColors[simulation.status]}`}>
                        {simulation.status}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <FolderOpen size={14} className="text-gray-500" />
                    <span className="text-sm text-gray-400">{simulation.projectName}</span>
                  </div>
                  
                  <p className="text-gray-400 mb-3">{simulation.description}</p>
                  
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <FileText size={14} />
                      <span>{simulation.logFiles?.length || 0} log files</span>
                    </div>
                    {simulation.database && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                          DB: {simulation.database}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>Updated {simulation.updatedAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredSimulations.length === 0 && (
          <div className="text-center py-12">
            <Play size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              {statusFilter === "all" ? "No simulations yet" : `No ${statusFilter} simulations`}
            </h3>
            <p className="text-gray-500 mb-6">
              {statusFilter === "all" 
                ? "Create your first simulation to start analyzing CometBFT logs"
                : `There are no simulations with ${statusFilter} status`
              }
            </p>
            {statusFilter === "all" && (
              <Link
                href="/simulations/new"
                className="bg-[#2864FF] hover:bg-[#1E4ED8] text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-colors"
              >
                <Plus size={18} />
                Create Simulation
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}