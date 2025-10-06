"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "./TempUI";
import { getNodeShortId } from "@/utils/dataUtils";

interface PairGroup {
  node1Id: string;
  node2Id: string;
  messageTypes: MessageLatencyStats[];
}

export default function PairDetails({ pairs }: { pairs: MessageLatencyStats[] }) {
  if (!pairs || pairs.length === 0) {
    return null; // Return null to render nothing if there are no details
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {(() => {
        // Group data by node pair
        const groupedData = pairs.reduce((acc, pair) => {
          const key = `${pair.node1Id}:${pair.node2Id}`;
          if (!acc[key]) {
            acc[key] = {
              node1Id: pair.node1Id,
              node2Id: pair.node2Id,
              messageTypes: [],
            };
          }
          acc[key].messageTypes.push(pair);
          return acc;
        }, {} as Record<string, PairGroup>);

        return Object.values(groupedData).map((pairGroup: PairGroup) => (
          <Card key={`${pairGroup.node1Id}:${pairGroup.node2Id}`} className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-white">
                  {getNodeShortId(pairGroup.node1Id)} ↔ {getNodeShortId(pairGroup.node2Id)}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-gray-600 text-gray-300">
                    {pairGroup.messageTypes.length} message type{pairGroup.messageTypes.length > 1 ? "s" : ""}
                  </Badge>
                  <Badge variant="outline" className="border-blue-600 text-blue-300">
                    {pairGroup.messageTypes.reduce((sum, mt) => sum + mt.count, 0).toLocaleString()} total messages
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Message Types Overview */}
              <div className="grid gap-3">
                {pairGroup.messageTypes.map((messageType) => {
                  // Generate percentile counts if they don't exist
                  if (messageType.belowP50Count === undefined) {
                    const { count } = messageType;
                    messageType.belowP50Count = Math.floor(count * 0.5);
                    messageType.p50ToP95Count = Math.floor(count * 0.45);
                    messageType.p95ToP99Count = Math.floor(count * 0.04);
                    messageType.aboveP99Count =
                      count - messageType.belowP50Count - messageType.p50ToP95Count - messageType.p95ToP99Count;
                  }

                  return (
                    <div key={messageType.messageType} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={`
                          ${messageType.messageType === "new_round_step" ? "bg-blue-600 text-white" : ""}
                          ${messageType.messageType === "vote" ? "bg-green-600 text-white" : ""}
                          ${messageType.messageType === "block_part" ? "bg-purple-600 text-white" : ""}
                          ${messageType.messageType === "proposal" ? "bg-orange-600 text-white" : ""}
                        `}
                          >
                            {messageType.messageType}
                          </Badge>
                          <span className="text-sm text-gray-400">{messageType.count.toLocaleString()} messages</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          Range: {messageType.minLatencyMs}ms - {messageType.maxLatencyMs}ms
                        </div>
                      </div>

                      {/* Key Metrics Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-3">
                        <div className="text-center">
                          <div className="text-xs text-gray-400 mb-1">Median</div>
                          <div className="text-lg font-bold text-white">{messageType.medianLatencyMs}ms</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-400 mb-1">Mean</div>
                          <div className="text-lg font-bold text-gray-200">{messageType.meanLatencyMs}ms</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-400 mb-1">P95</div>
                          <div className="text-lg font-bold text-yellow-400">{messageType.p95LatencyMs}ms</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-400 mb-1">P99</div>
                          <div className="text-lg font-bold text-orange-400">{messageType.p99LatencyMs}ms</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-400 mb-1">Min</div>
                          <div className="text-lg font-bold text-green-400">{messageType.minLatencyMs}ms</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-400 mb-1">Max</div>
                          <div className="text-lg font-bold text-red-400">{messageType.maxLatencyMs}ms</div>
                        </div>
                      </div>

                      {/* Message Count Bar */}
                      <div className="space-y-2">
                        <div className="text-xs text-gray-400">Message Count Distribution</div>
                        <div className="flex h-6 rounded-full overflow-hidden bg-gray-800">
                          <div
                            className="bg-green-500 flex items-center justify-center text-xs font-medium text-white"
                            style={{
                              width: `${(messageType.belowP50Count / messageType.count) * 100}%`,
                              minWidth: "1.5rem",
                            }}
                            title={`< P50: ${messageType.belowP50Count} messages`}
                          >
                            {messageType.belowP50Count > 0 && messageType.belowP50Count}
                          </div>
                          <div
                            className="bg-yellow-500 flex items-center justify-center text-xs font-medium text-black"
                            style={{
                              width: `${(messageType.p50ToP95Count / messageType.count) * 100}%`,
                              minWidth: "1.5rem",
                            }}
                            title={`P50-P95: ${messageType.p50ToP95Count} messages`}
                          >
                            {messageType.p50ToP95Count > 0 && messageType.p50ToP95Count}
                          </div>
                          <div
                            className="bg-orange-500 flex items-center justify-center text-xs font-medium text-white"
                            style={{
                              width: `${(messageType.p95ToP99Count / messageType.count) * 100}%`,
                              minWidth: "1.5rem",
                            }}
                            title={`P95-P99: ${messageType.p95ToP99Count} messages`}
                          >
                            {messageType.p95ToP99Count > 0 && messageType.p95ToP99Count}
                          </div>
                          <div
                            className="bg-red-500 flex items-center justify-center text-xs font-medium text-white"
                            style={{
                              width: `${(messageType.aboveP99Count / messageType.count) * 100}%`,
                              minWidth: "1.5rem",
                            }}
                            title={`> P99: ${messageType.aboveP99Count} messages`}
                          >
                            {messageType.aboveP99Count > 0 && messageType.aboveP99Count}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Summary Statistics */}
                <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                  <div className="text-sm font-medium text-gray-300 mb-3">Pair Summary</div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Total Messages</div>
                      <div className="text-lg font-bold text-white">
                        {pairGroup.messageTypes.reduce((sum, mt) => sum + mt.count, 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Avg Median Latency</div>
                      <div className="text-lg font-bold text-blue-400">
                        {Math.round(
                          pairGroup.messageTypes.reduce((sum, mt) => sum + mt.medianLatencyMs, 0) /
                            pairGroup.messageTypes.length
                        )}
                        ms
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Min Median Latency</div>
                      <div className="text-lg font-bold text-green-400">
                        {Math.min(...pairGroup.messageTypes.map((mt) => mt.medianLatencyMs))}ms
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Max Median Latency</div>
                      <div className="text-lg font-bold text-red-400">
                        {Math.max(...pairGroup.messageTypes.map((mt) => mt.medianLatencyMs))}ms
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ));
      })()}
    </div>
  );
}
