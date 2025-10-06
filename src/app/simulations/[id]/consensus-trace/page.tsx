"use client";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { RotateCw } from "lucide-react";
import "../../../globals.css";

import GraphCanvas from "@/components/ApiGraphCanvas";
import StepLegend, { p2pEvents, stepColorMap } from "@/components/ApiStepLegend";
import { EventLogViewer } from "@/components/EventLogViewer";
import { processApiEvents } from "@/utils/dataUtils";
import { apiService } from "@/services/api";

function AppContent(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const simulationId = params.id as string;

  const segmentParam = searchParams.get("segment");
  const cursorParam = searchParams.get("cursor");
  const modeParam = searchParams.get("mode"); // "overview" or "detail"

  const [allEvents, setAllEvents] = useState<CanvasEvent[]>([]);
  const [nodes, setNodes] = useState<string[]>([]);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [selectedSteps, setSelectedSteps] = useState<string[]>(["enteringCommitStep", "proposeStep"]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>(p2pEvents.map((e) => e.label));

  // Go tool trace style viewport: entire timeline is rendered, viewport controls what's visible
  const [viewportStart, setViewportStart] = useState<number>(0);
  const [viewportEnd, setViewportEnd] = useState<number>(10000); // 10 seconds initial view
  const [totalTimeRange, setTotalTimeRange] = useState<{ min: number; max: number }>({ min: 0, max: 100000 });
  const [zoomLevel, setZoomLevel] = useState<number>(1); // Controls event density/spacing
  const [blockMarkers, setBlockMarkers] = useState<Array<{ height: number; timestamp: number }>>([]);
  const [pagination, setPagination] = useState<{
    totalCount?: number;
    hasNext: boolean;
    hasPrevious: boolean;
    nextCursor?: string;
    previousCursor?: string;
  } | null>(null);
  const [isLargeDataset, setIsLargeDataset] = useState(false);

  const isLoadingSegment = false; // For future loading state when switching segments
  const [segments, setSegments] = useState<
    Array<{
      id: number;
      cursor?: string;
      timeRange: { start: string; end: string };
      blockRange: { start: number; end: number };
      eventCount: number;
      duration: number;
    }>
  >([]);
  const [isOverviewMode, setIsOverviewMode] = useState(false);
  const [currentSegmentId, setCurrentSegmentId] = useState<number>(1);
  const [totalSegments, setTotalSegments] = useState<number>(0);
  const [selectedCanvasEvent, setSelectedCanvasEvent] = useState<CanvasEvent | null>(null);
  const [selectedTableEvent, setSelectedTableEvent] = useState<CanvasEvent | null>(null);

  // Navigation functions for pre-rendered timeline
  const panLeft = () => {
    const currentRange = viewportEnd - viewportStart;
    const panAmount = currentRange * 0.1; // Pan by 10% of current viewport
    const newStart = viewportStart - panAmount;
    const newEnd = viewportEnd - panAmount;
    setViewportStart(newStart);
    setViewportEnd(newEnd);
  };

  const panRight = () => {
    const currentRange = viewportEnd - viewportStart;
    const panAmount = currentRange * 0.1;
    const newStart = viewportStart + panAmount;
    const newEnd = viewportEnd + panAmount;
    setViewportStart(newStart);
    setViewportEnd(newEnd);
  };

  // Widen timeline bar (zoom in - events more spread out)
  const widenTimeline = () => {
    setZoomLevel((prev) => Math.min(prev * 1.5, 10)); // Max 10x zoom
    const center = (viewportStart + viewportEnd) / 2;
    const currentRange = viewportEnd - viewportStart;
    const newRange = currentRange * 0.75; // Show less time when zooming in
    setViewportStart(center - newRange / 2);
    setViewportEnd(center + newRange / 2);
  };

  // Narrow timeline bar (zoom out - events more compressed)
  const narrowTimeline = () => {
    setZoomLevel((prev) => Math.max(prev * 0.75, 0.1)); // Min 0.1x zoom
    const center = (viewportStart + viewportEnd) / 2;
    const currentRange = viewportEnd - viewportStart;
    const newRange = Math.min(currentRange * 1.5, totalTimeRange.max - totalTimeRange.min);
    setViewportStart(center - newRange / 2);
    setViewportEnd(center + newRange / 2);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable) {
        return;
      }
      if (e.isComposing || e.key === "Process") return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      switch (e.code) {
        case "KeyA": // Pan left
          e.preventDefault();
          panLeft();
          break;
        case "KeyD": // Pan right
          e.preventDefault();
          panRight();
          break;
        case "KeyW": // Widen timeline (zoom in)
          e.preventDefault();
          widenTimeline();
          break;
        case "KeyS": // Narrow timeline (zoom out)
          e.preventDefault();
          narrowTimeline();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewportStart, viewportEnd, totalTimeRange, zoomLevel]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Determine if we should show overview or detail mode
        const shouldShowOverview = modeParam === "overview" || (!modeParam && !cursorParam && !segmentParam);

        // Filter out mock cursor values that would cause API errors
        const realCursor = cursorParam && !cursorParam.startsWith("segment_") ? cursorParam : undefined;
        // Parse segment parameter for segment-based pagination
        const segmentNumber = segmentParam ? parseInt(segmentParam, 10) : undefined;

        const data = await apiService.getSimulationConsensusEvents(simulationId, {
          limit: 10000,
          cursor: realCursor,
          segment: segmentNumber,
          includeTotalCount: true, // Request total count from backend
        });

        console.log("API response:", data);
        console.log("Pagination info:", data.pagination);

        // Fallback logic for totalCount - handle case when backend doesn't provide it
        let totalCount = data.pagination.totalCount;
        if (totalCount === null || totalCount === undefined) {
          // If we don't have totalCount, estimate based on current data and pagination
          if (data.data.length >= 10000 && data.pagination.hasNext) {
            totalCount = 50000; // Conservative estimate for large datasets
          } else {
            totalCount = data.data.length;
          }
        }

        // Consider dataset large if totalCount > 10000 OR if we got the max limit (10000) and there are more pages
        const isLarge = totalCount > 10000 || (data.data.length >= 10000 && data.pagination.hasNext);

        setIsLargeDataset(isLarge);
        setPagination(data.pagination);

        // If large dataset and no specific mode specified, show overview
        if (isLarge && shouldShowOverview && !segmentParam && !modeParam) {
          setIsOverviewMode(true);
          await generateSegmentOverview(totalCount);
          return;
        }

        // Otherwise show detail mode (especially if segmentParam or modeParam=detail is specified)
        setIsOverviewMode(false);

        // Set current segment ID from URL parameter
        if (segmentParam) {
          setCurrentSegmentId(parseInt(segmentParam, 10));
        }

        // Also generate segment overview for navigation even in detail mode
        if (isLarge) {
          await generateSegmentOverview(totalCount);
        }

        // Process the API data into the format expected by the canvas
        const { events, nodes: fetchedNodes } = processApiEvents(data.data);

        setAllEvents(events || []);
        setNodes(fetchedNodes || []);
        setSelectedNodes(fetchedNodes || []);

        console.log("Processed events:", events?.length || 0, "events");
        console.log("Processed nodes:", fetchedNodes);
        console.log("Dataset size:", totalCount, "Is large:", isLarge);
        console.log(
          "Current mode - isOverviewMode:",
          isOverviewMode,
          "totalSegments:",
          totalSegments,
          "currentSegmentId:",
          currentSegmentId
        );

        // Extract block markers from proposeStep isOurTurn events
        if (events && events.length > 0) {
          const markers = events
            .filter((e) => e.type === "proposeStep" && e.isOurTurn)
            .map((e) => ({
              height: e.height || e.currentHeight || 0,
              timestamp: new Date(e.timestamp).getTime(),
            }))
            .filter(
              (marker, index, arr) =>
                // Remove duplicates by height
                arr.findIndex((m) => m.height === marker.height) === index
            )
            .sort((a, b) => a.timestamp - b.timestamp);

          console.log("Block markers extracted:", markers);
          setBlockMarkers(markers);
        }

        // Set time range based on currently loaded data segment
        if (events && events.length > 0) {
          const minTime = Math.min(...events.map((e) => new Date(e.timestamp).getTime()));
          const maxTime = Math.max(...events.map((e) => new Date(e.timestamp).getTime()));

          console.log("=== Timeline Range Debug (Current Segment) ===");
          console.log("Loaded events:", events.length);
          console.log("Min timestamp:", new Date(minTime).toISOString());
          console.log("Max timestamp:", new Date(maxTime).toISOString());
          console.log("Segment duration:", ((maxTime - minTime) / 1000).toFixed(2), "seconds");

          setTotalTimeRange({ min: minTime, max: maxTime });

          // Set initial viewport to show first part of current segment
          // If segment is short, show the whole segment
          const segmentDuration = maxTime - minTime;
          let viewportStartTime, viewportEndTime;

          if (segmentDuration <= 30000) {
            // If segment is 30 seconds or less, show all
            viewportStartTime = minTime;
            viewportEndTime = maxTime;
          } else {
            // Show first 10 seconds of segment
            viewportStartTime = minTime;
            viewportEndTime = minTime + 10000; // 10 seconds
          }

          console.log("Initial viewport:");
          console.log("- Start:", new Date(viewportStartTime).toISOString());
          console.log("- End:", new Date(viewportEndTime).toISOString());
          console.log("- Duration:", ((viewportEndTime - viewportStartTime) / 1000).toFixed(2), "seconds");
          console.log(
            "- Viewport vs Total ratio:",
            (((viewportEndTime - viewportStartTime) / segmentDuration) * 100).toFixed(1) + "%"
          );

          setViewportStart(viewportStartTime);
          setViewportEnd(viewportEndTime);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulationId, modeParam, cursorParam, segmentParam]);

  // Filter events by viewport time range AND selected nodes
  const filteredData = useMemo(() => {
    if (!allEvents || allEvents.length === 0) return [];
    return allEvents.filter((e) => {
      // Node filtering
      const nodeIn = e.nodeId == null || selectedNodes.includes(e.nodeId);
      if (!nodeIn) return false;

      // Time range filtering based on viewport
      const eventTime = new Date(e.timestamp).getTime();
      return eventTime >= viewportStart && eventTime <= viewportEnd;
    });
  }, [allEvents, selectedNodes, viewportStart, viewportEnd]);

  function onBrushSelect(domainStart: number, domainEnd: number): void {
    // For go tool trace style, we might use this for selection but not filtering
    console.log("Selected range:", domainStart, domainEnd);
  }

  function clearAll() {
    setSelectedSteps([]);
    setSelectedEvents([]);
  }

  function resetFilter() {
    setSelectedSteps(Object.keys(stepColorMap));
    setSelectedEvents(p2pEvents.map((e) => e.label));
  }

  // Generate segment metadata for overview mode
  const generateSegmentOverview = async (totalCount: number) => {
    const segmentsPerPage = Math.ceil(totalCount / 10000);
    setTotalSegments(segmentsPerPage);

    const mockSegments = [];

    // Generate all segments based on total count
    for (let i = 0; i < segmentsPerPage; i++) {
      const remainingEvents = totalCount - i * 10000;
      const segmentEvents = Math.min(10000, remainingEvents);

      mockSegments.push({
        id: i + 1,
        cursor: i === 0 ? undefined : `segment_${i}`,
        timeRange: {
          start: new Date(Date.now() + i * 300000).toISOString(), // 5 minutes apart
          end: new Date(Date.now() + (i + 1) * 300000).toISOString(),
        },
        blockRange: {
          start: i * 100 + 1,
          end: (i + 1) * 100,
        },
        eventCount: segmentEvents,
        duration: 300, // 5 minutes in seconds
      });
    }

    setSegments(mockSegments);
    console.log(`Generated ${segmentsPerPage} segments for ${totalCount.toLocaleString()} events`);
    console.log("totalSegments set to:", segmentsPerPage);
    console.log("mockSegments:", mockSegments.slice(0, 3)); // Show first 3 segments
  };

  // Navigate to specific segment detail view
  const viewSegmentDetail = (segmentId: number) => {
    setCurrentSegmentId(segmentId);
    const params = new URLSearchParams();
    params.set("mode", "detail");
    params.set("segment", segmentId.toString());
    // Don't use cursor for now since we don't have real cursors from backend
    // if (cursor && cursor !== `segment_${segmentId - 1}`) params.set('cursor', cursor);

    router.push(`/simulations/${simulationId}/consensus-trace?${params.toString()}`);
  };

  // Go back to overview mode
  const goToOverview = () => {
    router.push(`/simulations/${simulationId}/consensus-trace?mode=overview`);
  };

  // Overview Mode Component
  const OverviewMode = () => (
    <div className="text-white px-6 py-6 font-sans">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">CometBFT Consensus Tracer</h1>
        <p className="text-gray-400">Overview Mode - Click on a segment to view detailed trace</p>
      </div>

      {/* Dataset Summary */}
      <div className="mb-8 p-4 bg-[#2E364D] rounded-lg border border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Dataset Summary</h2>
          <div className="text-sm text-gray-400">
            {pagination?.totalCount?.toLocaleString() || "Unknown"} total events
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{totalSegments}</div>
            <div className="text-gray-400">Segments</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{pagination?.totalCount?.toLocaleString() || "0"}</div>
            <div className="text-gray-400">Total Events</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{Math.round(totalSegments * 5)}m</div>
            <div className="text-gray-400">Est. Duration</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">10K</div>
            <div className="text-gray-400">Events per Segment</div>
          </div>
        </div>
      </div>

      {/* Segment Navigation Bar */}
      <div className="mb-8 p-4 bg-[#2E364D] rounded-lg border border-gray-600">
        <h3 className="text-lg font-semibold mb-3">Segments Overview</h3>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: totalSegments }, (_, i) => {
            const segmentId = i + 1;
            const segment = segments.find((s) => s.id === segmentId);
            const isActive = segmentId === currentSegmentId;

            return (
              <button
                key={segmentId}
                onClick={() => viewSegmentDetail(segmentId)}
                className={`px-3 py-2 rounded text-sm font-medium transition-all ${
                  isActive ? "bg-blue-500 text-white shadow-lg" : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                }`}
                title={
                  segment
                    ? `${segment.eventCount.toLocaleString()} events, Blocks ${segment.blockRange.start}-${
                        segment.blockRange.end
                      }`
                    : `Segment ${segmentId}`
                }
              >
                {segmentId}
              </button>
            );
          })}
        </div>
        <div className="mt-3 text-xs text-gray-400">
          Click on a segment number to view detailed trace • Blue = Currently active • Gray = Available segments
        </div>
      </div>

      {/* Segment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {segments.map((segment) => (
          <div
            key={segment.id}
            onClick={() => viewSegmentDetail(segment.id)}
            className="bg-[#2E364D] border border-gray-600 hover:border-blue-500 rounded-lg p-4 cursor-pointer transition-all hover:bg-[#3A4255] group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold text-blue-400">Segment {segment.id}</div>
              <div className="text-xs text-gray-400">{segment.eventCount.toLocaleString()} events</div>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <div className="text-gray-400">Time Range</div>
                <div className="font-mono text-xs">
                  {new Date(segment.timeRange.start).toISOString().substr(11, 8)} -
                  {new Date(segment.timeRange.end).toISOString().substr(11, 8)}
                </div>
              </div>

              <div>
                <div className="text-gray-400">Block Range</div>
                <div className="font-mono text-xs">
                  #{segment.blockRange.start} - #{segment.blockRange.end}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-400">Duration</div>
                  <div className="font-mono text-xs">
                    {Math.round(segment.duration / 60)}m {segment.duration % 60}s
                  </div>
                </div>
                <div className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">View →</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, (segment.eventCount / 10000) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return isOverviewMode ? (
    <OverviewMode />
  ) : (
    <div className="text-white px-6 py-6 font-sans">
      <div className="flex items-center gap-4 mb-6">
        {isLargeDataset && (
          <button
            onClick={goToOverview}
            className="flex items-center gap-2 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
          >
            ← Back to Overview
          </button>
        )}
        <div>
          <h1 className="text-3xl font-bold">CometBFT Consensus Tracer</h1>
          {segmentParam && <p className="text-gray-400">Segment {segmentParam} - Detailed View</p>}
        </div>
      </div>

      {/* Segment Navigation Bar for Detail View */}
      {totalSegments > 0 && (
        <div className="mb-6 p-4 bg-[#2E364D] border border-gray-600 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Segment Navigation</h3>
            <div className="text-sm text-gray-400">
              {pagination?.totalCount ? `${pagination.totalCount.toLocaleString()} total events` : "Loading..."}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {Array.from({ length: totalSegments }, (_, i) => {
              const segmentId = i + 1;
              const segment = segments.find((s) => s.id === segmentId);
              const isActive = segmentId === currentSegmentId;

              return (
                <button
                  key={segmentId}
                  onClick={() => viewSegmentDetail(segmentId)}
                  disabled={isLoadingSegment}
                  className={`px-3 py-2 rounded text-sm font-medium transition-all disabled:opacity-50 ${
                    isActive ? "bg-blue-500 text-white shadow-lg" : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                  }`}
                  title={
                    segment
                      ? `${segment.eventCount.toLocaleString()} events, Blocks ${segment.blockRange.start}-${
                          segment.blockRange.end
                        }`
                      : `Segment ${segmentId}`
                  }
                >
                  {segmentId}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400">
              Blue = Current segment • Click any number to jump to that segment
            </div>

            <div className="flex gap-2">
              {currentSegmentId > 1 && (
                <button
                  onClick={() => {
                    viewSegmentDetail(currentSegmentId - 1);
                  }}
                  disabled={isLoadingSegment}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded text-sm flex items-center gap-1"
                >
                  {isLoadingSegment ? (
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "←"
                  )}
                  Previous
                </button>
              )}
              {currentSegmentId < totalSegments && (
                <button
                  onClick={() => {
                    viewSegmentDetail(currentSegmentId + 1);
                  }}
                  disabled={isLoadingSegment}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded text-sm flex items-center gap-1"
                >
                  Next
                  {isLoadingSegment ? (
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "→"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Go Tool Trace Style Timeline Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white">Timeline Viewer</h2>
            <div className="text-sm text-gray-400">
              Zoom {zoomLevel.toFixed(1)}x • {filteredData.length} events rendered
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={panLeft}
              className="px-3 py-1 bg-[#2864FF] hover:bg-[#1E4ED8] text-white rounded text-sm"
              title="Pan Left (A)"
            >
              ← Pan (A)
            </button>
            <button
              onClick={panRight}
              className="px-3 py-1 bg-[#2864FF] hover:bg-[#1E4ED8] text-white rounded text-sm"
              title="Pan Right (D)"
            >
              Pan → (D)
            </button>
            <button
              onClick={widenTimeline}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
              title="Widen Timeline - Zoom In (W)"
            >
              Widen (W)
            </button>
            <button
              onClick={narrowTimeline}
              className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm"
              title="Narrow Timeline - Zoom Out (S)"
            >
              Narrow (S)
            </button>
          </div>
        </div>

        {/* Timeline Bar - Shows current visible window */}
        <div className="bg-[#1a1f2e] rounded-lg p-4 mb-4 border border-gray-600">
          <div className="mb-2">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Entire Timeline</span>
              <span>Viewport Window</span>
            </div>
          </div>

          {/* Main Timeline Bar */}
          <div className="relative h-8 bg-gray-800 rounded border overflow-hidden">
            {/* Full timeline background with tick marks */}
            <div className="absolute inset-0 flex items-center">
              {/* Tick marks for reference */}
              {[...Array(10)].map((_, i) => (
                <div key={i} className="absolute w-px h-6 bg-gray-600" style={{ left: `${i * 10}%` }} />
              ))}
            </div>

            {/* Current viewport window */}
            <div
              className="absolute top-0 h-full bg-[#2864FF] bg-opacity-60 border-2 border-[#2864FF] rounded flex items-center justify-center overflow-hidden"
              style={{
                left: `${((viewportStart - totalTimeRange.min) / (totalTimeRange.max - totalTimeRange.min)) * 100}%`,
                width: `${((viewportEnd - viewportStart) / (totalTimeRange.max - totalTimeRange.min)) * 100}%`,
              }}
            >
              <div className="text-white text-xs font-semibold opacity-90">
                {((viewportEnd - viewportStart) / 1000).toFixed(1)}s
              </div>
            </div>

            {/* Block height markers within viewport */}
            {blockMarkers
              .filter((marker) => marker.timestamp >= viewportStart && marker.timestamp <= viewportEnd)
              .map((marker, index) => {
                const position =
                  ((marker.timestamp - totalTimeRange.min) / (totalTimeRange.max - totalTimeRange.min)) * 100;
                return (
                  <div
                    key={`${marker.height}-${index}`}
                    className="absolute top-0 h-full flex flex-col items-center justify-center pointer-events-none"
                    style={{ left: `${position}%` }}
                  >
                    {/* Block marker line */}
                    <div className="w-px h-full bg-yellow-400 opacity-80" />
                    {/* Block height label */}
                    <div
                      className="absolute top-1 bg-yellow-400 text-black rounded font-bold"
                      style={{
                        transform: "translateX(-50%)",
                        fontSize: "8px",
                        padding: "1px 2px",
                        lineHeight: "1",
                      }}
                    >
                      {marker.height}
                    </div>
                  </div>
                );
              })}

            {/* All block markers (faded) */}
            {blockMarkers.map((marker, index) => {
              const position =
                ((marker.timestamp - totalTimeRange.min) / (totalTimeRange.max - totalTimeRange.min)) * 100;
              const isInViewport = marker.timestamp >= viewportStart && marker.timestamp <= viewportEnd;
              if (isInViewport) return null; // Already rendered above

              return (
                <div
                  key={`faded-${marker.height}-${index}`}
                  className="absolute top-0 h-full flex items-center justify-center pointer-events-none"
                  style={{ left: `${position}%` }}
                >
                  <div className="w-px h-full bg-gray-500 opacity-30" />
                </div>
              );
            })}

            {/* Viewport handles */}
            <div
              className="absolute top-0 w-1 h-full bg-[#2864FF] cursor-ew-resize"
              style={{
                left: `${((viewportStart - totalTimeRange.min) / (totalTimeRange.max - totalTimeRange.min)) * 100}%`,
              }}
            />
            <div
              className="absolute top-0 w-1 h-full bg-[#2864FF] cursor-ew-resize"
              style={{
                left: `${((viewportEnd - totalTimeRange.min) / (totalTimeRange.max - totalTimeRange.min)) * 100}%`,
              }}
            />
          </div>

          {/* Timeline labels */}
          <div className="flex justify-between mt-2 text-xs font-mono text-gray-400">
            <span>{new Date(totalTimeRange.min).toISOString().substr(11, 12)}</span>
            <span className="text-[#2864FF] font-semibold">
              Viewing: {new Date(viewportStart).toISOString().substr(11, 8)} -{" "}
              {new Date(viewportEnd).toISOString().substr(11, 8)}
            </span>
            <span>{new Date(totalTimeRange.max).toISOString().substr(11, 12)}</span>
          </div>
        </div>

        <div className="text-sm text-gray-400 text-center">
          <span className="font-semibold">Navigation:</span> A/D to pan • W to widen (zoom in) • S to narrow (zoom out)
          • WASD controls
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {nodes.map((node) => (
          <label key={node} className="inline-flex items-center">
            <input
              type="checkbox"
              name={node}
              checked={selectedNodes.includes(node)}
              onChange={(e) => {
                setSelectedNodes((prev) => (e.target.checked ? [...prev, node] : prev.filter((n) => n !== node)));
              }}
              className="form-checkbox text-blue-600"
            />
            <span className="ml-2">{node?.slice(0, 6) + "..."}</span>
          </label>
        ))}
      </div>

      <div className="relative flex w-full gap-[16px]">
        {/* Fixed-width Pre-rendered Timeline Viewer */}
        <div className="flex-1 border border-gray-600 rounded-lg overflow-hidden">
          <div className="w-full h-full relative bg-[#2E364D]">
            {/* Viewport Debug Info */}
            <div
              className="absolute top-2 left-2 text-xs  text-white bg-black bg-opacity-75 p-2 rounded"
              style={{ zIndex: 1000 }}
            >
              <div>📊 Total Events: {allEvents.length} (All Pre-rendered)</div>
              <div>
                👁️ Viewport: {new Date(viewportStart).toISOString().substr(11, 8)} -{" "}
                {new Date(viewportEnd).toISOString().substr(11, 8)}
              </div>
              <div>
                🔍 Zoom: {zoomLevel.toFixed(1)}x • Range: {((viewportEnd - viewportStart) / 1000).toFixed(2)}s
              </div>
              <div>⌨️ Navigation: A D W S</div>
            </div>

            {filteredData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-white text-center">
                <div>
                  <div className="text-2xl mb-2">📊</div>
                  <div>Pre-rendered Timeline Ready</div>
                  <div className="text-sm text-gray-400 mt-2">
                    {allEvents.length} events loaded
                    <br />
                    Use ← → to navigate, W/N to zoom
                    <br />
                    Select event types in the filter panel →
                  </div>
                </div>
              </div>
            ) : (
              <GraphCanvas
                data={filteredData}
                onBrushSelect={onBrushSelect}
                selectedSteps={selectedSteps}
                selectedEvents={selectedEvents}
                onEventClick={setSelectedCanvasEvent}
                selectedTableEvent={selectedTableEvent}
                viewportStart={viewportStart}
                viewportEnd={viewportEnd}
                zoomLevel={zoomLevel}
              />
            )}
          </div>
        </div>
        <div className="bg-[#2E364D] rounded-[8px] w-[310px] px-[14px] flex-shrink-0">
          <h1 className="font-[500] text-[24px] py-[8px]">Visualizer Filter</h1>
          <StepLegend
            selectedSteps={selectedSteps}
            setSelectedSteps={setSelectedSteps}
            selectedEvents={selectedEvents}
            setSelectedEvents={setSelectedEvents}
          />
          <div className="flex flex-col gap-2 mt-4 mb-4">
            <button
              onClick={resetFilter}
              className="rounded-full bg-[#2864FF] gap-1 font-[700] flex items-center justify-center h-10 hover:bg-[#1E4ED8] transition-colors"
            >
              <RotateCw className="inline w-5" />
              Reset Filter
            </button>
            <button
              onClick={clearAll}
              className="rounded-full bg-[#2864FF] font-[700] flex items-center justify-center h-10 hover:bg-[#1E4ED8] transition-colors"
            >
              Clear all
            </button>
          </div>
        </div>
      </div>
      <EventLogViewer
        events={filteredData}
        selectedSteps={selectedSteps}
        selectedEvents={selectedEvents}
        selectedCanvasEvent={selectedCanvasEvent}
        onTableEventSelect={setSelectedTableEvent}
      />
    </div>
  );
}

function App(): React.JSX.Element {
  return (
    <div className="w-full">
      <Suspense>
        <AppContent />
      </Suspense>
    </div>
  );
}

export default App;
