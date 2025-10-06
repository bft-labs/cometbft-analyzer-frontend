// 상태 변경(State Change) 이벤트를 나타내는 데이터 포인트의 인터페이스
interface StateChangePoint {
  canvasType: "step";
  type: string;
  timestamp: Date; // 이벤트 발생 시간
  node: string; // 이벤트가 발생한 노드 ID
  hash?: string;
  height?: number; // 선택적 높이 정보
  round?: number; // 선택적 라운드 정보
  isOurTurn?: boolean; // 현재 노드의 턴 여부
  duration?: number; // 이벤트 지속 시간 (밀리초 단위)
  proposal?: CoreProposal; // 선택적 프로포절 데이터
  proposer?: string; // 프로포저 노드 ID
  currentHeight?: number;
  currentRound?: number;
  currentStep?: string | null; // 현재 스텝
  step?: string | null; // 이벤트가 발생한 스텝
  nextStep?: string | null; // 다음 스텝
  nextHeight?: number; // 다음 높이
}

interface CanvasArrowData {
  canvasType: "arrow";
  type: string;
  fromNode: string;
  toNode: string;
  height?: number;
  sendTime: number;
  recvTime: number;
  latency?: number;
  timestamp: Date;
  vote?: CoreVote;
  part?: CorePart;
}

// 그래프 캔버스 컴포넌트의 Props 인터페이스
interface GraphCanvasProps {
  data: CanvasEvent[]; // 현재 필터링되어 화면에 표시될 이벤트 데이터 배열
  onBrushSelect: (start: number, end: number) => void; // 사용자가 브러싱으로 시간 범위를 선택했을 때 호출될 콜백 함수
  selectedSteps: string[]; // 부모 컴포넌트에서 선택된 상태(Step) 필터 배열
  selectedEvents: string[]; // 부모 컴포넌트에서 선택된 P2P 이벤트 필터 배열
  onEventClick?: (event: CanvasEvent) => void; // 캔버스에서 이벤트를 클릭했을 때 호출될 콜백 함수
  selectedTableEvent?: CanvasEvent | null; // 테이블에서 선택된 이벤트 (Canvas에서 하이라이트용)
  selectedTableEventIndex?: number; // 선택된 이벤트의 인덱스 (정확한 매칭용)
  // Go tool trace style viewport props (optional)
  viewportStart?: number; // 현재 표시되는 시간 범위의 시작점 (밀리초)
  viewportEnd?: number; // 현재 표시되는 시간 범위의 끝점 (밀리초)  
  zoomLevel?: number; // 줌 레벨 (이벤트 간격 조정용)
}

interface CanvasEvent {
  type: string;
  timestamp: Date; // ISO8601 형식
  nodeId: string;
  validatorAddress: string;

  // 공통 또는 선택적 필드
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
  isOurTurn?: boolean;
  duration?: number;
  step?: string;
  nextStep?: string;
  nextHeight?: number;
}
