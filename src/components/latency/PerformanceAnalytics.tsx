"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./TempUI";
import { getNodeShortId } from "@/utils/dataUtils";

interface PerformanceAnalysisOverviewProps {
  data: MessageLatencyStats[];
  nodeStats: NodeStats[];
  messageTypes: string[];
}

export function PerformanceAnalytics({ data, messageTypes }: PerformanceAnalysisOverviewProps) {
  const messageTypeLatencyData = React.useMemo(() => {
    const aggregated = messageTypes.map((type) => {
      const typeData = data.filter((item) => item.messageType === type);
      if (typeData.length === 0) return { name: type, p95: 0, count: 0 };
      const totalCount = typeData.reduce((sum, item) => sum + item.count, 0);
      const weightedP95 = typeData.reduce((sum, item) => sum + item.p95LatencyMs * item.count, 0) / totalCount;
      return { name: type, p95: Math.round(weightedP95), count: totalCount };
    });
    return aggregated.sort((a, b) => b.p95 - a.p95);
  }, [data, messageTypes]);

  const messageTypeCountData = React.useMemo(() => {
    const aggregated = messageTypes.map((type) => {
      const typeData = data.filter((item) => item.messageType === type);
      const totalCount = typeData.reduce((sum, item) => sum + item.count, 0);
      return { name: type, count: totalCount };
    });
    return aggregated.filter(item => item.count > 0).sort((a, b) => b.count - a.count);
  }, [data, messageTypes]);

  const nodeLatencyData = React.useMemo(() => {
    const nodes = Array.from(new Set([...data.map((d) => d.node1Id), ...data.map((d) => d.node2Id)]));
    const aggregated = nodes.map((nodeId) => {
      const nodeRelatedPairs = data.filter((item) => item.node1Id === nodeId || item.node2Id === nodeId);
      if (nodeRelatedPairs.length === 0) return { name: getNodeShortId(nodeId), p95: 0, count: 0 };
      const totalCount = nodeRelatedPairs.reduce((sum, item) => sum + item.count, 0);
      const weightedP95 = nodeRelatedPairs.reduce((sum, item) => sum + item.p95LatencyMs * item.count, 0) / totalCount;
      return { name: getNodeShortId(nodeId), p95: Math.round(weightedP95), count: totalCount };
    });
    return aggregated.sort((a, b) => b.p95 - a.p95);
  }, [data]);

  const nodeMessageCountData = React.useMemo(() => {
    const nodes = Array.from(new Set([...data.map((d) => d.node1Id), ...data.map((d) => d.node2Id)]));
    const aggregated = nodes.map((nodeId) => {
      const nodeRelatedPairs = data.filter((item) => item.node1Id === nodeId || item.node2Id === nodeId);
      const totalCount = nodeRelatedPairs.reduce((sum, item) => sum + item.count, 0);
      return { name: getNodeShortId(nodeId), count: totalCount };
    });
    return aggregated.sort((a, b) => b.count - a.count);
  }, [data]);

  const overallAvgP95 = React.useMemo(() => {
    if (data.length === 0) return 0;
    const totalCount = data.reduce((sum, item) => sum + item.count, 0);
    const weightedP95 = data.reduce((sum, item) => sum + item.p95LatencyMs * item.count, 0) / totalCount;
    return Math.round(weightedP95);
  }, [data]);

  return (
    <Card className="">
      <CardHeader>
        <CardTitle className="text-xl">Network Performance Summary</CardTitle>
        <CardDescription>Aggregated performance insights by message type and node.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Key Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Overall Weighted Avg P95 Latency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{overallAvgP95}ms</div>
                <p className="text-xs text-gray-400">
                  Weighted average across all messages and pairs (calculated by message count)
                </p>
              </CardContent>
            </Card>
            <Card className="">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Message Type with Highest Avg P95</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-400">
                  {messageTypeLatencyData[0]?.name || "N/A"} ({messageTypeLatencyData[0]?.p95 || 0}ms)
                </div>
                <p className="text-xs text-gray-400">
                  Highest weighted average P95 latency across all pairs (calculated by message count)
                </p>
              </CardContent>
            </Card>
            <Card className="">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Node with Highest Avg P95</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-400">
                  {nodeLatencyData[0]?.name || "N/A"} ({nodeLatencyData[0]?.p95 || 0}ms)
                </div>
                <p className="text-xs text-gray-400">
                  Highest weighted average P95 latency (across all its communications, calculated by message count)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts for Message Type and Node Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="">
              <CardHeader>
                <CardTitle className="text-white text-lg">Message Type Latency (ms)</CardTitle>
                <CardDescription className="text-gray-400">
                  Average P95 latency by message type (weighted by message count)
                </CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={messageTypeLatencyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                    <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                    <YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#374151", border: "none", borderRadius: "4px" }}
                      labelStyle={{ color: "#e5e7eb" }}
                      itemStyle={{ color: "#e5e7eb" }}
                      formatter={(value: number) => `${value}ms`}
                    />
                    <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 12 }} />
                    <Bar dataKey="p95" fill="#8884d8" name="P95 Latency" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="">
              <CardHeader>
                <CardTitle className="text-white text-lg">Node Latency Contribution (ms)</CardTitle>
                <CardDescription className="text-gray-400">
                  Average P95 latency per node (weighted by message count)
                </CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={nodeLatencyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                    <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                    <YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#374151", border: "none", borderRadius: "4px" }}
                      labelStyle={{ color: "#e5e7eb" }}
                      itemStyle={{ color: "#e5e7eb" }}
                      formatter={(value: number) => `${value}ms`}
                    />
                    <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 12 }} />
                    <Bar dataKey="p95" fill="#82ca9d" name="P95 Latency" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Message Volume Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="">
              <CardHeader>
                <CardTitle className="text-white text-lg">Message Type Volume</CardTitle>
                <CardDescription className="text-gray-400">
                  Total message count by type across all node pairs
                </CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={messageTypeCountData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                    <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                    <YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#374151", border: "none", borderRadius: "4px" }}
                      labelStyle={{ color: "#e5e7eb" }}
                      itemStyle={{ color: "#e5e7eb" }}
                      formatter={(value: number) => `${value.toLocaleString()}`}
                    />
                    <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 12 }} />
                    <Bar dataKey="count" fill="#fbbf24" name="Message Count" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="">
              <CardHeader>
                <CardTitle className="text-white text-lg">Node Message Volume</CardTitle>
                <CardDescription className="text-gray-400">
                  Total messages sent/received per node across all pairs
                </CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={nodeMessageCountData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                    <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                    <YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#374151", border: "none", borderRadius: "4px" }}
                      labelStyle={{ color: "#e5e7eb" }}
                      itemStyle={{ color: "#e5e7eb" }}
                      formatter={(value: number) => `${value.toLocaleString()}`}
                    />
                    <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 12 }} />
                    <Bar dataKey="count" fill="#10b981" name="Message Count" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
