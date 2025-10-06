import { API_BASE_URL } from '@/config/env';

export interface ApiUser {
  _id: string;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface ApiProject {
  id: string;
  userId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface LogFileInfo {
  originalFilename: string;
  filePath: string;
  fileSize: number;
  uploadedAt: string;
}

export interface ApiSimulation {
  id: string;
  userId: string;
  projectId: string;
  name: string;
  description: string;
  logFiles?: LogFileInfo[];
  status: 'logfile_required' | 'processing' | 'processed' | 'failed';
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  processingResult?: {
    processedFiles: number;
    totalFiles: number;
    processingTime: number;
    errorMessage?: string;
    processedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ApiLogFile {
  filename: string;
  size: number;
}

export interface CreateProjectRequest {
  name: string;
  description: string;
}

export interface CreateSimulationRequest {
  name: string;
  description: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

export interface UpdateSimulationRequest {
  name?: string;
  description?: string;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    return response.json();
  }

  async createUser(username: string, email: string): Promise<ApiUser> {
    return this.request<ApiUser>("/users", {
      method: "POST",
      body: JSON.stringify({ username, email }),
    });
  }

  async getUsers(): Promise<ApiUser[]> {
    return this.request<ApiUser[]>("/users");
  }

  async getUserById(userId: string): Promise<ApiUser> {
    return this.request<ApiUser>(`/users/${userId}`);
  }

  async deleteUser(userId: string): Promise<void> {
    await this.request(`/users/${userId}`, {
      method: "DELETE",
    });
  }

  async createProject(userId: string, project: CreateProjectRequest): Promise<ApiProject> {
    return this.request<ApiProject>(`/users/${userId}/projects`, {
      method: "POST",
      body: JSON.stringify(project),
    });
  }

  async getProjectsByUser(userId: string): Promise<ApiProject[]> {
    return this.request<ApiProject[]>(`/users/${userId}/projects`);
  }

  async getProjectById(projectId: string): Promise<ApiProject> {
    return this.request<ApiProject>(`/projects/${projectId}`);
  }

  async updateProject(projectId: string, updates: UpdateProjectRequest): Promise<ApiProject> {
    return this.request<ApiProject>(`/projects/${projectId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async deleteProject(projectId: string): Promise<void> {
    await this.request(`/projects/${projectId}`, {
      method: "DELETE",
    });
  }

  async createSimulation(
    userId: string,
    projectId: string,
    simulation: CreateSimulationRequest
  ): Promise<ApiSimulation> {
    return this.request<ApiSimulation>(`/users/${userId}/projects/${projectId}/simulations`, {
      method: "POST",
      body: JSON.stringify(simulation),
    });
  }

  async createSimulationWithLogFiles(
    userId: string,
    projectId: string,
    name: string,
    description: string,
    logFiles: File[]
  ): Promise<ApiSimulation> {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    
    // Append multiple files with the same key name "logfiles"
    logFiles.forEach(file => {
      formData.append("logfiles", file);
    });

    const url = `${API_BASE_URL}/users/${userId}/projects/${projectId}/simulations`;
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    return response.json();
  }

  async getSimulationsByUser(userId: string): Promise<ApiSimulation[]> {
    return this.request<ApiSimulation[]>(`/users/${userId}/simulations`);
  }

  async getSimulationsByProject(projectId: string): Promise<ApiSimulation[]> {
    return this.request<ApiSimulation[]>(`/projects/${projectId}/simulations`);
  }

  async getSimulationById(simulationId: string): Promise<ApiSimulation> {
    return this.request<ApiSimulation>(`/simulations/${simulationId}`);
  }

  async updateSimulation(simulationId: string, updates: UpdateSimulationRequest): Promise<ApiSimulation> {
    return this.request<ApiSimulation>(`/simulations/${simulationId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async uploadLogFiles(simulationId: string, logFiles: File[]): Promise<ApiLogFile> {
    const formData = new FormData();
    logFiles.forEach(file => {
      formData.append("logfiles", file);
    });

    const url = `${API_BASE_URL}/simulations/${simulationId}/upload`;
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    return response.json();
  }

  async processSimulation(simulationId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/simulations/${simulationId}/process`, {
      method: "POST",
    });
  }

  async deleteSimulation(simulationId: string): Promise<void> {
    await this.request(`/simulations/${simulationId}`, {
      method: "DELETE",
    });
  }

  // Simulation-specific metric endpoints
  async getSimulationVoteLatencies(
    simulationId: string,
    params: {
      from?: string;
      to?: string;
      page?: number;
      perPage?: number;
      threshold?: string;
    } = {}
  ): Promise<unknown> {
    const queryParams = new URLSearchParams();
    if (params.from) queryParams.append('from', params.from);
    if (params.to) queryParams.append('to', params.to);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.perPage) queryParams.append('perPage', params.perPage.toString());
    if (params.threshold) queryParams.append('threshold', params.threshold);

    return this.request(`/simulations/${simulationId}/metrics/latency/votes?${queryParams}`);
  }

  async getSimulationPairLatency(
    simulationId: string,
    params: { from?: string; to?: string } = {}
  ): Promise<unknown> {
    const queryParams = new URLSearchParams();
    if (params.from) queryParams.append('from', params.from);
    if (params.to) queryParams.append('to', params.to);

    return this.request(`/simulations/${simulationId}/metrics/latency/pairwise?${queryParams}`);
  }

  async getSimulationBlockLatencyTimeSeries(
    simulationId: string,
    params: { from?: string; to?: string } = {}
  ): Promise<unknown> {
    const queryParams = new URLSearchParams();
    if (params.from) queryParams.append('from', params.from);
    if (params.to) queryParams.append('to', params.to);

    return this.request(`/simulations/${simulationId}/metrics/latency/timeseries?${queryParams}`);
  }

  async getSimulationLatencyStats(
    simulationId: string,
    params: { from?: string; to?: string } = {}
  ): Promise<unknown> {
    const queryParams = new URLSearchParams();
    if (params.from) queryParams.append('from', params.from);
    if (params.to) queryParams.append('to', params.to);

    return this.request(`/simulations/${simulationId}/metrics/latency/stats?${queryParams}`);
  }

  async getSimulationMessageSuccessRate(
    simulationId: string,
    params: { from?: string; to?: string } = {}
  ): Promise<unknown> {
    const queryParams = new URLSearchParams();
    if (params.from) queryParams.append('from', params.from);
    if (params.to) queryParams.append('to', params.to);

    return this.request(`/simulations/${simulationId}/metrics/messages/success_rate?${queryParams}`);
  }

  async getSimulationBlockEndToEndLatency(
    simulationId: string,
    params: { from?: string; to?: string } = {}
  ): Promise<unknown> {
    const queryParams = new URLSearchParams();
    if (params.from) queryParams.append('from', params.from);
    if (params.to) queryParams.append('to', params.to);

    return this.request(`/simulations/${simulationId}/metrics/latency/end_to_end?${queryParams}`);
  }

  async getSimulationVoteStatistics(
    simulationId: string,
    params: { from?: string; to?: string } = {}
  ): Promise<unknown> {
    const queryParams = new URLSearchParams();
    if (params.from) queryParams.append('from', params.from);
    if (params.to) queryParams.append('to', params.to);

    return this.request(`/simulations/${simulationId}/metrics/vote/statistics?${queryParams}`);
  }

  async getSimulationNetworkLatencyStats(
    simulationId: string,
    params: { from?: string; to?: string } = {}
  ): Promise<unknown> {
    const queryParams = new URLSearchParams();
    if (params.from) queryParams.append('from', params.from);
    if (params.to) queryParams.append('to', params.to);

    return this.request(`/simulations/${simulationId}/metrics/network/latency/stats?${queryParams}`);
  }

  async getSimulationNetworkLatencyNodeStats(
    simulationId: string
  ): Promise<unknown> {
    return this.request(`/simulations/${simulationId}/metrics/network/latency/node-stats`);
  }

  async getSimulationNetworkLatencyOverview(
    simulationId: string,
    params: { from?: string; to?: string } = {}
  ): Promise<unknown> {
    const queryParams = new URLSearchParams();
    if (params.from) queryParams.append('from', params.from);
    if (params.to) queryParams.append('to', params.to);

    return this.request(`/simulations/${simulationId}/metrics/network/latency/overview?${queryParams}`);
  }

  async getSimulationConsensusEvents(
    simulationId: string,
    params: { 
      from?: string; 
      to?: string; 
      limit?: number;
      cursor?: string;
      before?: string;
      segment?: number;
      includeTotalCount?: boolean;
    } = {}
  ): Promise<{
    data: unknown[];
    pagination: {
      limit: number;
      hasNext: boolean;
      hasPrevious: boolean;
      nextCursor?: string;
      previousCursor?: string;
      totalCount?: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params.from) queryParams.append('from', params.from);
    if (params.to) queryParams.append('to', params.to);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.cursor) queryParams.append('cursor', params.cursor);
    if (params.before) queryParams.append('before', params.before);
    if (params.segment) queryParams.append('segment', params.segment.toString());
    if (params.includeTotalCount) queryParams.append('includeTotalCount', 'true');

    return this.request(`/simulations/${simulationId}/events?${queryParams}`);
  }
}

export const apiService = new ApiService();