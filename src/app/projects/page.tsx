"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, FolderOpen, Clock, Activity } from "lucide-react";
import { apiService } from "@/services/api";
import { DEFAULT_USER_ID } from "@/config/env";

const objectiveLabels = {
  network_latency: "Network Latency",
  block_time: "Block Time",
  consensus_performance: "Consensus Performance",
  custom: "Custom"
};

const statusColors = {
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  completed: "bg-blue-500/20 text-blue-400 border-blue-500/30", 
  archived: "bg-gray-500/20 text-gray-400 border-gray-500/30"
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const apiProjects = await apiService.getProjectsByUser(DEFAULT_USER_ID);
      
      const transformedProjects: Project[] = await Promise.all(
        apiProjects.map(async (project) => {
          let simulationCount = 0;
          try {
            const simulations = await apiService.getSimulationsByProject(project.id);
            simulationCount = simulations.length;
          } catch (err) {
            console.warn(`Failed to fetch simulations for project ${project.id}:`, err);
          }

          return {
            id: project.id,
            name: project.name,
            description: project.description,
            createdAt: new Date(project.createdAt),
            updatedAt: new Date(project.updatedAt),
            simulationCount,
            objective: "custom" as const,
            status: "active" as const,
            userId: project.userId,
          };
        })
      );

      setProjects(transformedProjects);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch projects");
      console.error("Error fetching projects:", err);
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
            <p className="text-gray-400">Loading projects...</p>
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
              <p>Error loading projects: {error}</p>
            </div>
            <button
              onClick={fetchProjects}
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
            <h1 className="text-3xl font-bold text-white mb-2">Projects</h1>
            <p className="text-gray-400">Manage your CometBFT analysis projects</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/projects/examples"
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              View Examples
            </Link>
            <Link
              href="/projects/new"
              className="bg-[#2864FF] hover:bg-[#1E4ED8] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus size={18} />
              New Project
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="bg-[#2E364D] hover:bg-[#3A4255] border border-gray-600 rounded-lg p-6 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FolderOpen size={20} className="text-[#2864FF]" />
                    <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                    {project.status && (
                      <span className={`px-2 py-1 text-xs rounded-full border ${statusColors[project.status]}`}>
                        {project.status}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-400 mb-3">{project.description}</p>
                  
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    {project.objective && (
                      <div className="flex items-center gap-1">
                        <Activity size={14} />
                        <span>{objectiveLabels[project.objective]}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <FolderOpen size={14} />
                      <span>{project.simulationCount || 0} simulations</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>Updated {project.updatedAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-12">
            <FolderOpen size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">No projects yet</h3>
            <p className="text-gray-500 mb-6">Create your first project to start analyzing CometBFT logs</p>
            <Link
              href="/projects/new"
              className="bg-[#2864FF] hover:bg-[#1E4ED8] text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              <Plus size={18} />
              Create Project
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}