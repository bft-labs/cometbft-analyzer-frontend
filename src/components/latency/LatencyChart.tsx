import React, { useState, useMemo, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { stringToColor } from "../../utils/colorUtils";
import { CardDescription, CardHeader, CardTitle } from "./TempUI";

// Define the CustomTooltip component to display detailed information
const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0];
    const pairName = dataPoint.name;
    // Retrieve the full data object stored for the tooltip
    const fullData = dataPoint.payload[`${pairName}_data`];

    if (!fullData) {
      return (
        <div className="p-2 bg-gray-800 text-white rounded border border-gray-600 text-sm">
          <p className="label font-bold mb-1">{`Time: ${new Date(label).toLocaleString()}`}</p>
          <p>{`${pairName}: ${dataPoint.value} ms`}</p>
        </div>
      );
    }

    return (
      <div className="p-3 bg-gray-800 bg-opacity-90 text-white rounded border border-gray-600 text-sm shadow-lg">
        <p className="label font-bold mb-2">{`Time: ${new Date(label).toLocaleString()}`}</p>
        <p>
          <span className="font-semibold text-gray-400">Height:</span> {fullData.height}
        </p>
        <p>
          <span className="font-semibold text-gray-400">Round:</span> {fullData.round}
        </p>
        <p>
          <span className="font-semibold text-gray-400">Type:</span> {fullData.type}
        </p>
        <p>
          <span className="font-semibold text-gray-400">Sender:</span> {fullData.sender}
        </p>
        <p>
          <span className="font-semibold text-gray-400">Receiver:</span> {fullData.receiver}
        </p>
        <p>
          <span className="font-semibold text-gray-400">Latency:</span> {fullData.latencyMs} ms
        </p>
      </div>
    );
  }

  return null;
};

interface LatencyChartProps {
  votes: LatencyVotesResponse[] | null;
  selectedNodes: string[];
  selectedMessageTypes: string[];
}

const LatencyChart: React.FC<LatencyChartProps> = ({ votes, selectedNodes, selectedMessageTypes }) => {
  const [latencyData, setLatencyData] = useState<LatencyVotesResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (votes) {
      setLatencyData(votes);

      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [votes]);

  const filteredLatencyData = useMemo(() => {
    const nodeFilter = (item: LatencyVotesResponse) =>
      selectedNodes.length === 0 || selectedNodes.includes(item.sender) || selectedNodes.includes(item.receiver);

    const messageTypeFilter = (item: LatencyVotesResponse) =>
      selectedMessageTypes.length === 0 || selectedMessageTypes.includes(item.type);

    if (!latencyData) return [];
    return latencyData.filter((item) => nodeFilter(item) && messageTypeFilter(item));
  }, [latencyData, selectedNodes, selectedMessageTypes]);

  const nodes = useMemo(() => {
    const nodeSet = new Set<string>();
    latencyData.forEach((item) => {
      nodeSet.add(item.sender);
      nodeSet.add(item.receiver);
    });
    return Array.from(nodeSet).sort();
  }, [latencyData]);

  const { chartData, pairs } = useMemo(() => {
    const allPossiblePairs = Array.from(
      latencyData.reduce((acc, item) => {
        acc.add(`${item.sender.slice(0, 6)} -> ${item.receiver.slice(0, 6)}`);
        return acc;
      }, new Set<string>())
    ).sort();

    if (filteredLatencyData?.length === 0) {
      return { chartData: [], pairs: allPossiblePairs };
    }

    const dataByTimestamp: Record<string, { sentTime: number; [key: string]: number | LatencyVotesResponse }> = {};

    filteredLatencyData?.forEach((item) => {
      const pair = `${item.sender.slice(0, 6)} -> ${item.receiver.slice(0, 6)}`;
      const timestamp = new Date(item.sentTime).getTime();
      if (!dataByTimestamp[timestamp]) {
        dataByTimestamp[timestamp] = { sentTime: timestamp };
      }
      dataByTimestamp[timestamp][pair] = item.latencyMs;
      // Store the original item for detailed tooltip info
      dataByTimestamp[timestamp][`${pair}_data`] = item;
    });

    const sortedChartData = Object.values(dataByTimestamp).sort((a, b) => a.sentTime - b.sentTime);

    return { chartData: sortedChartData, pairs: allPossiblePairs };
  }, [filteredLatencyData, latencyData]);

  if (loading) {
    return <div className="text-center py-10">Loading chart data...</div>;
  }

  return (
    <div className="bg-[#2E364D] text-white rounded-[8px] shadow mb-6">
      <CardHeader>
        <CardTitle className="text-xl">Latency Chart</CardTitle>
        <CardDescription>
          Visualizes the latency of nodes over time. Each line represents a unique sender-receiver pair.
        </CardDescription>
      </CardHeader>
      <ResponsiveContainer width="100%" height={400} className="mt-5 px-5">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="sentTime"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(time) => new Date(time).toLocaleTimeString()}
            allowDuplicatedCategory={true}
          />
          <YAxis label={{ value: "Latency (ms)", angle: -90, position: "insideLeft" }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {pairs.map((pair) => {
            const [sender, receiver] = pair.split(" -> ");
            const originalSender = nodes.find((n) => n.startsWith(sender));
            const originalReceiver = nodes.find((n) => n.startsWith(receiver));

            if (!originalSender || !originalReceiver) return null;

            let isVisible = false;
            if (selectedNodes.length === 0) {
              isVisible = true; // Show all if no nodes are selected
            } else if (selectedNodes.length === 1) {
              if (originalSender === selectedNodes[0] || originalReceiver === selectedNodes[0]) {
                isVisible = true;
              }
            } else {
              if (selectedNodes.includes(originalSender) && selectedNodes.includes(originalReceiver)) {
                isVisible = true;
              }
            }

            return isVisible ? (
              <Line key={pair} type="linear" dataKey={pair} name={pair} stroke={stringToColor(pair)} connectNulls />
            ) : null;
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LatencyChart;
