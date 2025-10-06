"use client";

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./TempUI";
import { useState } from "react";
import { getNodeShortId } from "@/utils/dataUtils";

const Activity = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

interface RankingItem {
  label: string;
  median: number;
  p95: number;
  p99: number;
  count: number;
  successRate: number;
  messageTypes?: number;
  nodePairs?: number;
  connections?: number;
  trend: number;
}

export default function LatencyRankings({
  pairData,
  nodeStats,
}: {
  pairData: MessageLatencyStats[];
  nodeStats: NodeStats[];
}) {
  const [distributionView, setDistributionView] = useState("by-pair");

  const getNodeLabel = (nodeId: string) => {
    const node = nodeStats.find((n) => n.nodeId === nodeId);
    return node ? `${getNodeShortId(nodeId)}` : getNodeShortId(nodeId);
  };

  const getPairLabel = (node1Id: string, node2Id: string) => {
    return `${getNodeLabel(node1Id)} ↔ ${getNodeLabel(node2Id)}`;
  };

  const getNodePairRankings = (): RankingItem[] => {
    const pairGroups = pairData.reduce((acc, pair) => {
      const key = getPairLabel(pair.node1Id, pair.node2Id);
      if (!acc[key]) {
        acc[key] = { pairs: [], totalCount: 0 };
      }
      acc[key].pairs.push(pair);
      acc[key].totalCount += pair.count;
      return acc;
    }, {} as Record<string, { pairs: MessageLatencyStats[]; totalCount: number }>);

    return Object.entries(pairGroups)
      .map(([key, group]) => ({
        label: key,
        median: Math.round(group.pairs.reduce((sum, p) => sum + p.medianLatencyMs * p.count, 0) / group.totalCount),
        p95: Math.round(group.pairs.reduce((sum, p) => sum + p.p95LatencyMs * p.count, 0) / group.totalCount),
        p99: Math.round(group.pairs.reduce((sum, p) => sum + p.p99LatencyMs * p.count, 0) / group.totalCount),
        count: group.totalCount,
        successRate: Math.round(
          (group.pairs.reduce((sum, p) => sum + p.belowP50Count + p.p50ToP95Count, 0) / group.totalCount) * 100
        ),
        messageTypes: group.pairs.length,
        trend: Math.floor(Math.random() * 21) - 10, // Mock trend data
      }))
      .sort((a, b) => a.median - b.median);
  };

  const getMessageTypeRankings = (): RankingItem[] => {
    const typeGroups = pairData.reduce((acc, pair) => {
      if (!acc[pair.messageType]) {
        acc[pair.messageType] = { pairs: [], totalCount: 0 };
      }
      acc[pair.messageType].pairs.push(pair);
      acc[pair.messageType].totalCount += pair.count;
      return acc;
    }, {} as Record<string, { pairs: MessageLatencyStats[]; totalCount: number }>);

    return Object.entries(typeGroups)
      .map(([key, group]) => ({
        label: key,
        median: Math.round(group.pairs.reduce((sum, p) => sum + p.medianLatencyMs * p.count, 0) / group.totalCount),
        p95: Math.round(group.pairs.reduce((sum, p) => sum + p.p95LatencyMs * p.count, 0) / group.totalCount),
        p99: Math.round(group.pairs.reduce((sum, p) => sum + p.p99LatencyMs * p.count, 0) / group.totalCount),
        count: group.totalCount,
        successRate: Math.round(
          (group.pairs.reduce((sum, p) => sum + p.belowP50Count + p.p50ToP95Count, 0) / group.totalCount) * 100
        ),
        nodePairs: group.pairs.length,
        trend: Math.floor(Math.random() * 21) - 10, // Mock trend data
      }))
      .sort((a, b) => a.median - b.median);
  };

  const getNodeRankings = (): RankingItem[] => {
    return nodeStats
      .map((node) => {
        const nodeData = pairData.filter((pair) => pair.node1Id === node.nodeId || pair.node2Id === node.nodeId);
        const avgLatency =
          nodeData.length > 0
            ? Math.round(nodeData.reduce((sum, pair) => sum + pair.medianLatencyMs, 0) / nodeData.length)
            : 0;

        return {
          label: getNodeLabel(node.nodeId),
          median: avgLatency,
          p95:
            nodeData.length > 0
              ? Math.round(nodeData.reduce((sum, pair) => sum + pair.p95LatencyMs, 0) / nodeData.length)
              : 0,
          p99:
            nodeData.length > 0
              ? Math.round(nodeData.reduce((sum, pair) => sum + pair.p99LatencyMs, 0) / nodeData.length)
              : 0,
          count: node.totalSends,
          successRate: Math.round(node.matchSuccessRate * 100),
          connections: node.peerCount,
          trend: Math.floor(Math.random() * 21) - 10, // Mock trend data
        };
      })
      .sort((a, b) => a.median - b.median);
  };

  function getPerformanceGrade(latency: number) {
    if (latency <= 10) return { grade: "A+", color: "text-green-400", bg: "bg-green-900/30" };
    if (latency <= 20) return { grade: "A", color: "text-green-300", bg: "bg-green-800/30" };
    if (latency <= 50) return { grade: "B", color: "text-blue-300", bg: "bg-blue-800/30" };
    if (latency <= 100) return { grade: "C", color: "text-yellow-300", bg: "bg-yellow-800/30" };
    if (latency <= 200) return { grade: "D", color: "text-orange-300", bg: "bg-orange-800/30" };
    return { grade: "F", color: "text-red-300", bg: "bg-red-800/30" };
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Network Performance Rankings
            </CardTitle>
            <CardDescription className="text-gray-400">
              Comprehensive performance metrics and rankings across all network components
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Select value={distributionView} onValueChange={setDistributionView}>
              <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="by-pair" className="text-gray-200 focus:bg-gray-700">
                  Node Pair Rankings
                </SelectItem>
                <SelectItem value="by-message-type" className="text-gray-200 focus:bg-gray-700">
                  Message Type Rankings
                </SelectItem>
                <SelectItem value="by-individual-nodes" className="text-gray-200 focus:bg-gray-700">
                  Individual Node Rankings
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {(() => {
            let data: RankingItem[] = [];
            let title = "";
            let subtitle = "";

            if (distributionView === "by-pair") {
              data = getNodePairRankings();
              title = "Node Pair Performance";
              subtitle = "Ranked by median latency across all message types";
            } else if (distributionView === "by-message-type") {
              data = getMessageTypeRankings();
              title = "Message Type Performance";
              subtitle = "Ranked by median latency across all node pairs";
            } else if (distributionView === "by-individual-nodes") {
              data = getNodeRankings();
              title = "Individual Node Performance";
              subtitle = "Ranked by average latency across all connections";
            }

            return (
              <>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                  <p className="text-sm text-gray-400">{subtitle}</p>
                </div>
                {data.map((item, index) => {
                  const grade = getPerformanceGrade(item.median);
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg bg-gray-700/50 hover:bg-gray-700/70 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0
                              ? "bg-green-600 text-white"
                              : index === 1
                              ? "bg-blue-600 text-white"
                              : index === 2
                              ? "bg-purple-600 text-white"
                              : "bg-gray-600 text-gray-300"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-gray-200">
                            {distributionView === "by-message-type" ? (
                              <Badge
                                variant="secondary"
                                className={`mr-2 ${
                                  item.label === "new_round_step"
                                    ? "bg-blue-600 text-white"
                                    : item.label === "vote"
                                    ? "bg-green-600 text-white"
                                    : item.label === "block_part"
                                    ? "bg-purple-600 text-white"
                                    : "bg-orange-600 text-white"
                                }`}
                              >
                                {item.label}
                              </Badge>
                            ) : (
                              item.label
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            {distributionView === "by-pair" && (
                              <>
                                <span>{item.messageTypes} message types</span>
                                <span>•</span>
                                <span>{item.count.toLocaleString()} total messages</span>
                              </>
                            )}
                            {distributionView === "by-message-type" && (
                              <>
                                <span>{item.nodePairs} node pairs</span>
                                <span>•</span>
                                <span>{item.count.toLocaleString()} total messages</span>
                              </>
                            )}
                            {distributionView === "by-individual-nodes" && (
                              <>
                                <span>{item.connections} peer connections</span>
                                <span>•</span>
                                <span>{item.count.toLocaleString()} total sends</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-xs text-gray-400 mb-1">Grade</div>
                          <div className={`text-sm font-bold px-2 py-1 rounded ${grade.bg} ${grade.color}`}>
                            {grade.grade}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-400 mb-1">
                            {distributionView === "by-individual-nodes" ? "Avg Median" : "Median"}
                          </div>
                          <div className="text-lg font-bold text-slate-300">{item.median}ms</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-400 mb-1">
                            {distributionView === "by-individual-nodes" ? "Avg P95" : "P95"}
                          </div>
                          <div className="text-sm font-medium text-slate-400">{item.p95}ms</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-400 mb-1">
                            {distributionView === "by-individual-nodes" ? "Avg P99" : "P99"}
                          </div>
                          <div className="text-sm font-medium text-slate-500">{item.p99}ms</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-400 mb-1">
                            {distributionView === "by-individual-nodes" ? "Match Rate" : "Success Rate"}
                          </div>
                          <div className="text-sm font-medium text-green-400">{item.successRate}%</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            );
          })()}
        </div>
      </CardContent>
    </Card>
  );
}
