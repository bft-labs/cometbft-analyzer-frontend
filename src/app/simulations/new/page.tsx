"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Upload, X, Sparkles, RefreshCw } from "lucide-react";
import { apiService } from "@/services/api";
import { DEFAULT_USER_ID } from "@/config/env";

function NewSimulationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");

  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId || "");
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const apiProjects = await apiService.getProjectsByUser(DEFAULT_USER_ID);
        
        const transformedProjects: Project[] = apiProjects.map((project) => ({
          id: project.id,
          name: project.name,
          description: project.description,
          createdAt: new Date(project.createdAt),
          updatedAt: new Date(project.updatedAt),
          userId: project.userId,
        }));

        setAvailableProjects(transformedProjects);
        
        // Set initial project if provided via URL
        if (projectId && transformedProjects.length > 0) {
          const project = transformedProjects.find(p => p.id === projectId);
          setCurrentProject(project || null);
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
        alert("Failed to load projects. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [projectId]);

  useEffect(() => {
    if (selectedProjectId && availableProjects.length > 0) {
      const project = availableProjects.find(p => p.id === selectedProjectId);
      setCurrentProject(project || null);
    }
  }, [selectedProjectId, availableProjects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !formData.name.trim()) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (selectedFiles.length > 0) {
        // Create simulation with log files (multiple files supported)
        await apiService.createSimulationWithLogFiles(
          DEFAULT_USER_ID,
          selectedProjectId,
          formData.name.trim(),
          formData.description.trim(),
          selectedFiles
        );
      } else {
        // Create simulation without log files
        await apiService.createSimulation(DEFAULT_USER_ID, selectedProjectId, {
          name: formData.name.trim(),
          description: formData.description.trim()
        });
      }
      
      router.push(`/projects/${selectedProjectId}`);
    } catch (error) {
      console.error("Failed to create simulation:", error);
      alert("Failed to create simulation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const generateSimulationName = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const timestamp = `${year}${month}${day}-${hours}${minutes}${seconds}`;
    return `simulation-${timestamp}`;
  };

  const generateSimulationDescription = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const descriptions = [
      `Performance analysis simulation created on ${dateStr}. This simulation will analyze CometBFT consensus behavior and network performance metrics.`,
      `Network latency optimization study initiated on ${dateStr}. Focus on identifying bottlenecks and improving consensus efficiency.`,
      `Consensus protocol behavior analysis for ${dateStr}. Monitoring node interactions and block production performance.`,
      `Load testing simulation created on ${dateStr}. Evaluating system performance under various network conditions.`,
      `Baseline performance measurement started on ${dateStr}. Capturing default behavior for comparison with future optimizations.`
    ];
    
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  };

  const handleAutoGenerateName = () => {
    const generatedName = generateSimulationName();
    setFormData(prev => ({
      ...prev,
      name: generatedName
    }));
  };

  const handleAutoGenerateDescription = () => {
    const generatedDescription = generateSimulationDescription();
    setFormData(prev => ({
      ...prev,
      description: generatedDescription
    }));
  };

  if (isLoading) {
    return (
      <div className="px-6 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2864FF] mx-auto mb-4"></div>
            <p className="text-gray-400">Loading projects...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href={currentProject ? `/projects/${currentProject.id}` : "/projects"}
            className="p-2 hover:bg-[#2E364D] rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-400" />
          </Link>
          <div>
            {currentProject && (
              <div className="flex items-center gap-2 mb-1">
                <Link href={`/projects/${currentProject.id}`} className="text-gray-400 hover:text-white text-sm">
                  {currentProject.name}
                </Link>
                <span className="text-gray-600">/</span>
              </div>
            )}
            <h1 className="text-3xl font-bold text-white">New Simulation</h1>
            <p className="text-gray-400">Create a new simulation for CometBFT log analysis</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[#2E364D] border border-gray-600 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="project" className="block text-sm font-medium text-white mb-2">
                  Project *
                </label>
                {projectId ? (
                  <div className="w-full bg-[#1C2337] border border-gray-600 rounded-lg px-3 py-2 text-gray-300">
                    {currentProject?.name || "Loading..."}
                  </div>
                ) : (
                  <select
                    id="project"
                    name="project"
                    required
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full bg-[#1C2337] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#2864FF] focus:border-transparent"
                  >
                    <option value="">Select a project...</option>
                    {availableProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                  Simulation Name *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="flex-1 bg-[#1C2337] border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2864FF] focus:border-transparent"
                    placeholder="Enter simulation name..."
                  />
                  <button
                    type="button"
                    onClick={handleAutoGenerateName}
                    className="bg-[#2864FF]/20 hover:bg-[#2864FF]/30 border border-[#2864FF]/40 text-[#2864FF] px-3 py-2 rounded-lg flex items-center gap-1 transition-colors text-sm whitespace-nowrap"
                    title="Auto-generate name"
                  >
                    <Sparkles size={14} />
                    Generate
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Auto-generate creates: simulation-YYYYMMDD-HHMMSS</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="description" className="block text-sm font-medium text-white">
                    Description
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoGenerateDescription}
                    className="bg-[#2864FF]/20 hover:bg-[#2864FF]/30 border border-[#2864FF]/40 text-[#2864FF] px-2 py-1 rounded-lg flex items-center gap-1 transition-colors text-xs"
                    title="Auto-generate description"
                  >
                    <RefreshCw size={12} />
                    Generate
                  </button>
                </div>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full bg-[#1C2337] border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2864FF] focus:border-transparent resize-none"
                  placeholder="Describe this simulation..."
                />
                <p className="text-xs text-gray-500 mt-1">Auto-generate creates a contextual description with timestamp</p>
              </div>

            </div>
          </div>

          <div className="bg-[#2E364D] border border-gray-600 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Log Files (Optional)</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-white mb-2">
                Upload CometBFT Log Files (Multiple files supported)
              </label>
              <p className="text-gray-400 text-sm mb-3">
                You can upload multiple log files now or add them later from the simulation details page.
              </p>
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
              <div className="space-y-2">
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
                        onClick={() => removeFile(index)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Link
              href={currentProject ? `/projects/${currentProject.id}` : "/projects"}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!selectedProjectId || !formData.name.trim() || isSubmitting}
              className="bg-[#2864FF] hover:bg-[#1E4ED8] disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Save size={16} />
              {isSubmitting ? "Creating..." : "Create Simulation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewSimulationPage() {
  return (
    <Suspense fallback={<div className="px-6 py-6"><div className="max-w-2xl mx-auto"><div className="text-white">Loading...</div></div></div>}>
      <NewSimulationContent />
    </Suspense>
  );
}