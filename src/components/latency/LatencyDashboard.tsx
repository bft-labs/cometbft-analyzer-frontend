"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/latency/TempUI";
import { extractMessageLatencyStats } from "@/utils/dataUtils";
import { useSearchParams } from "next/navigation";
import { DetailedPerformanceTable } from "./DetailedPerformance";
import { PerformanceAnalytics } from "./PerformanceAnalytics";
import LatencyHeatmap from "./LatencyHeatmap";
import { apiService } from "@/services/api";


interface LatencyDashboardProps {
  simulationId?: string;
}

export default function LatencyDashboard({ simulationId }: LatencyDashboardProps) {
  const searchParams = useSearchParams();

  const [votes, setVotes] = useState<LatencyVotesResponse[] | null>(null);
  const [stats, setStats] = useState<MessageLatencyStats[]>([]);
  const [nodeStats, setNodeStats] = useState<NodeStats[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const from = searchParams.get("from");
        const to = searchParams.get("to");

        if (simulationId) {
          const params = {
            from: from || undefined,
            to: to || undefined,
          };

          const [votesData, statsData, nodeStatsData] = await Promise.all([
            apiService.getSimulationVoteLatencies(simulationId, params),
            apiService.getSimulationNetworkLatencyStats(simulationId, params),
            apiService.getSimulationNetworkLatencyNodeStats(simulationId),
          ]);

          setVotes((votesData as {data?: unknown[]})?.data as LatencyVotesResponse[] || []);
          setStats(extractMessageLatencyStats(statsData as LatencyStatsResponse[]) || []);
          setNodeStats((nodeStatsData as unknown[]) as NodeStats[] || []);
        } else {
          const query = from && to ? `?from=${from}&to=${to}` : "";
          const urls = [`/api/latency/votes${query}`, `/api/latency/stats${query}`, `/api/latency/nodes${query}`];

          const [votesRes, statsRes, nodeStatsRes] = await Promise.all(urls.map((url) => fetch(url)));

          const [votesData, statsData, nodeStatsData] = await Promise.all([
            votesRes.json(),
            statsRes.json(),
            nodeStatsRes.json(),
          ]);

          setVotes(votesData.data || []);
          setStats(extractMessageLatencyStats(statsData) || []);
          setNodeStats(nodeStatsData || []);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();

    // DELETE LATER: This is for debugging purposes
    console.log(!votes);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, simulationId]);



  const overallStats = useMemo(() => {
    if (!nodeStats || !Array.isArray(nodeStats)) {
      return {
        totalMessages: 0,
        avgLatency: 0,
        totalNodes: 0,
        totalPairs: 0,
      };
    }

    const totalMessages = nodeStats.reduce((sum, node) => sum + (node.totalSends || 0), 0);
    const avgLatency =
      stats && stats.length > 0
        ? stats.reduce((sum, pair) => sum + (pair.medianLatencyMs || 0), 0) / stats.length
        : 0;

    const totalPairs = nodeStats.length * (nodeStats.length - 1) / 2;

    return {
      totalMessages,
      avgLatency: Math.round(avgLatency) || 0,
      totalNodes: nodeStats.length,
      totalPairs,
    };
  }, [stats, nodeStats]);

  const messageTypes = useMemo(() => {
    const types = new Set<string>();
    stats.forEach(stat => {
      if (stat.messageType) {
        types.add(stat.messageType);
      }
    });
    return Array.from(types).sort();
  }, [stats]);

  return (
    <div className="text-white px-6 py-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">CometBFT Network Analysis</h1>
            <p className="text-gray-400">Real-time latency monitoring and bottleneck detection</p>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Nodes</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-2xl font-bold">{overallStats.totalNodes}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Node Pairs</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-2xl font-bold">{overallStats.totalPairs}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-2xl font-bold">{overallStats.totalMessages.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-2xl font-bold">{overallStats.avgLatency}ms</div>
            </CardContent>
          </Card>
        </div>

        <PerformanceAnalytics data={stats} nodeStats={nodeStats} messageTypes={messageTypes} />

        <DetailedPerformanceTable
          data={stats}
          messageTypes={messageTypes}
        />

        <LatencyHeatmap data={stats} />
      </div>
    </div>
  );
}
