"use client";
import { useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

export const stepColorMap: { [step: string]: string } = {
  enteringNewRound: "#EF843C",
  proposeStep: "#6ED0E0",
  receivedProposal: "#7EB26D",
  receivedCompleteProposalBlock: "#EAB839",
  enteringPrevoteStep: "#1F78C1",
  enteringPrevoteWaitStep: "#BA43A9",
  enteringPrecommitStep: "#508642",
  enteringPrecommitWaitStep: "#CCA300",
  enteringCommitStep: "#705DA0",
  scheduledTimeout: "#E24D42",
};

export const p2pEvents = [
  {
    label: "prevote",
    arrow: "→",
    color: "#4FC3F7",
    type: "prevote",
  },
  {
    label: "precommit",
    arrow: "→",
    color: "#81C784",
    type: "precommit",
  },
  {
    label: "blockPart",
    arrow: "→",
    color: "#EAB839",
    type: "blockPart",
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dragBox, setDragBox] = useState<Box | null>(null);
  const isCtrlDown = useRef(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  // Item refs
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
      className="relative text-sm font-sans select-none "
    >
      <ul className="mt-4 space-y-1">
        {p2pEvents.map((event) => (
          <li
            key={event.label}
            ref={(el) => {
              if (el) eventRefs.current.set(event.label, el);
            }}
            onClick={(e) => toggleEvent(event.label, e)}
            className={`flex items-center cursor-pointer border px-[10px] py-[7px] h-[34px] w-fit rounded-full ${
              selectedEvents.includes(event.label)
                ? "bg-[#535B77]  border-blue-500"
                : "text-[#C5C7D1] bg-[#535B77] border-transparent"
            }`}
          >
            <h1 className="mr-2" style={{ color: event.color }}>
              <ArrowRight className="inline w-5 h-5" />
            </h1>
            {event.label}
          </li>
        ))}
      </ul>

      <div className="w-full border-b my-[16px] border-[#535B77]"></div>

      <ul className="space-y-1">
        {consensusSteps.map((step) => (
          <li
            key={step}
            ref={(el) => {
              if (el) stepRefs.current.set(step, el);
            }}
            onClick={(e) => toggleStep(step, e)}
            className={`flex items-center cursor-pointer px-[10px] py-[7px] h-[34px] w-fit rounded-full border ${
              selectedSteps.includes(step)
                ? "bg-[#535B77] border-blue-500 "
                : "text-[#C5C7D1] bg-[#535B77] border-transparent"
            }`}
          >
            <span
              className="w-5 h-5 rounded-full mr-2 text-[15px]"
              style={{ backgroundColor: stepColorMap[step] }}
            ></span>
            {step}
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
