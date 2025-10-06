import React, { useState, useEffect } from "react";
import { EventTable } from "./EventTable";
import { EventDetailPanel } from "./EventDetailPanel";

interface EventLogViewerProps {
  events: CanvasEvent[];
  selectedSteps: string[];
  selectedEvents: string[];
  selectedCanvasEvent?: CanvasEvent | null;
  onTableEventSelect?: (event: CanvasEvent | null) => void;
}

export const EventLogViewer: React.FC<EventLogViewerProps> = ({ events, selectedCanvasEvent, onTableEventSelect }) => {
  const [selectedEvent, setSelectedEvent] = useState<CanvasEvent | null>(null);

  // Canvas에서 클릭한 이벤트가 변경되면 테이블 선택도 업데이트
  useEffect(() => {
    if (selectedCanvasEvent) {
      setSelectedEvent(selectedCanvasEvent);
    }
  }, [selectedCanvasEvent]);

  // 테이블에서 이벤트 선택이 변경될 때 부모에게 알림
  const handleEventSelect = (event: CanvasEvent) => {
    setSelectedEvent(event);
    if (onTableEventSelect) {
      onTableEventSelect(event);
    }
  };

  return (
    <div className="flex w-full mt-4 gap-[16px]  overflow-hidden">
      <div className="flex-1 bg-[#2E364D] rounded-[8px] p-4">
        <h2 className="text-xl font-bold mb-4">Event Log</h2>
        <EventTable events={events} onSelectEvent={handleEventSelect} selectedEvent={selectedEvent} />
      </div>
      <div className="w-[500px] bg-[#2E364D] overflow-x-scroll scrollbar-hide rounded-[8px] p-4">
        <h2 className="text-xl font-bold mb-4">Event Details</h2>
        <EventDetailPanel selectedEvent={selectedEvent} />
      </div>
    </div>
  );
};
