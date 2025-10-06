import React from "react";

interface TooltipProps {
  hoveredObject: CanvasArrowData | StateChangePoint | null;
  position: { x: number; y: number };
}

// 재사용 가능한 툴팁 헤더 컴포넌트
const TooltipHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="col-span-2 pb-1 mb-2 font-bold text-sky-400 border-b border-gray-600">{title}</div>
);

// 재사용 가능한 툴팁 행 컴포넌트
const TooltipRow: React.FC<{ label: string; value: React.ReactNode; title?: string }> = ({ label, value, title }) => (
  <>
    <div className="font-medium text-gray-400">{label}</div>
    <div title={title}>{value}</div>
  </>
);

const Tooltip: React.FC<TooltipProps> = ({ hoveredObject, position }) => {
  if (!hoveredObject) {
    return null;
  }

  const renderP2PVote = (data: CanvasArrowData) => (
    <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-2 items-center">
      <TooltipHeader title={data.type} />
      <TooltipRow label="Type" value={data.vote?.type} />
      <TooltipRow label="Voter" value={data.vote?.validatorAddress} title={data.vote?.validatorAddress} />
      <TooltipRow label="Block Hash" value={data.vote?.blockId.hash} title={data.vote?.blockId.hash} />
      <TooltipRow label="Sender" value={data.fromNode} title={data.fromNode} />
      <TooltipRow label="Sent At" value={new Date(data.sendTime).toISOString()} />
      <TooltipRow label="Receiver" value={data.toNode} title={data.toNode} />
      <TooltipRow label="Received At" value={new Date(data.recvTime).toISOString()} />
      <TooltipRow label="Latency" value={`${(data.latency ?? 0) / 1000000}ms`} />
      <TooltipRow label="Timestamp" value={new Date(data.timestamp).toISOString()} />
    </div>
  );

  const renderP2PBlockPart = (data: CanvasArrowData) => (
    <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-2 items-center">
      <TooltipHeader title={data.type} />
      <TooltipRow label="Part Index" value={data.part?.index} />
      <TooltipRow label="Part Size" value={`${(data.part?.bytes?.length ?? 0) / 2} bytes`} />
      <TooltipRow label="Parts Total" value={data.part?.proof.total} />
      <TooltipRow label="Sender" value={data.fromNode} title={data.fromNode} />
      <TooltipRow label="Sent At" value={new Date(data.sendTime).toISOString()} />
      <TooltipRow label="Receiver" value={data.toNode} title={data.toNode} />
      <TooltipRow label="Received At" value={new Date(data.recvTime).toISOString()} />
      <TooltipRow label="Latency" value={`${(data.latency ?? 0) / 1000000}ms`} />
      <TooltipRow label="Timestamp" value={new Date(data.timestamp).toISOString()} />
    </div>
  );

  const renderStep = (data: StateChangePoint) => {
    const commonFields = (
      <>
        <TooltipHeader title={data.type} />
        <TooltipRow label="Node" value={data.node} title={data.node} />
        <TooltipRow label="Time" value={new Date(data.timestamp).toLocaleTimeString()} />
      </>
    );

    switch (data.type) {
      case "receivedProposal":
        return (
          <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-2 items-center">
            {commonFields}
            <TooltipRow label="Proposal Height" value={data.proposal?.height} />
            <TooltipRow label="Proposal Round" value={data.proposal?.round} />
            <TooltipRow label="Proposer" value={data.proposer} title={data.proposer} />
            <TooltipRow label="Timestamp" value={new Date(data.timestamp).toISOString()} />
          </div>
        );
      case "receivedCompleteProposalBlock":
        return (
          <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-2 items-center">
            {commonFields}
            <TooltipRow label="Height" value={data.height} />
            <TooltipRow label="Hash" value={data.hash} title={data.hash} />
            <TooltipRow label="Timestamp" value={new Date(data.timestamp).toISOString()} />
          </div>
        );
      case "proposeStep":
        return (
          <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-2 items-center">
            {commonFields}
            <TooltipRow label="Step" value={data.type} />
            <TooltipRow label="Height" value={data.height} />
            <TooltipRow label="Round" value={data.round} />
            <TooltipRow label="Proposer" value={data.proposer} title={data.proposer} />
            <TooltipRow label="Is Our Turn" value={data.isOurTurn ? "Yes" : "No"} />
            <TooltipRow label="Timestamp" value={new Date(data.timestamp).toISOString()} />
          </div>
        );
      case "enteringPrevoteStep":
      case "enteringPrevoteWaitStep":
      case "enteringPrecommitStep":
      case "enteringPrecommitWaitStep":
      case "enteringCommitStep":
        return (
          <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-2 items-center">
            {commonFields}
            <TooltipRow label="Step" value={data.type} />
            <TooltipRow label="Height" value={data.currentHeight} />
            <TooltipRow label="Round" value={data.currentRound} />
            <TooltipRow label="Current Step" value={data.currentStep} />
            <TooltipRow label="Timestamp" value={new Date(data.timestamp).toISOString()} />
          </div>
        );
      case "scheduledTimeout":
        return (
          <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-2 items-center">
            {commonFields}
            <TooltipRow label="Next Height" value={data.height} />
            <TooltipRow label="Next Step" value={data.step} />
            <TooltipRow label="Duration" value={data.duration} />
            <TooltipRow label="Timestamp" value={new Date(data.timestamp).toISOString()} />
          </div>
        );
      default:
        return <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-2 items-center">{commonFields}</div>;
    }
  };

  const renderContent = () => {
    if (!hoveredObject) return null;

    if (hoveredObject.canvasType === "step") {
      return renderStep(hoveredObject);
    }

    if (hoveredObject.type === "prevote" || hoveredObject.type === "precommit") {
      return renderP2PVote(hoveredObject);
    } else if (hoveredObject.type === "blockPart") {
      return renderP2PBlockPart(hoveredObject);
    }

    return null;
  };

  return (
    <div
      className="absolute z-[999] p-3 text-sm font-mono text-gray-200 bg-gray-800/90 border border-gray-600 rounded-lg shadow-lg pointer-events-none transition-opacity duration-200"
      style={{ left: position.x + 15, top: position.y + 15 }}
    >
      {renderContent()}
    </div>
  );
};

export default Tooltip;
