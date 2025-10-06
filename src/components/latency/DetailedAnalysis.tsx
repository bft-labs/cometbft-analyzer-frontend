"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/latency/TempUI";
import { Filter } from "lucide-react";
import PairDetails from "./PairDetails";

interface DetailedMessageLatencyStats extends MessageLatencyStats {
  histogramData?: { range: string; count: number }[];
}

interface DetailedAnalysisProps {
  selectedPair: string | null;
  selectedPairData: MessageLatencyStats[] | null;
  onClear: () => void;
}

const DetailedAnalysis: React.FC<DetailedAnalysisProps> = ({ selectedPair, selectedPairData, onClear }) => {
  const dataWithHistograms = React.useMemo(() => {
    if (!selectedPairData) return null;
    return selectedPairData.map((pair): DetailedMessageLatencyStats => {
      const { medianLatencyMs, p95LatencyMs, p99LatencyMs, count } = pair;
      const p50count = Math.floor(count * 0.5);
      const p95count = Math.floor(count * 0.45);
      const p99count = Math.floor(count * 0.04);
      const p100count = count - p50count - p95count - p99count;

      const generatedHistogramData = [
        { range: `< ${medianLatencyMs}ms`, count: p50count },
        { range: `${medianLatencyMs}-${p95LatencyMs}ms`, count: p95count },
        { range: `${p95LatencyMs}-${p99LatencyMs}ms`, count: p99count },
        { range: `> ${p99LatencyMs}ms`, count: p100count },
      ];
      return { ...pair, histogramData: generatedHistogramData };
    });
  }, [selectedPairData]);

  if (!selectedPair || !dataWithHistograms || dataWithHistograms.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Detailed Analysis: {selectedPair}
            </CardTitle>
            <CardDescription className="text-gray-400">
              Comprehensive metrics for the selected node pair, including message type breakdown and latency
              distribution.
            </CardDescription>
          </div>
          <button onClick={onClear} className="text-gray-400 hover:text-white transition-colors">
            ✕
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Pair Details */}
          <div>
            <PairDetails pairs={dataWithHistograms} />
          </div>

          {/* Right Column: Graphs */}
          <div className="space-y-6">
            {dataWithHistograms.map(
              (pair, index) =>
                pair.histogramData &&
                pair.histogramData.length > 0 && (
                  <div key={index}>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Latency Distribution for {pair.messageType}
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pair.histogramData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                          <XAxis dataKey="range" stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                          <YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#374151", border: "none", borderRadius: "4px" }}
                            labelStyle={{ color: "#e5e7eb" }}
                            itemStyle={{ color: "#e5e7eb" }}
                            formatter={(value: number) => `${value} messages`}
                          />
                          <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 12 }} />
                          <Bar dataKey="count" fill="#a855f7" name="Message Count" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
export default DetailedAnalysis;
