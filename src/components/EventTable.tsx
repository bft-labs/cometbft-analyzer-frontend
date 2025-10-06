import React, { useRef, useCallback, useEffect, useState } from "react";
import { formatMilliseconds } from "@/utils/timeUtils";

const ROW_HEIGHT = 40; // Approximate height of each row
const INITIAL_LOAD_COUNT = 50;
const LOAD_MORE_COUNT = 20;

interface EventTableProps {
  events: CanvasEvent[];
  onSelectEvent: (event: CanvasEvent) => void;
  selectedEvent: CanvasEvent | null;
}

export const EventTable: React.FC<EventTableProps> = ({ events, onSelectEvent, selectedEvent }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [visibleItemsCount, setVisibleItemsCount] = useState(INITIAL_LOAD_COUNT);

  useEffect(() => {
    // Reset visible items when events data changes
    setVisibleItemsCount(INITIAL_LOAD_COUNT);
  }, [events]);

  useEffect(() => {
    if (selectedEvent && scrollRef.current) {
      const index = events.findIndex((e) => e === selectedEvent);
      if (index !== -1) {
        const offset = index * ROW_HEIGHT;
        scrollRef.current.scrollTo({
          top: offset - scrollRef.current.clientHeight / 2 + ROW_HEIGHT / 2,
          behavior: "smooth",
        });

        // Ensure the selected item is within the visible range
        if (index >= visibleItemsCount) {
          setVisibleItemsCount(index + LOAD_MORE_COUNT);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEvent, events]);

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (scrollTop + clientHeight >= scrollHeight - ROW_HEIGHT * 5) {
        // Load more when near bottom
        setVisibleItemsCount((prevCount) => Math.min(prevCount + LOAD_MORE_COUNT, events.length));
      }
    }
  }, [events.length]);

  return (
    <div className="h-[500px] flex flex-col">
      <div className="flex border-b border-gray-600 pb-2 font-semibold sticky top-0 bg-[#2E364D] z-10">
        <div className="w-1/4 text-sm">Time</div>
        <div className="w-1/4 text-sm">NodeId</div>
        <div className="w-1/4 text-sm">ValidatorAddress</div>
        <div className="w-1/4 text-sm">Type</div>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-hide"
        onScroll={handleScroll}
        style={{ height: `calc(100% - ${ROW_HEIGHT}px)` }} // Adjust height for header
      >
        {events.slice(0, visibleItemsCount).map((event, index) => {
          const isSelected = selectedEvent && selectedEvent === event;
          return (
            <div
              key={index} // Using index as key for now, consider unique event ID if available
              className={`flex items-center border-b border-gray-700 py-2 px-2 cursor-pointer ${
                isSelected ? "bg-blue-800" : "hover:bg-gray-700"
              }`}
              onClick={() => onSelectEvent(event)}
              style={{ height: ROW_HEIGHT }}
            >
              <div className="w-1/4 text-sm">{formatMilliseconds(event.timestamp.getTime())}</div>
              <div className="w-1/4 text-sm">{event.nodeId?.slice(0, 6) + "..."}</div>
              <div className="w-1/4 text-sm">{event.validatorAddress?.slice(0, 6) + "..."}</div>
              <div className="w-1/4 text-sm">{event.type}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
