interface LatencyData {
  nodePairKey: string;
  node1Id: string;
  node2Id: string;
  messageType: string;
  count: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  meanLatencyMs: number;
  medianLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  belowP50Count: number;
  p50ToP95Count: number;
  p95ToP99Count: number;
  aboveP99Count: number;
}

interface NodeStats {
  nodeId: string;
  validatorAddress: string;
  totalSends: number;
  totalReceives: number;
  successfulMatches: number;
  unmatchedSends: number;
  unmatchedReceives: number;
  matchSuccessRate: number;
  peerCount: number;
}

interface LatencyDistributionData {
  pair: string;
  messageType: string;
  median: number;
  p95: number;
  p99: number;
  mean: number;
  count: number;
}
