import React from "react";

interface EventDetailPanelProps {
  selectedEvent: CanvasEvent | null;
}

export const EventDetailPanel: React.FC<EventDetailPanelProps> = ({ selectedEvent }) => {
  if (!selectedEvent) {
    return <div className="text-gray-400">Select an event to see details.</div>;
  }

  return (
    <div className="text-sm">
      <div className="mb-1">
        <span className="font-semibold">Type:</span> {selectedEvent.type}
      </div>
      <div className="mb-1">
        <span className="font-semibold">Timestamp:</span> {selectedEvent.timestamp.toISOString()}
      </div>
      <div className="mb-1">
        <span className="font-semibold">Node ID:</span> {selectedEvent.nodeId}
      </div>
      <div className="mb-1">
        <span className="font-semibold">Validator Address:</span> {selectedEvent.validatorAddress}
      </div>
      <pre className="bg-gray-700 p-2 rounded mt-4 text-xs whitespace-pre-wrap break-words overflow-y-scroll scrollbar-hide max-h-90">
        <code>{JSON.stringify(selectedEvent, null, 2)}</code>
      </pre>
    </div>
  );
};
