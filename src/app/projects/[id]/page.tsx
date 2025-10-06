"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Play, Clock, FileText, Activity, MoreVertical, Trash2, Eye } from "lucide-react";
import { apiService } from "@/services/api";

const statusColors = {
  waiting_for_logs: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  ready_to_process: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  processing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  failed: "bg-red-500/20 text-red-400 border-red-500/30"
};

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

const objectiveLabels = {
  network_latency: "Network Latency",
  block_time: "Block Time", 
  consensus_performance: "Consensus Performance",
  custom: "Custom"
};

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [deletingSimulation, setDeletingSimulation] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!projectId) return;
      
      try {
        setLoading(true);
        const [apiProject, apiSimulations] = await Promise.all([
          apiService.getProjectById(projectId),
          apiService.getSimulationsByProject(projectId)
        ]);

        const transformedProject: Project = {
          id: apiProject.id,
          name: apiProject.name,
          description: apiProject.description,
          createdAt: new Date(apiProject.createdAt),
          updatedAt: new Date(apiProject.updatedAt),
          userId: apiProject.userId,
          objective: "custom" as const,
          status: "active" as const,
          simulationCount: apiSimulations.length,
        };

        const transformedSimulations: Simulation[] = apiSimulations.map((simulation) => ({
          id: simulation.id,
          projectId: simulation.projectId,
          name: simulation.name,
          description: simulation.description,
          status: mapApiStatusToSimulationStatus(simulation.status || "logfile_required"),
          createdAt: new Date(simulation.createdAt),
          updatedAt: new Date(simulation.updatedAt),
          logFiles: simulation.logFiles?.map(logFile => ({
            id: logFile.filePath,
            name: logFile.originalFilename,
            size: logFile.fileSize,
            uploadedAt: new Date(logFile.uploadedAt),
            status: "processed" as const
          })) || [],
          userId: simulation.userId,
        }));

        setProject(transformedProject);
        setSimulations(transformedSimulations);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch project details");
        console.error("Error fetching project details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [projectId]);

  // Poll simulations while any are in 'processing' status
  const hasProcessingSimulations = useMemo(
    () => simulations.some((s) => s.status === "processing"),
    [simulations]
  );

  useEffect(() => {
    if (!projectId || !hasProcessingSimulations) return;

    let isCancelled = false;
    const pollIntervalMs = 3000; // 3s polling

    const poll = async () => {
      try {
        const apiSimulations = await apiService.getSimulationsByProject(projectId);
        if (isCancelled) return;

        const transformedSimulations: Simulation[] = apiSimulations.map((simulation) => ({
          id: simulation.id,
          projectId: simulation.projectId,
          name: simulation.name,
          description: simulation.description,
          status: mapApiStatusToSimulationStatus(simulation.status || "logfile_required"),
          createdAt: new Date(simulation.createdAt),
          updatedAt: new Date(simulation.updatedAt),
          logFiles:
            simulation.logFiles?.map((logFile) => ({
              id: logFile.filePath,
              name: logFile.originalFilename,
              size: logFile.fileSize,
              uploadedAt: new Date(logFile.uploadedAt),
              status: "processed" as const,
            })) || [],
          userId: simulation.userId,
        }));

        setSimulations(transformedSimulations);
      } catch (err) {
        // Silent fail for polling to avoid disrupting UX; log for debugging
        console.error("Polling simulations failed:", err);
      }
    };

    // Kick off immediately, then interval
    poll();
    const id = setInterval(poll, pollIntervalMs);

    return () => {
      isCancelled = true;
      clearInterval(id);
    };
  }, [projectId, hasProcessingSimulations]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(null);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen]);

  const handleDeleteSimulation = async (simulationId: string, simulationName: string) => {
    if (!confirm(`Are you sure you want to delete "${simulationName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingSimulation(simulationId);
    try {
      await apiService.deleteSimulation(simulationId);
      setSimulations(prev => prev.filter(sim => sim.id !== simulationId));
      setDropdownOpen(null);
    } catch (err) {
      console.error("Failed to delete simulation:", err);
      alert("Failed to delete simulation. Please try again.");
    } finally {
      setDeletingSimulation(null);
    }
  };

  const refetchProjectDetails = async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      const [apiProject, apiSimulations] = await Promise.all([
        apiService.getProjectById(projectId),
        apiService.getSimulationsByProject(projectId)
      ]);

      const transformedProject: Project = {
        id: apiProject.id,
        name: apiProject.name,
        description: apiProject.description,
        createdAt: new Date(apiProject.createdAt),
        updatedAt: new Date(apiProject.updatedAt),
        userId: apiProject.userId,
        objective: "custom" as const,
        status: "active" as const,
        simulationCount: apiSimulations.length,
      };

      const transformedSimulations: Simulation[] = apiSimulations.map((simulation) => ({
        id: simulation.id,
        projectId: simulation.projectId,
        name: simulation.name,
        description: simulation.description,
        status: mapApiStatusToSimulationStatus(simulation.status || "logfile_required"),
        createdAt: new Date(simulation.createdAt),
        updatedAt: new Date(simulation.updatedAt),
        logFiles: simulation.logFiles?.map(logFile => ({
          id: logFile.filePath,
          name: logFile.originalFilename,
          size: logFile.fileSize,
          uploadedAt: new Date(logFile.uploadedAt),
          status: "processed" as const
        })) || [],
        userId: simulation.userId,
      }));

      setProject(transformedProject);
      setSimulations(transformedSimulations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch project details");
      console.error("Error fetching project details:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2864FF] mx-auto mb-4"></div>
            <div className="text-gray-400">Loading project...</div>
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
              <p>Error loading project: {error}</p>
            </div>
            <button
              onClick={refetchProjectDetails}
              className="bg-[#2864FF] hover:bg-[#1E4ED8] text-white px-4 py-2 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-gray-400">Project not found</div>
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
            href="/projects"
            className="p-2 hover:bg-[#2E364D] rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-400" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-1">{project.name}</h1>
            <p className="text-gray-400">{project.description}</p>
          </div>
          <Link
            href={`/simulations/new?project=${project.id}`}
            className="bg-[#2864FF] hover:bg-[#1E4ED8] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={18} />
            New Simulation
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#2E364D] border border-gray-600 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Activity size={20} className="text-[#2864FF]" />
              <h3 className="font-medium text-white">Objective</h3>
            </div>
            <p className="text-gray-400">{project.objective ? objectiveLabels[project.objective] : "Custom"}</p>
          </div>
          
          <div className="bg-[#2E364D] border border-gray-600 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <FileText size={20} className="text-green-400" />
              <h3 className="font-medium text-white">Simulations</h3>
            </div>
            <p className="text-2xl font-bold text-white">{simulations.length}</p>
          </div>
          
          <div className="bg-[#2E364D] border border-gray-600 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Clock size={20} className="text-yellow-400" />
              <h3 className="font-medium text-white">Last Updated</h3>
            </div>
            <p className="text-gray-400">{project.updatedAt.toLocaleDateString()}</p>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Simulations</h2>
          </div>
          
          <div className="space-y-3">
            {simulations.map((simulation) => (
              <div
                key={simulation.id}
                className="bg-[#2E364D] hover:bg-[#3A4255] border border-gray-600 rounded-lg p-4 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <Link
                    href={`/simulations/${simulation.id}`}
                    className="flex-1 block"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Play size={16} className="text-[#2864FF]" />
                      <h3 className="font-medium text-white">{simulation.name}</h3>
                      {simulation.status && (
                        <span className={`px-2 py-1 text-xs rounded-full border ${statusColors[simulation.status]}`}>
                          {simulation.status?.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-400 mb-3 text-sm">{simulation.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <FileText size={12} />
                        <span>{simulation.logFiles?.length || 0} log files</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>Updated {simulation.updatedAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>
                  
                  <div className="relative" ref={dropdownOpen === simulation.id ? dropdownRef : null}>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setDropdownOpen(dropdownOpen === simulation.id ? null : simulation.id);
                      }}
                      className="p-1 hover:bg-[#3A4255] rounded"
                    >
                      <MoreVertical size={16} className="text-gray-400" />
                    </button>
                    
                    {dropdownOpen === simulation.id && (
                      <div className="absolute right-0 top-8 w-48 bg-[#2E364D] border border-gray-600 rounded-lg shadow-lg z-10">
                        <div className="py-1">
                          <Link
                            href={`/simulations/${simulation.id}`}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-[#3A4255] transition-colors"
                            onClick={() => setDropdownOpen(null)}
                          >
                            <Eye size={14} />
                            View Details
                          </Link>
                          <button
                            onClick={() => handleDeleteSimulation(simulation.id, simulation.name)}
                            disabled={deletingSimulation === simulation.id}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 size={14} />
                            {deletingSimulation === simulation.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {simulations.length === 0 && (
            <div className="text-center py-8 bg-[#2E364D] border border-gray-600 rounded-lg">
              <Play size={32} className="text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">No simulations yet</h3>
              <p className="text-gray-500 mb-4">Create your first simulation to start analyzing logs</p>
              <Link
                href={`/simulations/new?project=${project.id}`}
                className="bg-[#2864FF] hover:bg-[#1E4ED8] text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
              >
                <Plus size={16} />
                Create Simulation
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
