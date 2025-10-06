type EventTypes =
  | "sendVote"
  | "receiveVote"
  | "receivedProposal"
  | "receivedCompleteProposalBlock"
  | "stepChange"
  | "enteringNewRound"
  | "scheduledTimeout";
type EventType = "send_vote" | "send_message" | "state_change" | "receive_vote";
type ArrowMsgType = "SendVote" | "ReceiveVote" | "SendBlockPart" | "ReceiveBlockPart";

interface EventData {
  event_type: EventType;
  timestamp: number;
  from?: string | null;
  to?: string | null;
  message_type?: string | null;
  height?: number;
  signature?: string | null;
  previousRound?: number;
  currentRound?: number;
  node?: string | null;
  currentStep?: string;
  targetStep?: string;
  voteType?: string;
}

interface ArrowData {
  type: "arrow";
  fromNode: string;
  toNode: string;
  msgType: ArrowMsgType;
  height: number;
  sendTime: number;
  recvTime: number;
}

interface DraftApiEventResponse {
  Type: EventTypes;
  Timestamp: string; // ISO 8601 format
  NodeId: string;
  ValidatorAddress: string;

  // Additional fields for specific event types
  currentHeight?: number;
  currentRound?: number;
  currentStep?: string;

  height?: number;
  duration?: string;
  step?: string;
  hash?: string;
  round?: number;
  proposer?: string;
  targetStep?: string;

  previousHeight?: number;
  previousRound?: number;
  previousStep?: string;

  vote?: {
    Type: string;
    Height: number;
    Round: number;
    BlockId: {
      Hash: string;
      PartSetHeader: {
        Total: number;
        Hash: string;
      };
    };
    Timestamp: string; // ISO 8601 format
    ValidatorAddress: string;
    ValidatorIndex: number;
    Signature: string;
    Extension: string;
    ExtensionSignature: string;
  };

  proposal?: {
    Height: number;
    Round: number;
    PolRound: number;
    BlockID: {
      Hash: string;
      PartSetHeader: {
        Total: number;
        Hash: string;
      };
    };
    Timestamp: string;
    Signature: string;
  };

  recipientPeer?: string;
  sourcePeer?: string;
}
