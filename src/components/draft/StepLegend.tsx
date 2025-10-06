"use client";
import { useRef, useState } from "react";

export const stepColorMap: { [step: string]: string } = {
  ReceivedCompleteProposalBlock: "#7EB26D",
  EnteringNewRound: "#EAB839",
  EnteringProposeStep: "#6ED0E0",
  EnteringPrevoteStep: "#EF843C",
  EnteringPrevoteWaitStep: "#E24D42",
  EnteringPrecommitStep: "#1F78C1",
  EnteringPrecommitWaitStep: "#BA43A9",
  EnteringCommitStep: "#705DA0",
  Locking: "#508642",
  ScheduledTimeout: "#CCA300",
  FinalizingCommitOfBlock: "#447EBC",
  CommittedBlock: "#C15C17",
  UpdatingValidBlock: "#890F02",
};

export const p2pEvents = [
  {
    label: "Send Vote",
    arrow: "→",
    color: "#4FC3F7",
    type: "SendVote",
  },
  {
    label: "Receive Vote",
    arrow: "←",
    color: "#0288D1",
    type: "ReceiveVote",
  },
  {
    label: "Send Block Part",
    arrow: "→",
    color: "#81C784",
    type: "SendBlockPart",
  },
  {
    label: "Receive Block Part",
    arrow: "←",
    color: "#388E3C",
    type: "ReceiveBlockPart",
  },
];

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

const consensusSteps = Object.keys(stepColorMap);

export default function StepLegend({
  selectedSteps,
  setSelectedSteps,
  selectedEvents,
  setSelectedEvents,
}: {
  selectedSteps: string[];
  setSelectedSteps: React.Dispatch<React.SetStateAction<string[]>>;
  selectedEvents: string[];
  setSelectedEvents: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  // const [selectedSteps, setSelectedSteps] = useState(() => consensusSteps.map((s) => s));
  // const [selectedEvents, setSelectedEvents] = useState(() => p2pEvents.map((e) => e.label));

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dragBox, setDragBox] = useState<Box | null>(null);
  const isCtrlDown = useRef(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  // 항목 ref 리스트
  const stepRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const eventRefs = useRef<Map<string, HTMLLIElement>>(new Map());

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    isCtrlDown.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    setDragBox({ x: e.clientX, y: e.clientY, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isCtrlDown.current || !dragStart.current) return;
    const start = dragStart.current;
    const x = Math.min(start.x, e.clientX);
    const y = Math.min(start.y, e.clientY);
    const width = Math.abs(start.x - e.clientX);
    const height = Math.abs(start.y - e.clientY);
    setDragBox({ x, y, width, height });
  };

  const handleMouseUp = () => {
    if (!dragBox || !isCtrlDown.current) {
      setDragBox(null);
      dragStart.current = null;
      isCtrlDown.current = false;
      return;
    }

    const rect = dragBox;
    const newlySelectedSteps: string[] = [];
    const newlySelectedEvents: string[] = [];

    stepRefs.current.forEach((el, key) => {
      const box = el.getBoundingClientRect();
      if (
        box.left < rect.x + rect.width &&
        box.right > rect.x &&
        box.top < rect.y + rect.height &&
        box.bottom > rect.y
      ) {
        newlySelectedSteps.push(key);
      }
    });

    eventRefs.current.forEach((el, key) => {
      const box = el.getBoundingClientRect();
      if (
        box.left < rect.x + rect.width &&
        box.right > rect.x &&
        box.top < rect.y + rect.height &&
        box.bottom > rect.y
      ) {
        newlySelectedEvents.push(key);
      }
    });

    setSelectedSteps((prev) => Array.from(new Set([...prev, ...newlySelectedSteps])));
    setSelectedEvents((prev) => Array.from(new Set([...prev, ...newlySelectedEvents])));
    setDragBox(null);
    dragStart.current = null;
    isCtrlDown.current = false;
  };

  const toggleStep = (step: string, e: React.MouseEvent) => {
    const isCtrl = e.ctrlKey || e.metaKey;
    const isAlreadySelected = selectedSteps.includes(step);

    if (isCtrl) {
      if (isAlreadySelected) {
        setSelectedSteps(selectedSteps.filter((s) => s !== step));
      } else {
        setSelectedSteps([...selectedSteps, step]);
      }
    } else {
      setSelectedSteps(isAlreadySelected ? selectedSteps.filter((s) => s !== step) : [...selectedSteps, step]);
    }
  };

  const toggleEvent = (label: string, e: React.MouseEvent) => {
    const isCtrl = e.ctrlKey || e.metaKey;
    const isAlreadySelected = selectedEvents.includes(label);

    if (isCtrl) {
      if (isAlreadySelected) {
        setSelectedEvents(selectedEvents.filter((l) => l !== label));
      } else {
        setSelectedEvents([...selectedEvents, label]);
      }
    } else {
      setSelectedEvents(isAlreadySelected ? selectedEvents.filter((l) => l !== label) : [...selectedEvents, label]);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative text-sm font-sans select-none"
    >
      <ul className="space-y-1">
        {consensusSteps.map((step) => (
          <li
            key={step}
            ref={(el) => {
              if (el) stepRefs.current.set(step, el);
            }}
            onClick={(e) => toggleStep(step, e)}
            className={`flex items-center cursor-pointer p-1 rounded-md ${
              selectedSteps.includes(step) ? "bg-gray-700" : ""
            }`}
          >
            <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: stepColorMap[step] }}></span>
            {step}
          </li>
        ))}
      </ul>

      <ul className="mt-4 space-y-1">
        {p2pEvents.map((event) => (
          <li
            key={event.label}
            ref={(el) => {
              if (el) eventRefs.current.set(event.label, el);
            }}
            onClick={(e) => toggleEvent(event.label, e)}
            className={`flex items-center h-5 cursor-pointer p-1 rounded-md ${
              selectedEvents.includes(event.label) ? "bg-gray-700" : ""
            }`}
          >
            <h1 className="text-4xl mr-2" style={{ color: event.color }}>
              {event.arrow}
            </h1>
            {event.label}
          </li>
        ))}
      </ul>

      {dragBox && (
        <div
          className="absolute border-2 border-blue-400 bg-blue-200 bg-opacity-20 pointer-events-none z-50"
          style={{
            left: dragBox.x,
            top: dragBox.y,
            width: dragBox.width,
            height: dragBox.height,
          }}
        />
      )}
    </div>
  );
}
