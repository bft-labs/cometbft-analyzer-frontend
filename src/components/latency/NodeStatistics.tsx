"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Progress } from "./TempUI";
import { getNodeShortId } from "@/utils/dataUtils";

export default function NodeStatistics({ nodes }: { nodes: NodeStats[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {nodes.map((node) => (
        <Card key={node.nodeId} className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg">{getNodeShortId(node.nodeId)}</CardTitle>
            <CardDescription>Validator: {node.validatorAddress.slice(0, 16)}...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">Total Sends</div>
                <div className="text-2xl font-bold text-blue-400">{node.totalSends.toLocaleString()}</div>
              </div>
              <div>
                <div className="font-medium">Total Receives</div>
                <div className="text-2xl font-bold text-green-400">{node.totalReceives.toLocaleString()}</div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Match Success Rate</span>
                <span className="font-medium">{(node.matchSuccessRate * 100).toFixed(1)}%</span>
              </div>
              <Progress value={node.matchSuccessRate * 100} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-red-900/50 p-2 rounded">
                <div className="font-medium text-red-300">Unmatched Sends</div>
                <div className="text-red-400">{node.unmatchedSends.toLocaleString()}</div>
              </div>
              <div className="bg-orange-900/50 p-2 rounded">
                <div className="font-medium text-orange-300">Unmatched Receives</div>
                <div className="text-orange-400">{node.unmatchedReceives.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
