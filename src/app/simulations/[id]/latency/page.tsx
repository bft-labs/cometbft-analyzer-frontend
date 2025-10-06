"use client";

import React, { Suspense } from "react";
import { useParams } from "next/navigation";
import LatencyDashboard from "@/components/latency/LatencyDashboard";

export default function LatencyPage() {
  const params = useParams();
  const simulationId = params.id as string;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LatencyDashboard simulationId={simulationId} />
    </Suspense>
  );
}