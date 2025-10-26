export function processApiEvents(apiData: ApiEventResponse[] | unknown): { events: CanvasEvent[]; nodes: string[] } {
  const nodeSet = new Set<string>();

  // Normalize to an array of ApiEventResponse (but keep unknown fields intact)
  let eventsArray: any[] = [];
  if (Array.isArray(apiData)) {
    eventsArray = apiData as any[];
  } else if (
    apiData &&
    typeof apiData === "object" &&
    "data" in apiData &&
    Array.isArray((apiData as { data: unknown }).data)
  ) {
    eventsArray = (apiData as { data: any[] }).data;
  } else if (
    apiData &&
    typeof apiData === "object" &&
    "events" in apiData &&
    Array.isArray((apiData as { events: unknown }).events)
  ) {
    eventsArray = (apiData as { events: any[] }).events;
  } else {
    console.warn("Unexpected API response format:", apiData);
    return { events: [], nodes: [] };
  }

  const events: CanvasEvent[] =
    eventsArray?.map((raw) => {
      const item = raw as ApiEventResponse & Record<string, any>;
      if (item.nodeId) nodeSet.add(item.nodeId);
      if ((item as any).senderPeerId) nodeSet.add((item as any).senderPeerId as string);
      if ((item as any).recipientPeerId) nodeSet.add((item as any).recipientPeerId as string);
      // Also handle cases where only peer strings are present (e.g., "<peerId>@ip:port")
      const sourcePeer = (item as any).sourcePeer as string | undefined;
      const recipientPeer = (item as any).recipientPeer as string | undefined;
      if (sourcePeer) nodeSet.add(sourcePeer.includes("@") ? sourcePeer.split("@")[0] : sourcePeer);
      if (recipientPeer) nodeSet.add(recipientPeer.includes("@") ? recipientPeer.split("@")[0] : recipientPeer);

      // Preserve all backend fields (including isOurTurn, duration, step, nextStep...)
      // Prefer canonical eventType, fallback to legacy type
      const frontendEvent: CanvasEvent = {
        ...(item as unknown as Record<string, any>),
        type: (item as any).eventType ?? (item as any).type ?? "unknown",
        timestamp: new Date(item.timestamp),
      } as CanvasEvent;

      return frontendEvent;
    }) || [];

  return { events, nodes: Array.from(nodeSet) };
}

export function getNodeShortId(nodeId: string) {
  return nodeId.slice(0, 8) + "...";
}

export function extractMessageLatencyStats(data: LatencyStatsResponse[]): MessageLatencyStats[] {
  if (!data) return [];
  return data.flatMap((item) => Object.values(item.messageTypes));
}
