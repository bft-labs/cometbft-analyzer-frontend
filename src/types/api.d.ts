interface ApiEventResponse {
  eventType: string; // backend canonical event type
  timestamp: string; // ISO8601 형식
  nodeId: string;
  validatorAddress: string;

  vote?: CoreVote;
  proposal?: CoreProposal;
  part?: CorePart;

  height?: number;
  round?: number;
  currentHeight?: number;
  currentRound?: number;
  currentStep?: string;
  hash?: string;
  proposer?: string;

  status?: string;
  senderPeerId?: string;
  sentTime?: string;
  receivedTime?: string;
  latency?: number;
}

interface CoreVote {
  type: string; // 예: "prevote", "precommit"
  height: number;
  round: number;
  blockId: CoreBlockID;
  timestamp: string;
  validatorAddress: string;
  validatorIndex: number;
  signature: string;
  extension: string;
  extensionSignature: string;
}

interface CoreProposal {
  height: number;
  round: number;
  polRound: number;
  blockId: CoreBlockID;
  timestamp: string;
  signature: string;
}

interface CoreBlockID {
  hash: string;
  partSetHeader: {
    total: number;
    hash: string;
  };
}

interface CorePart {
  index: number;
  bytes: string;
  proof: CoreProof;
}

interface CoreProof {
  total: number;
  index: number;
  leafHash: string;
  aunts: string[] | null;
}

// -----------latency--------------
interface LatencyVotesResponse {
  height: number;
  round: number;
  type: string;
  validatorIndex: number;
  sender: string;
  receiver: string;
  sentTime: string;
  receivedTime: string;
  latencyMs: number;
}

interface NodeStatsResponse {
  nodeId: string;
  validatorAddress: string;
  totalSends: number;
  totalReceives: number;
  successfulMatches: number;
  unmatchedSends: number;
  unmatchedReceives: number;
  unmatchedSendsByType: {
    block_part: number;
    new_round_step: number;
    vote: number;
  };
  unmatchedReceivesByType: {
    block_part: number;
    new_round_step: number;
    proposal: number;
    vote: number;
  };
  unmatchedSendsByPeer: {
    [peerId: string]: number;
  };
  unmatchedReceivesByPeer: {
    [peerId: string]: number;
  };
  matchSuccessRate: number;
  connectedPeers: string[];
  peerCount: number;
}

interface MessageTypes {
  block_part: MessageLatencyStats;
  new_round_step: MessageLatencyStats;
  vote: MessageLatencyStats;
}

interface MessageLatencyStats {
  nodePairKey: string;
  node1Id: string;
  node2Id: string;
  messageType: string;
  node1Validator: string;
  node2Validator: string;
  latenciesMs: number[];
  count: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  meanLatencyMs: number;
  medianLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  firstSeen: string;
  lastSeen: string;
  belowP50Count: number;
  p50ToP95Count: number;
  p95ToP99Count: number;
  aboveP99Count: number;
}

interface LatencyStatsResponse {
  nodePairKey: string;
  node1Id: string;
  node2Id: string;
  node1Validator: string;
  node2Validator: string;
  messageTypes: MessageTypes;
  overallStats: MessageLatencyStats;
}
