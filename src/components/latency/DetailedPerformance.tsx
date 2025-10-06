"use client";

import { useEffect, useMemo, useState } from "react";
import { getNodeShortId } from "@/utils/dataUtils";
import DetailedAnalysis from "./DetailedAnalysis";

interface TableRowData extends MessageLatencyStats {
  pair: string;
  median: number;
  p95: number;
  p99: number;
  max: number;
}

// Helper functions
function getPairLabel(node1Id: string, node2Id: string): string {
  return `${getNodeShortId(node1Id)} ↔ ${getNodeShortId(node2Id)}`;
}

function getLatencyColorClass(latency: number): string {
  if (latency <= 20) return "text-green-400";
  if (latency <= 50) return "text-yellow-400";
  if (latency <= 100) return "text-orange-400";
  return "text-red-400";
}

interface DetailedPerformanceTableProps {
  data: MessageLatencyStats[];
  messageTypes: string[];
}

export function DetailedPerformanceTable({ data, messageTypes }: DetailedPerformanceTableProps) {
  const [selectedPair, setSelectedPair] = useState<string | null>(null);
  const [selectedMessageType, setSelectedMessageType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('');

  const handlePairSelect = (pair: string, messageType: string) => {
    const pairKey = `${pair}-${messageType}`;
    setSelectedPair(selectedPair === pairKey ? null : pairKey);
    setSelectedMessageType(selectedPair === pairKey ? null : messageType);
  };

  const handleClearPair = () => {
    setSelectedPair(null);
    setSelectedMessageType(null);
  };

  const selectedPairData = useMemo(() => {
    if (!selectedPair || !selectedMessageType) return null;
    const pair = selectedPair.replace(`-${selectedMessageType}`, "");
    return data.filter(
      (stat) => getPairLabel(stat.node1Id, stat.node2Id) === pair && stat.messageType === selectedMessageType
    );
  }, [selectedPair, selectedMessageType, data]);

  const messageTypeData = useMemo(() => {
    return messageTypes
      .map((messageType) => {
        const typeData = data
          .filter((item) => item.messageType === messageType)
          .map((item: MessageLatencyStats) => {
            const pairLabel = getPairLabel(item.node1Id, item.node2Id);
            return {
              ...item,
              pair: pairLabel,
              median: item.medianLatencyMs,
              p95: item.p95LatencyMs,
              p99: item.p99LatencyMs,
              max: item.maxLatencyMs,
            };
          })
          .sort((a, b) => b.p95 - a.p95);

        return {
          messageType,
          data: typeData,
        };
      })
      .filter((section) => section.data.length > 0);
  }, [data, messageTypes]);

  useEffect(() => {
    if (messageTypeData.length > 0 && !activeTab) {
      setActiveTab(messageTypeData[0].messageType);
    }
  }, [messageTypeData, activeTab]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Detailed Performance Metrics</h3>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-700">
          <nav className="flex space-x-8" aria-label="Tabs">
            {messageTypeData.map(({ messageType, data: typeData }) => (
              <button
                key={messageType}
                onClick={() => setActiveTab(messageType)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === messageType
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <span className="capitalize">{messageType}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {messageTypeData.map(({ messageType, data: typeData }) => {
          if (activeTab !== messageType) return null;
          
          return (
            <div key={messageType} className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
              <div className="grid grid-cols-6 gap-4 px-4 py-2 text-xs font-medium border-b border-gray-600 bg-gray-700/50">
                <div className="text-gray-300">Node Pair</div>
                <div className="text-gray-300">Count</div>
                <div className="text-gray-300">Median (ms)</div>
                <div className="text-gray-300">P95 (ms)</div>
                <div className="text-gray-300">P99 (ms)</div>
                <div className="text-gray-300">Max (ms)</div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {typeData.map((item: TableRowData, index: number) => {
                  const pairKey = `${item.pair}-${messageType}`;
                  return (
                    <div
                      key={`${item.pair}-${messageType}-${index}`}
                      className={`grid grid-cols-6 gap-4 px-4 py-2 text-sm transition-colors border-b border-gray-700/50 last:border-b-0 cursor-pointer ${
                        selectedPair === pairKey ? "bg-blue-900/50 ring-2 ring-blue-500" : "hover:bg-gray-700/30"
                      }`}
                      onClick={() => handlePairSelect(item.pair, messageType)}
                    >
                      <div className="font-medium text-gray-200 truncate" title={item.pair}>
                        {item.pair}
                      </div>
                      <div className="text-blue-400 font-medium">{item.count.toLocaleString()}</div>
                      <div className={`font-bold ${getLatencyColorClass(item.median)}`}>{item.median}</div>
                      <div className={`font-bold ${getLatencyColorClass(item.p95)}`}>{item.p95}</div>
                      <div className={`font-bold ${getLatencyColorClass(item.p99)}`}>{item.p99}</div>
                      <div className="text-red-300 font-medium">{item.max}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {selectedPair && (
        <div className="mt-6">
          <DetailedAnalysis selectedPair={selectedPair} selectedPairData={selectedPairData} onClear={handleClearPair} />
        </div>
      )}
    </>
  );
}
