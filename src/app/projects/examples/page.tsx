"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Play, Clock, FileText, Activity, MoreVertical } from "lucide-react";

const mockProject: Project = {
  id: "example",
  name: "Network Latency Optimization",
  description: "Analyzing and optimizing network latency in consensus protocol. This project focuses on identifying bottlenecks in network communication between CometBFT nodes and implementing strategies to reduce overall latency.",
  objective: "network_latency",
  createdAt: new Date("2024-01-15"),
  updatedAt: new Date("2024-01-20"),
  simulationCount: 5,
  status: "active"
};

const mockSimulations: Simulation[] = [
  {
    id: "example-1",
    projectId: "example",
    name: "Baseline Performance",
    description: "Initial baseline measurement",
    status: "completed",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-16"),
    logFiles: [
      { id: "1", name: "node1.log", size: 1024000, uploadedAt: new Date("2024-01-15"), status: "processed" },
      { id: "2", name: "node2.log", size: 952000, uploadedAt: new Date("2024-01-15"), status: "processed" }
    ]
  },
  {
    id: "example-2", 
    projectId: "example",
    name: "Optimized Config V1",
    description: "First optimization attempt with modified timeout values",
    status: "processing",
    createdAt: new Date("2024-01-17"),
    updatedAt: new Date("2024-01-18"),
    logFiles: [
      { id: "3", name: "node1-opt.log", size: 1128000, uploadedAt: new Date("2024-01-17"), status: "processing" }
    ]
  },
  {
    id: "example-3",
    projectId: "example", 
    name: "Load Test - High Traffic",
    description: "Testing under high network load conditions",
    status: "waiting_for_logs",
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
    logFiles: []
  }
];

const statusColors = {
  waiting_for_logs: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  ready_to_process: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  processing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  failed: "bg-red-500/20 text-red-400 border-red-500/30"
};

const objectiveLabels = {
  network_latency: "Network Latency",
  block_time: "Block Time", 
  consensus_performance: "Consensus Performance",
  custom: "Custom"
};

export default function ProjectExamplesPage() {
  const [project] = useState<Project>(mockProject);
  const [simulations] = useState<Simulation[]>(mockSimulations);

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
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-white">{project.name}</h1>
              <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-1 text-xs rounded-full">
                EXAMPLE
              </span>
            </div>
            <p className="text-gray-400">{project.description}</p>
          </div>
          <div className="bg-gray-600 text-gray-400 px-4 py-2 rounded-lg flex items-center gap-2 cursor-not-allowed">
            <Plus size={18} />
            New Simulation (Example Only)
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#2E364D] border border-gray-600 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Activity size={20} className="text-[#2864FF]" />
              <h3 className="font-medium text-white">Objective</h3>
            </div>
            <p className="text-gray-400">{objectiveLabels[project.objective!]}</p>
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
            <h2 className="text-xl font-semibold text-white">Simulations (Examples)</h2>
          </div>
          
          <div className="space-y-3">
            {simulations.map((simulation) => (
              <Link
                key={simulation.id}
                href={`/simulations/examples/${simulation.id}`}
                className="bg-[#2E364D] hover:bg-[#3A4255] border border-gray-600 rounded-lg p-4 block transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Play size={16} className="text-[#2864FF]" />
                      <h3 className="font-medium text-white">{simulation.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full border ${statusColors[simulation.status!]}`}>
                        {simulation.status}
                      </span>
                      <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-1 text-xs rounded-full">
                        EXAMPLE
                      </span>
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
                  </div>
                  
                  <button className="p-1 hover:bg-[#3A4255] rounded">
                    <MoreVertical size={16} className="text-gray-400" />
                  </button>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}