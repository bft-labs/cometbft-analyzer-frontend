"use client";

import React, { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CustomRechartsTooltip } from "./TempUI";

export default function LatencyDistribution({ data }: { data: LatencyDistributionData[] }) {
  const groupedData = useMemo(() => {
    if (!data) return {};
    return data.reduce((acc, item) => {
      const { messageType } = item;
      if (!acc[messageType]) {
        acc[messageType] = [];
      }
      acc[messageType].push(item);
      return acc;
    }, {} as Record<string, LatencyDistributionData[]>);
  }, [data]);

  const messageTypes = Object.keys(groupedData);

  if (!data || data.length === 0 || messageTypes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Latency Distribution by Node Pairs</CardTitle>
          <CardDescription>Comparison of median, P95, and P99 latencies across node pairs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-gray-500">
            <p>No distribution data to display.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {messageTypes.map((messageType) => (
        <Card key={messageType}>
          <CardHeader>
            <CardTitle className="text-xl capitalize">
              Latency Distribution for: {messageType.replace(/_/g, " ")}
            </CardTitle>
            <CardDescription>Comparison of median, P95, and P99 latencies for the selected node pairs.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={groupedData[messageType]} margin={{ top: 5, right: 20, left: -10, bottom: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                  <XAxis dataKey="pair" angle={-45} textAnchor="end" interval={0} tick={{ fill: "#A0AEC0" }} />
                  <YAxis
                    tick={{ fill: "#A0AEC0" }}
                    label={{ value: "Latency (ms)", angle: -90, position: "insideLeft", fill: "#A0AEC0" }}
                  />
                  <Tooltip content={<CustomRechartsTooltip />} cursor={{ fill: "rgba(100, 116, 139, 0.1)" }} />
                  <Bar dataKey="median" name="Median" fill="#3b82f6" />
                  <Bar dataKey="p95" name="P95" fill="#f97316" />
                  <Bar dataKey="p99" name="P99" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
