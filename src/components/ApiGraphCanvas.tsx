/**
 * @file ApiGraphCanvas.tsx
 * @description
 * React canvas for visualizing CometBFT consensus.
 * Renders P2P messages as arrows and node state changes as points using D3.js + HTML Canvas.
 * Users can inspect interactions over time and filter by event types and steps.
 *
 * Key features:
 * 1. Data visualization: Render nodes and events from API data (messages, state changes).
 * 2. Interactions:
 *    - Tooltip: Show details when hovering over arrows or points.
 *    - Brushing: Drag to select a time range; callback reports the selected window.
 * 3. Filtering: Respect selected P2P event types and consensus steps from parent.
 * 4. Responsive: Recompute scales and redraw on resize.
 */
"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import * as d3 from "d3";
import { p2pEvents, stepColorMap } from "./ApiStepLegend";
/**
 * GraphCanvas component
 * @param {GraphCanvasProps} props - component props
 * @returns {React.JSX.Element} rendered JSX element
 */
function GraphCanvas({
  data,
  onBrushSelect,
  selectedEvents,
  selectedSteps,
  onEventClick,
  selectedTableEvent,
  viewportStart,
  viewportEnd,
  zoomLevel,
}: GraphCanvasProps): React.JSX.Element {
  // DOM refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null); // canvas element

  // Tooltip state
  const [tooltip, setTooltip] = useState<{
    content: CanvasArrowData | StateChangePoint | null;
    position: { x: number; y: number };
  } | null>(null);

  // Graph margins
  const [margin] = useState({ top: 50, right: 50, bottom: 50, left: 80 });

  // D3 scales and canvas context refs
  const contextRef = useRef<CanvasRenderingContext2D | null>(null); // 2D context
  const xScaleRef = useRef<d3.ScaleLinear<number, number> | null>(null); // X scale (time)
  const yScaleRef = useRef<d3.ScaleBand<string> | null>(null); // Y scale (nodes)

  // Cached, processed data
  // We recompute only when data changes for performance
  const arrowDataRef = useRef<CanvasArrowData[]>([]); // P2P arrows (send/receive)
  const pointDataRef = useRef<StateChangePoint[]>([]); // state change points

  // Brushing state
  const [isBrushing, setIsBrushing] = useState(false); // currently brushing
  const [brushStart, setBrushStart] = useState<number | null>(null); // X start
  const [brushEnd, setBrushEnd] = useState<number | null>(null); // X end

  /**
   * @function drawAll
   * @description Main render method for all canvas elements.
   * @param {CanvasArrowData | StateChangePoint | null} highlightObj - object to highlight on hover, or null
   */
  const drawAll = (highlightObj: CanvasArrowData | StateChangePoint | null): void => {
    const canvasEl = canvasRef.current;
    const context = contextRef.current;
    if (!canvasEl || !context) return;

    // Handle devicePixelRatio for crisp rendering
    const { width, height } = canvasEl.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Fill background (including margins)
    context.fillStyle = "#2E364D";
    context.fillRect(0, 0, width, height);

    // Apply margins
    context.translate(margin.left, margin.top);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xScale = xScaleRef.current;
    const yScale = yScaleRef.current;

    if (!xScale || !yScale) return;

    // Filter by selected steps and current viewport range
    const [d0, d1] = xScale.domain();
    const scArr = pointDataRef.current.filter((pt) => {
      if (!selectedSteps.includes(pt.type || "")) return false;
      const tsMs = pt.timestamp instanceof Date ? pt.timestamp.getTime() : Number(pt.timestamp);
      return tsMs >= d0 && tsMs <= d1;
    });

    // For proposeStep with isOurTurn === true, draw a vertical dashed line + bottom labels (block height, ms)
    {
      context.save();
      context.strokeStyle = "#888";
      context.fillStyle = "#aaa";
      context.textAlign = "center";
      context.textBaseline = "top";
      context.font = "11px sans-serif";

      const visiblePropose = scArr.filter((sc) => {
        return sc.type === "proposeStep" && sc.isOurTurn;
      });

      // Show every 2nd block to reduce clutter
      visiblePropose
        .filter((_, index) => index % 2 === 0)
        .forEach((sc) => {
          const tsMs = sc.timestamp instanceof Date ? sc.timestamp.getTime() : Number(sc.timestamp);
          const x = xScale(tsMs);
          // dashed line
          context.setLineDash([5, 4]);
          context.lineWidth = 1;
          context.beginPath();
          context.moveTo(x, 0);
          context.lineTo(x, innerHeight);
          context.stroke();

          // Bottom labels: block height (top) and milliseconds (bottom)
          const heightLabel = sc.height ?? sc.currentHeight;
          const milliseconds = new Date(tsMs).getUTCMilliseconds();

          context.setLineDash([]); // reset dash before text
          context.font = "10px sans-serif"; // smaller font

          if (heightLabel !== undefined) {
            // Block height (top)
            context.fillText(`${heightLabel}`, x, innerHeight + 12);
            // Milliseconds (bottom)
            context.fillText(`${milliseconds}ms`, x, innerHeight + 24);
          }
        });

      context.restore();
    }

    // 1) Node horizontal lines and labels
    context.strokeStyle = "#555";
    context.fillStyle = "#ccc";
    context.textBaseline = "middle";
    context.textAlign = "right";

    const nodes = yScale.domain();
    nodes.forEach((nd) => {
      const yC = yScale(nd)! + yScale.bandwidth() / 2;
      context.beginPath();
      context.moveTo(0, yC);
      context.lineTo(innerWidth, yC);
      context.stroke(); // node horizontal line
      context.fillText(nd.slice(0, 6), -10, yC); // node label
    });

    // 2) Draw P2P message arrows
    // Build a Set of selected message types for fast filtering
    const selectedMsgTypes = new Set(
      p2pEvents.filter((event) => selectedEvents.includes(event.label)).map((event) => event.type)
    );

    // console.log(selectedMsgTypes);
    // console.log(arrowDataRef.current);
    const arrowArr = arrowDataRef.current.filter((ar) => {
      if (!selectedMsgTypes.has(ar.type)) return false;
      // Only render arrows that are at least partially within viewport time range
      return ar.sendTime <= d1 && ar.recvTime >= d0;
    });

    arrowArr.forEach((ar) => {
      const isHighlight = highlightObj === ar;
      // Check if this arrow matches the event selected in the table (object/field equality)
      const matchingCanvasEvent =
        selectedTableEvent &&
        data.find(
          (event) =>
            event === selectedTableEvent ||
            (event.type === selectedTableEvent.type &&
              event.timestamp.getTime() === selectedTableEvent.timestamp.getTime() &&
              event.nodeId === selectedTableEvent.nodeId)
        );
      const isSelectedFromTable =
        matchingCanvasEvent &&
        matchingCanvasEvent.type === ar.type &&
        Math.abs(matchingCanvasEvent.timestamp.getTime() - ar.timestamp.getTime()) < 50;

      let arrowColor = "#65AFFF"; // default color
      const matchedEvent = p2pEvents.find((event) => event.type === ar.type);
      if (matchedEvent) {
        arrowColor = matchedEvent.color;
      }
      if (isHighlight) arrowColor = "#ff9800"; // highlight on hover
      if (isSelectedFromTable) arrowColor = "#00ff00"; // highlight when selected in table

      const x1 = xScale(ar.sendTime);
      const x2 = xScale(ar.recvTime);
      const y1 = yScale(ar.fromNode)! + yScale.bandwidth() / 2;
      const y2 = yScale(ar.toNode)! + yScale.bandwidth() / 2;

      // Gradient stroke from head (opaque) to tail (transparent)
      const gradient = context.createLinearGradient(x2, y2, x1, y1);
      gradient.addColorStop(0, arrowColor);
      gradient.addColorStop(1, arrowColor + "00");

      context.strokeStyle = gradient;
      context.fillStyle = arrowColor;
      context.lineWidth = 2;

      // Arrow line
      context.beginPath();
      context.moveTo(x1, y1);
      context.lineTo(x2, y2);
      context.stroke();

      // Arrow head
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len >= 1) {
        const arrowSize = 4; // head size
        const angle = Math.PI / 3; // head angle
        const bx = x2 - (dx / len) * arrowSize;
        const by = y2 - (dy / len) * arrowSize;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const leftX = bx + (-(dx / len) * cos + -(dy / len) * sin) * arrowSize;
        const leftY = by + ((dx / len) * sin + -(dy / len) * cos) * arrowSize;
        const rightX = bx + (-(dx / len) * cos - -(dy / len) * sin) * arrowSize;
        const rightY = by + (-(dx / len) * sin - (dy / len) * cos) * arrowSize;
        context.beginPath();
        context.moveTo(x2, y2);
        context.lineTo(leftX, leftY);
        context.lineTo(rightX, rightY);
        context.closePath();
        context.fill();
      }
    });

    // 3) Draw state change points
    scArr.forEach((pt) => {
      const isHighlight = highlightObj === pt;
      // Check if this point matches the event selected in the table
      const matchingCanvasEvent =
        selectedTableEvent &&
        data.find(
          (event) =>
            event === selectedTableEvent ||
            (event.type === selectedTableEvent.type &&
              event.timestamp.getTime() === selectedTableEvent.timestamp.getTime() &&
              event.nodeId === selectedTableEvent.nodeId)
        );
      const isSelectedFromTable =
        matchingCanvasEvent &&
        matchingCanvasEvent.type === pt.type &&
        Math.abs(matchingCanvasEvent.timestamp.getTime() - pt.timestamp.getTime()) < 50 &&
        matchingCanvasEvent.nodeId === pt.node;

      const current = pt.type ?? "";

      let color = "#cf6679"; // default color

      color = stepColorMap[current] || "#000000"; // step color mapping

      if (isHighlight) color = "#ff9800"; // hover
      if (isSelectedFromTable) color = "#00ff00"; // selected

      const cx = xScale(pt.timestamp);
      const cy = yScale(pt.node)! + yScale.bandwidth() / 2;

      // Render Saturn-like marker when proposeStep && isOurTurn, otherwise a regular dot
      if (pt.type === "proposeStep" && pt.isOurTurn) {
        // Saturn-style: outer ring
        context.beginPath();
        context.arc(cx, cy, 6, 0, 2 * Math.PI);
        context.strokeStyle = color;
        context.lineWidth = 1.5; // ring thickness
        context.stroke();

        // Inner dot
        context.beginPath();
        context.arc(cx, cy, 2.5, 0, 2 * Math.PI);
        context.fillStyle = color;
        context.fill();
      } else {
        // Regular dot
        context.beginPath();
        context.arc(cx, cy, 6, 0, 2 * Math.PI);
        context.fillStyle = color;
        context.fill();
      }
    });

    // 4) Draw brushing region
    if (isBrushing && brushStart !== null && brushEnd !== null) {
      const xMin = Math.min(brushStart, brushEnd);
      const xMax = Math.max(brushStart, brushEnd);
      context.save();
      context.fillStyle = "rgba(100, 100, 255, 0.3)"; // semi-transparent blue
      context.fillRect(xMin, 0, xMax - xMin, innerHeight);
      context.restore();
    }
  };

  /**
   * @function handleMouseMove
   * @description Mouse move handler: tooltip and brushing updates
   */
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - margin.left;
    const mouseY = e.clientY - rect.top - margin.top;

    // Update brush end and redraw while brushing
    if (isBrushing) {
      setBrushEnd(mouseX);
      drawAll(null);
      return;
    }

    const xScale = xScaleRef.current;
    const yScale = yScaleRef.current;
    if (!xScale || !yScale) return;

    // Hit detection: find nearest arrow/point to the cursor
    let found: CanvasArrowData | StateChangePoint | null = null;
    let minDist = 10; // only detect within 10px

    // Distance to arrows
    const selectedMsgTypes = new Set(
      p2pEvents.filter((event) => selectedEvents.includes(event.label)).map((event) => event.type)
    );
    const [d0, d1] = xScale.domain();
    const arrs = arrowDataRef.current.filter((ar) => {
      if (!selectedMsgTypes.has(ar.type)) return false;
      // Only consider arrows that are at least partially within viewport time range
      return ar.sendTime <= d1 && ar.recvTime >= d0;
    });

    for (const ar of arrs) {
      const x1 = xScale(ar.sendTime);
      const x2 = xScale(ar.recvTime);
      const y1 = yScale(ar.fromNode)! + yScale.bandwidth() / 2;
      const y2 = yScale(ar.toNode)! + yScale.bandwidth() / 2;
      // Shortest distance from point to segment
      const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
      let t = ((mouseX - x1) * (x2 - x1) + (mouseY - y1) * (y2 - y1)) / l2;
      t = Math.max(0, Math.min(1, t));
      const cx = x1 + t * (x2 - x1);
      const cy = y1 + t * (y2 - y1);
      const dist = Math.sqrt((mouseX - cx) ** 2 + (mouseY - cy) ** 2);
      if (dist < minDist) {
        minDist = dist;
        found = ar;
      }
    }

    // Distance to points
    if (!found) {
      const scArr = pointDataRef.current.filter((pt) => {
        if (!selectedSteps.includes(pt.type || "")) return false;
        const tsMs = pt.timestamp instanceof Date ? pt.timestamp.getTime() : Number(pt.timestamp);
        return tsMs >= d0 && tsMs <= d1;
      });

      for (const sc of scArr) {
        const dx = mouseX - xScale(sc.timestamp);
        const dy = mouseY - (yScale(sc.node)! + yScale.bandwidth() / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          found = sc;
        }
      }
    }

    // Tooltip handling (fixed position)
    if (found) {
      setTooltip({ content: found, position: { x: 0, y: 0 } }); // fixed position; coordinates not used
      drawAll(found); // redraw with highlight
    } else {
      setTooltip(null);
      drawAll(null);
    }
  };

  /**
   * @function handleMouseLeave
   * @description Hide tooltip and cancel brushing when leaving the canvas
   */
  const handleMouseLeave = (): void => {
    setTooltip(null);
    if (isBrushing) {
      setIsBrushing(false);
      setBrushStart(null);
      setBrushEnd(null);
    }
    drawAll(null);
  };

  /**
   * @function handleMouseDown
   * @description Start brushing on mousedown
   */
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - margin.left;
    setIsBrushing(true);
    setBrushStart(mouseX);
    setBrushEnd(mouseX);
  };

  /**
   * @function handleMouseUp
   * @description End brushing on mouseup and emit selected range
   */
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    if (!isBrushing) return;
    setIsBrushing(false);

    if (brushStart !== null && brushEnd !== null && brushStart !== brushEnd) {
      const xScale = xScaleRef.current;
      if (!xScale) return;
      const pixelMin = Math.min(brushStart, brushEnd);
      const pixelMax = Math.max(brushStart, brushEnd);
      // Convert pixel coordinates back to time using scale.invert
      const tMin = xScale.invert(pixelMin);
      const tMax = xScale.invert(pixelMax);

      // Notify parent of selected time range
      if (onBrushSelect) {
        onBrushSelect(Math.floor(tMin), Math.floor(tMax));
      }
    } else if (brushStart !== null && brushEnd !== null && Math.abs(brushStart - brushEnd) < 5) {
      // Treat as click when drag distance is ≤ 5px
      handleCanvasClick(e);
    }

    // Reset brushing state
    setBrushStart(null);
    setBrushEnd(null);
    drawAll(null);
  };

  /**
   * @function handleCanvasClick
   * @description Canvas click handler - find nearest event and notify parent
   */
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    if (!canvasRef.current || !onEventClick) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - margin.left;
    const mouseY = e.clientY - rect.top - margin.top;

    const xScale = xScaleRef.current;
    const yScale = yScaleRef.current;
    if (!xScale || !yScale) return;

    // Nearest event hit detection
    let foundEvent: CanvasEvent | null = null;
    let minDist = 10; // only detect within 10px

    // Check step events first
    const selectedStepTypes = new Set(selectedSteps);
    const [d0, d1] = xScale.domain();

    const stepEvents = pointDataRef.current.filter((step) => {
      if (!selectedStepTypes.has(step.type)) return false;
      const stepTime = step.timestamp.getTime();
      return stepTime >= d0 && stepTime <= d1;
    });

    for (const step of stepEvents) {
      const x = xScale(step.timestamp.getTime());
      const y = yScale(step.node)! + yScale.bandwidth() / 2;
      const dist = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);
      if (dist < minDist) {
        minDist = dist;
        // convert step to CanvasEvent shape
        const matchingCanvasEvent = data.find(
          (event) =>
            event.type === step.type &&
            Math.abs(event.timestamp.getTime() - step.timestamp.getTime()) < 1000 &&
            event.nodeId === step.node
        );
        if (matchingCanvasEvent) {
          foundEvent = matchingCanvasEvent;
        }
      }
    }

    // Check arrow events as well
    const selectedMsgTypes = new Set(
      p2pEvents.filter((event) => selectedEvents.includes(event.label)).map((event) => event.type)
    );

    const arrowEvents = arrowDataRef.current.filter((ar) => {
      if (!selectedMsgTypes.has(ar.type)) return false;
      return ar.sendTime <= d1 && ar.recvTime >= d0;
    });

    for (const ar of arrowEvents) {
      const x1 = xScale(ar.sendTime);
      const x2 = xScale(ar.recvTime);
      const y1 = yScale(ar.fromNode)! + yScale.bandwidth() / 2;
      const y2 = yScale(ar.toNode)! + yScale.bandwidth() / 2;

      // shortest distance from point to segment
      const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
      let t = ((mouseX - x1) * (x2 - x1) + (mouseY - y1) * (y2 - y1)) / l2;
      t = Math.max(0, Math.min(1, t));
      const cx = x1 + t * (x2 - x1);
      const cy = y1 + t * (y2 - y1);
      const dist = Math.sqrt((mouseX - cx) ** 2 + (mouseY - cy) ** 2);

      if (dist < minDist) {
        minDist = dist;
        // convert arrow to CanvasEvent shape
        const matchingCanvasEvent = data.find(
          (event) => event.type === ar.type && Math.abs(event.timestamp.getTime() - ar.timestamp.getTime()) < 1000
        );
        if (matchingCanvasEvent) {
          foundEvent = matchingCanvasEvent;
        }
      }
    }

    // notify parent if an event is found
    if (foundEvent) {
      onEventClick(foundEvent);
    }
  };

  /**
   * @function onResize
   * @description Resize handler: reset canvas size and update scales
   */
  const onResize = useCallback(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl || !data || data.length === 0) return;

    const context = canvasEl.getContext("2d");
    if (!context) return;
    contextRef.current = context;

    // Set canvas size (consider DPR)
    const { width, height } = canvasEl.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvasEl.width = width * dpr;
    canvasEl.height = height * dpr;
    context.scale(dpr, dpr); // adjust context scale

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // X scale (time) - go tool trace style viewport
    let xMin, xMax;
    if (viewportStart !== undefined && viewportEnd !== undefined) {
      // Use viewport range for go tool trace style
      xMin = viewportStart;
      xMax = viewportEnd;
    } else {
      // Fallback to data range
      const minTime = d3.min(data, (d) => new Date(d.timestamp).getTime()) ?? 0;
      const maxTime = d3.max(data, (d) => new Date(d.timestamp).getTime()) ?? 0;
      const domainPadding = 5;
      xMin = minTime - domainPadding;
      xMax = maxTime + domainPadding;
    }

    const xScale = d3.scaleLinear().domain([xMin, xMax]).range([0, innerWidth]);
    xScaleRef.current = xScale;

    // Y scale (nodes)
    const nodeSet = new Set<string>();
    data.forEach((d) => {
      if (d.nodeId) nodeSet.add(d.nodeId);
      if ((d as any).senderPeerId) nodeSet.add((d as any).senderPeerId as string);
      if ((d as any).recipientPeerId) nodeSet.add((d as any).recipientPeerId as string);
      const asAny = d as any;
      const sourcePeer = asAny.sourcePeer as string | undefined;
      const recipientPeer = asAny.recipientPeer as string | undefined;
      if (sourcePeer) nodeSet.add(sourcePeer.includes("@") ? sourcePeer.split("@")[0] : sourcePeer);
      if (recipientPeer) nodeSet.add(recipientPeer.includes("@") ? recipientPeer.split("@")[0] : recipientPeer);
    });
    const nodes = Array.from(nodeSet).sort(); // stable ordering
    const yScale = d3.scaleBand<string>().domain(nodes).range([0, innerHeight]).padding(0.3);
    yScaleRef.current = yScale;

    drawAll(null); // redraw everything
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, margin]); // recompute only when data/margin changes

  // Register/unregister resize listener
  useEffect(() => {
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [onResize]);

  // Redraw when data, filters, or viewport changes
  useEffect(() => {
    if (!data || data.length === 0) return;
    const animationFrameId = requestAnimationFrame(() => {
      onResize(); // re-evaluate scales as needed
      drawAll(null);
    });
    return () => cancelAnimationFrame(animationFrameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, onResize, selectedEvents, selectedSteps, selectedTableEvent, viewportStart, viewportEnd, zoomLevel]);

  /**
   * @effect
   * @description When `data` changes, preprocess into `arrows` and `points` and store in refs
   */
  useEffect(() => {
    if (!data || data.length === 0) return;

    // 1) Split by event category
    // Some backends use canonical types (e.g., "vote", "block_part") while others use
    // umbrella types ("p2pVote", "p2pBlockPart"). Detect P2P events by presence of
    // sender/receiver and timing fields rather than relying only on type string.
    const isP2PEvent = (d: CanvasEvent) =>
      !!(d.senderPeerId && d.nodeId && d.sentTime && d.receivedTime && (d.vote || d.part));

    const p2pEventData = data.filter((d) => (d.type === "p2pVote" || d.type === "p2pBlockPart") || isP2PEvent(d));
    const stateChanges = data.filter((d) => !p2pEventData.includes(d));

    // 2) Build arrows from both single-record P2P and send/receive pairs
    const arrows: CanvasArrowData[] = [];

    // 2-a) Single-record P2P with both send/receive (p2pVote / p2pBlockPart)
    p2pEventData.forEach((e) => {
      // Extract sender/receiver/timing directly; skip if any required field is missing
      if (!e.senderPeerId || !e.nodeId || !e.sentTime || !e.receivedTime) {
        return; // handled by pair-matching in 2-b
      }

      let height: number | undefined;
      let msgType: string | undefined = e.type;
      let vote: CoreVote | undefined;
      let part: CorePart | undefined;

      // Determine message type and height from event content
      if ((e.type === "p2pVote" || e.vote) && e.vote) {
        msgType = e.vote.type; // "prevote" | "precommit"
        height = e.vote.height;
        vote = e.vote;
      } else if ((e.type === "p2pBlockPart" || e.part) && e.part) {
        msgType = "blockPart"; // matches StepLegend p2pEvents
        height = e.height;
        part = e.part;
      }

      // Push arrow only when data is valid
      if (msgType && height !== undefined) {
        arrows.push({
          canvasType: "arrow",
          type: msgType, // normalized message type
          fromNode: e.senderPeerId,
          toNode: e.nodeId,
          height: height,
          sendTime: new Date(e.sentTime).getTime(),
          recvTime: new Date(e.receivedTime).getTime(),
          latency: e.latency,
          timestamp: e.timestamp,
          vote: vote,
          part: part,
        });
      }
    });

    // 2-b) Match send/receive pairs to construct arrows (sendVote/receiveVote, block parts)
    const voteSends = data.filter((d) => d.type === "sendVote" && d.vote);
    const voteReceives = data.filter((d) => d.type === "receiveVote" && d.vote);

    type VoteKey = string;
    const makePeerId = (v: CanvasEvent): string | undefined => {
      const asAny = v as any;
      // normalize various field names
      const from = asAny.senderPeerId || asAny.sourcePeerId || asAny.sourcePeer;
      if (typeof from === "string") return from.includes("@") ? from.split("@")[0] : from;
      return undefined;
    };
    const makeRecipientId = (v: CanvasEvent): string | undefined => {
      const asAny = v as any;
      const to = asAny.recipientPeerId || asAny.recipientPeer;
      if (typeof to === "string") return to.includes("@") ? to.split("@")[0] : to;
      return undefined;
    };
    const voteKey = (from: string | undefined, to: string | undefined, v: CanvasEvent): VoteKey | undefined => {
      if (!v.vote) return undefined;
      const { type, height, round, blockId } = v.vote;
      if (!from || !to || !type || height === undefined || round === undefined || !blockId?.hash) return undefined;
      return [from, to, type, height, round, blockId.hash].join("|");
    };

    const receiveIndex = new Map<VoteKey, CanvasEvent[]>();
    voteReceives.forEach((r) => {
      const from = makePeerId(r) || (r as any).senderPeerId || "";
      const to = r.nodeId;
      const key = voteKey(from, to, r);
      if (key) {
        if (!receiveIndex.has(key)) receiveIndex.set(key, []);
        receiveIndex.get(key)!.push(r);
      }
    });
    // Sort receives by time to pick the earliest after send
    receiveIndex.forEach((arr) => arr.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()));

    voteSends.forEach((s) => {
      const from = s.nodeId;
      const to = makeRecipientId(s);
      const key = voteKey(from, to, s);
      if (!key) return;
      const candidates = receiveIndex.get(key) || [];
      const sendTime = s.timestamp.getTime();
      const recv = candidates.find((r) => r.timestamp.getTime() >= sendTime);
      if (!recv) return;

      arrows.push({
        canvasType: "arrow",
        type: s.vote!.type, // prevote | precommit
        fromNode: from!,
        toNode: to!,
        height: s.vote!.height,
        sendTime,
        recvTime: recv.timestamp.getTime(),
        latency: recv.timestamp.getTime() - sendTime,
        timestamp: s.timestamp,
        vote: s.vote,
      });
    });

    // Block part send/receive matching
    const partSends = data.filter((d) => (d as any).part && (d.type === "sendBlockPart" || (d as any).recipientPeerId || (d as any).recipientPeer));
    const partReceives = data.filter((d) => (d as any).part && (d.type === "receiveBlockPart" || (d as any).senderPeerId || (d as any).sourcePeerId));

    type PartKey = string;
    const partKey = (from: string | undefined, to: string | undefined, v: CanvasEvent): PartKey | undefined => {
      const p: any = (v as any).part;
      const h = (v.height ?? (v as any).height) as number | undefined;
      const idx: number | undefined = p?.index ?? p?.proof?.index;
      if (!from || !to || h === undefined || idx === undefined) return undefined;
      return [from, to, h, idx].join("|");
    };

    const partReceiveIndex = new Map<PartKey, CanvasEvent[]>();
    partReceives.forEach((r) => {
      const from = makePeerId(r) || (r as any).senderPeerId || "";
      const to = r.nodeId;
      const key = partKey(from, to, r);
      if (key) {
        if (!partReceiveIndex.has(key)) partReceiveIndex.set(key, []);
        partReceiveIndex.get(key)!.push(r);
      }
    });
    partReceiveIndex.forEach((arr) => arr.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()));

    partSends.forEach((s) => {
      const from = s.nodeId;
      const to = makeRecipientId(s);
      const key = partKey(from, to, s);
      if (!key) return;
      const candidates = partReceiveIndex.get(key) || [];
      const sendTime = s.timestamp.getTime();
      const recv = candidates.find((r) => r.timestamp.getTime() >= sendTime);
      if (!recv) return;

      const part: any = (s as any).part;
      const h = (s.height ?? (s as any).height) as number | undefined;

      arrows.push({
        canvasType: "arrow",
        type: "blockPart",
        fromNode: from!,
        toNode: to!,
        height: h,
        sendTime,
        recvTime: recv.timestamp.getTime(),
        latency: recv.timestamp.getTime() - sendTime,
        timestamp: s.timestamp,
        part,
      });
    });

    const points: StateChangePoint[] = [];
    stateChanges.forEach((e) => {
      points.push({
        canvasType: "step",
        type: e.type,
        timestamp: e.timestamp,
        height: e.height,
        node: e.nodeId,
        round: e.round,
        isOurTurn: e.isOurTurn,
        duration: e.duration,

        proposal: e.proposal,
        proposer: e.proposer,
        currentHeight: e.currentHeight,
        currentRound: e.currentRound,
        currentStep: e.currentStep,
        step: e.step,
        nextStep: e.nextStep,
        nextHeight: e.nextHeight,
        hash: e.hash,
      });
    });

    // Save processed data into refs
    arrowDataRef.current = arrows;
    pointDataRef.current = points;
  }, [data]);

  // JSX render
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#2E364D",
          display: "block",
          borderRadius: "8px",
        }}
        // Mouse event handlers
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      />
      {tooltip?.content && (
        <div
          className="absolute top-2 right-2 p-3 text-sm font-mono text-gray-200 bg-gray-800/95 border border-gray-600 rounded-lg shadow-lg pointer-events-none"
          style={{ zIndex: 1000, minWidth: "280px" }}
        >
          <div className="grid grid-cols-[120px,1fr] gap-x-3 gap-y-2 items-center">
            {tooltip.content.canvasType === "step" ? (
              <>
                <div className="col-span-2 pb-1 mb-2 font-bold text-sky-400 border-b border-gray-600">
                  {tooltip.content.type}
                </div>
                <div className="font-medium text-gray-400">Node</div>
                <div title={tooltip.content.node}>{tooltip.content.node}</div>
                <div className="font-medium text-gray-400">Time</div>
                <div>{new Date(tooltip.content.timestamp).toLocaleTimeString()}</div>
                <div className="font-medium text-gray-400">Timestamp</div>
                <div>{new Date(tooltip.content.timestamp).toISOString().substr(11, 12)}</div>
                <div className="font-medium text-gray-400">Height</div>
                <div>{tooltip.content.height}</div>
                <div className="font-medium text-gray-400">Round</div>
                <div>{tooltip.content.round}</div>
                {tooltip.content.isOurTurn !== undefined && (
                  <>
                    <div className="font-medium text-gray-400">Our Turn</div>
                    <div>{tooltip.content.isOurTurn ? "Yes" : "No"}</div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="col-span-2 pb-1 mb-2 font-bold text-sky-400 border-b border-gray-600">
                  {tooltip.content.type}
                </div>
                <div className="font-medium text-gray-400">From</div>
                <div title={tooltip.content.fromNode}>{tooltip.content.fromNode}</div>
                <div className="font-medium text-gray-400">To</div>
                <div title={tooltip.content.toNode}>{tooltip.content.toNode}</div>
                <div className="font-medium text-gray-400">Send Time</div>
                <div>{new Date(tooltip.content.sendTime).toISOString().substr(11, 12)}</div>
                <div className="font-medium text-gray-400">Recv Time</div>
                <div>{new Date(tooltip.content.recvTime).toISOString().substr(11, 12)}</div>
                <div className="font-medium text-gray-400">Latency</div>
                <div>{((tooltip.content.latency ?? 0) / 1000000).toFixed(2)}ms</div>
                <div className="font-medium text-gray-400">Height</div>
                <div>{tooltip.content.height}</div>
                <div className="font-medium text-gray-400">Timestamp</div>
                <div>{new Date(tooltip.content.timestamp).toISOString().substr(11, 12)}</div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default GraphCanvas;
