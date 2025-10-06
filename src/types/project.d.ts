interface Project {
  id: string;
  name: string;
  description: string;
  objective?: 'network_latency' | 'block_time' | 'consensus_performance' | 'custom';
  createdAt: Date;
  updatedAt: Date;
  simulationCount?: number;
  status?: 'active' | 'completed' | 'archived';
  userId?: string;
}

interface Simulation {
  id: string;
  projectId: string;
  name: string;
  description: string;
  status?: 'waiting_for_logs' | 'ready_to_process' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  logFiles?: LogFile[];
  results?: SimulationResults;
  errorMessage?: string;
  userId?: string;
  database?: string;
}

interface LogFile {
  id: string;
  name: string;
  size: number;
  uploadedAt: Date;
  status: 'uploading' | 'processing' | 'processed' | 'failed';
}

interface SimulationResults {
  consensusMetrics?: {
    avgBlockTime: string;
    totalBlocks: number;
    successRate: string;
  };
  latencyMetrics?: {
    avgLatency: string;
    p95Latency: string;
    maxLatency: string;
  };
  performanceMetrics?: {
    throughput: string;
    nodeUptime: string;
  };
}