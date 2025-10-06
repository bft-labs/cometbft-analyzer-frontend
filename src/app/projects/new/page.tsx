"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { apiService } from "@/services/api";
import { DEFAULT_USER_ID } from "@/config/env";

const objectives = [
  { 
    value: "network_latency", 
    label: "Network Latency", 
    description: "Optimize network communication delays",
    defaultName: "Network Latency Optimization",
    defaultDescription: "Analyze and optimize network communication delays between CometBFT nodes to improve overall consensus performance."
  },
  { 
    value: "block_time", 
    label: "Block Time", 
    description: "Reduce block confirmation time",
    defaultName: "Block Time Reduction",
    defaultDescription: "Optimize block confirmation time by analyzing consensus rounds and reducing unnecessary delays in the consensus process."
  },
  { 
    value: "consensus_performance", 
    label: "Consensus Performance", 
    description: "Overall consensus mechanism optimization",
    defaultName: "Consensus Performance Study",
    defaultDescription: "Comprehensive analysis of consensus mechanism performance including throughput, latency, and reliability metrics."
  },
  { 
    value: "custom", 
    label: "Custom", 
    description: "Define your own optimization goals",
    defaultName: "",
    defaultDescription: ""
  }
];

export default function NewProjectPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "Network Latency Optimization",
    description: "Analyze and optimize network communication delays between CometBFT nodes to improve overall consensus performance.",
    objective: "network_latency" as Project['objective']
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userEditedFields, setUserEditedFields] = useState({
    name: false,
    description: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiService.createProject(DEFAULT_USER_ID, {
        name: formData.name.trim(),
        description: formData.description.trim()
      });
      
      router.push("/projects");
    } catch (error) {
      console.error("Failed to create project:", error);
      alert("Failed to create project. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Mark field as user-edited
    if (name === 'name' || name === 'description') {
      setUserEditedFields(prev => ({
        ...prev,
        [name]: true
      }));
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleObjectiveChange = (objectiveValue: string) => {
    const selectedObjective = objectives.find(obj => obj.value === objectiveValue);
    
    if (selectedObjective) {
      setFormData(prev => ({
        ...prev,
        objective: objectiveValue as Project['objective'],
        // Auto-fill name and description only if user hasn't edited them
        ...((!userEditedFields.name && selectedObjective.defaultName) && { name: selectedObjective.defaultName }),
        ...((!userEditedFields.description && selectedObjective.defaultDescription) && { description: selectedObjective.defaultDescription })
      }));
    }
  };

  return (
    <div className="px-6 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/projects"
            className="p-2 hover:bg-[#2E364D] rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">New Project</h1>
            <p className="text-gray-400">Create a new CometBFT analysis project</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[#2E364D] border border-gray-600 rounded-lg p-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-[#1C2337] border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2864FF] focus:border-transparent"
                  placeholder="Enter project name..."
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full bg-[#1C2337] border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2864FF] focus:border-transparent resize-none"
                  placeholder="Describe your project goals and methodology..."
                />
              </div>

              <div>
                <label htmlFor="objective" className="block text-sm font-medium text-white mb-3">
                  Recommendations *
                </label>
                <div className="space-y-3">
                  {objectives.map((objective) => (
                    <label
                      key={objective.value}
                      className="flex items-start gap-3 p-3 bg-[#1C2337] border border-gray-600 rounded-lg cursor-pointer hover:border-gray-500 transition-colors"
                    >
                      <input
                        type="radio"
                        name="objective"
                        value={objective.value}
                        checked={formData.objective === objective.value}
                        onChange={(e) => handleObjectiveChange(e.target.value)}
                        className="mt-0.5 text-[#2864FF] focus:ring-[#2864FF]"
                      />
                      <div>
                        <div className="text-white font-medium">{objective.label}</div>
                        <div className="text-gray-400 text-sm">{objective.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Link
              href="/projects"
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!formData.name.trim() || isSubmitting}
              className="bg-[#2864FF] hover:bg-[#1E4ED8] disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Save size={16} />
              {isSubmitting ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}