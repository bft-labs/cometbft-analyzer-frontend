"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from "./TempUI";
import { getLatencyColor, latencyColors } from "@/utils/colorUtils";
import { getNodeShortId } from "@/utils/dataUtils";

export default function LatencyHeatmap({ data }: { data: MessageLatencyStats[] }) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Node-to-Node Latency Heatmap</CardTitle>
          <CardDescription>
            Median latency (ms) between node pairs. Darker colors indicate higher latency.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96 text-gray-500">
            <p>No latency data to display.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const nodes = Array.from(new Set([...data.map((d) => d.node1Id), ...data.map((d) => d.node2Id)]));

  const heatmapData = nodes.map((node1) =>
    nodes.map((node2) => {
      if (node1 === node2) return { latency: 0, count: 0, isSelf: true };
      
      const pairs = data.filter(
        (d) => (d.node1Id === node1 && d.node2Id === node2) || (d.node1Id === node2 && d.node2Id === node1)
      );
      
      if (pairs.length === 0) {
        return { latency: 0, count: 0, isSelf: false };
      }
      
      const totalCount = pairs.reduce((sum, pair) => sum + pair.count, 0);
      const weightedLatency = pairs.reduce((sum, pair) => sum + pair.medianLatencyMs * pair.count, 0) / totalCount;
      
      return {
        latency: Math.round(weightedLatency),
        count: totalCount,
        isSelf: false,
      };
    })
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Node-to-Node Latency Heatmap</CardTitle>
        <CardDescription>
          Median latency (ms) between node pairs. Darker colors indicate higher latency.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <span className="font-medium">Nodes:</span>
              {nodes.map((node, i) => (
                <Badge key={node} variant="outline">
                  {i + 1}: {getNodeShortId(node)}
                </Badge>
              ))}
            </div>
          </div>

          {/* Heatmap */}
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Header with X-axis labels */}
              <div className="flex">
                <div className="w-24 h-12 flex items-center justify-center text-xs font-medium bg-gray-800 border border-gray-700">
                  <div className="text-center">
                    <div>From ↓</div>
                    <div>To →</div>
                  </div>
                </div>
                {nodes.map((node, i) => (
                  <div
                    key={`header-${i}`}
                    className="w-16 h-12 flex items-center justify-center text-xs font-medium bg-gray-800 border border-l-0 border-gray-700"
                  >
                    <div className="text-center">
                      <div className="font-bold">#{i + 1}</div>
                      <div className="text-[10px] text-gray-400">{getNodeShortId(node)}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Heatmap rows */}
              {heatmapData.map((row, i) => (
                <div key={`row-${i}`} className="flex">
                  {/* Y-axis label */}
                  <div className="w-24 h-16 flex items-center justify-center text-xs font-medium bg-gray-800 border border-t-0 border-gray-700">
                    <div className="text-center">
                      <div className="font-bold">#{i + 1}</div>
                      <div className="text-[10px] text-gray-400">{getNodeShortId(nodes[i])}</div>
                    </div>
                  </div>

                  {/* Data cells */}
                  {row.map((cell, j) => (
                    <div
                      key={`cell-${i}-${j}`}
                      className="w-16 h-16 flex flex-col items-center justify-center text-xs font-medium border border-l-0 border-t-0 border-gray-700 cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
                      style={{
                        backgroundColor: cell.isSelf
                          ? "#1F2937" // dark gray
                          : cell.latency === 0
                          ? "#374151" // medium gray
                          : getLatencyColor(cell.latency),
                        color: cell.isSelf
                          ? "#9CA3AF" // light gray
                          : cell.latency === 0
                          ? "#9CA3AF"
                          : cell.latency > 100
                          ? "white"
                          : "black",
                      }}
                      title={
                        cell.isSelf
                          ? `Same node: ${getNodeShortId(nodes[i])}`
                          : cell.latency === 0
                          ? `No data: ${getNodeShortId(nodes[i])} → ${getNodeShortId(nodes[j])}`
                          : `${getNodeShortId(nodes[i])} → ${getNodeShortId(nodes[j])}: ${cell.latency}ms (${
                              cell.count
                            } messages)`
                      }
                    >
                      {cell.isSelf ? (
                        <div className="text-gray-500">—</div>
                      ) : cell.latency === 0 ? (
                        <div className="text-gray-500 text-[10px]">No data</div>
                      ) : (
                        <>
                          <div className="font-bold">{cell.latency}ms</div>
                          <div className="text-[10px] opacity-75">{cell.count} msgs</div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Color legend */}
          <div className="flex items-center gap-4 text-xs flex-wrap">
            <span className="font-medium">Latency Scale:</span>
            {Object.entries(latencyColors).map(([label, color]) => (
              <div key={label} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded border border-gray-600" style={{ backgroundColor: color }} />
                <span className="capitalize">
                  {label === "excellent" && "≤10ms"}
                  {label === "good" && "≤30ms"}
                  {label === "fair" && "≤100ms"}
                  {label === "poor" && "≤500ms"}
                  {label === "critical" && ">500ms"}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-1 ml-4">
              <div className="w-3 h-3 rounded border border-gray-600 bg-gray-700" />
              <span>No data</span>
            </div>
          </div>

              {/* Instructions */}
              <div className="text-xs text-gray-400 bg-gray-800 p-3 rounded">
                <div className="font-medium mb-1 text-white">How to read this heatmap:</div>
                <ul className="space-y-1">
                  <li>
                    • <strong>Rows (From):</strong> Source node sending the message
                  </li>
                  <li>
                    • <strong>Columns (To):</strong> Destination node receiving the message
                  </li>
                  <li>
                    • <strong>Values:</strong> Median latency in milliseconds between node pairs
                  </li>
                  <li>
                    • <strong>Diagonal:</strong> Same node (no communication with itself)
                  </li>
                </ul>
              </div>
        </div>
      </CardContent>
    </Card>
  );
}
