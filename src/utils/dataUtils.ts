export function processApiEvents(apiData: ApiEventResponse[] | unknown): { events: CanvasEvent[]; nodes: string[] } {
  const nodeSet = new Set<string>();

  // Handle case where API returns an object with data array
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
      const item = raw as ApiEventResponse;
      if (item.nodeId) nodeSet.add(item.nodeId);
      if ((item as any).senderPeerId) nodeSet.add((item as any).senderPeerId as string);

      // Explicitly map backend eventType -> frontend type; keep other fields as-is
      const frontendEvent: CanvasEvent = {
        ...(item as unknown as Record<string, any>),
        type: (item as any).eventType ?? (item as any).type, // prefer eventType, fallback to legacy 'type'
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
