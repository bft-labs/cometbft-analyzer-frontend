export function processApiEvents(apiData: ApiEventResponse[] | unknown): { events: CanvasEvent[]; nodes: string[] } {
  const nodeSet = new Set<string>();

  // Normalize to an array of ApiEventResponse
  let eventsArray: ApiEventResponse[] = [];
  if (Array.isArray(apiData)) {
    eventsArray = apiData as ApiEventResponse[];
  } else if (
    apiData &&
    typeof apiData === "object" &&
    "data" in apiData &&
    Array.isArray((apiData as { data: unknown }).data)
  ) {
    eventsArray = (apiData as { data: ApiEventResponse[] }).data;
  } else if (
    apiData &&
    typeof apiData === "object" &&
    "events" in apiData &&
    Array.isArray((apiData as { events: unknown }).events)
  ) {
    eventsArray = (apiData as { events: ApiEventResponse[] }).events;
  } else {
    console.warn("Unexpected API response format:", apiData);
    return { events: [], nodes: [] };
  }

  const events: CanvasEvent[] =
    eventsArray.map((item: ApiEventResponse) => {
      if (item.nodeId) nodeSet.add(item.nodeId);
      if (item.senderPeerId) nodeSet.add(item.senderPeerId);

      const legacyType = (item as unknown as { type?: string }).type;
      const type = item.eventType ?? legacyType ?? "unknown";

      const frontendEvent: CanvasEvent = {
        type,
        timestamp: new Date(item.timestamp),
        nodeId: item.nodeId,
        validatorAddress: item.validatorAddress,
        vote: item.vote,
        proposal: item.proposal,
        part: item.part,
        height: item.height,
        round: item.round,
        currentHeight: item.currentHeight,
        currentRound: item.currentRound,
        currentStep: item.currentStep,
        hash: item.hash,
        proposer: item.proposer,
        status: item.status,
        senderPeerId: item.senderPeerId,
        sentTime: item.sentTime,
        receivedTime: item.receivedTime,
        latency: item.latency,
      };

      return frontendEvent;
    });

  return { events, nodes: Array.from(nodeSet) };
}

export function getNodeShortId(nodeId: string) {
  return nodeId.slice(0, 8) + "...";
}

export function extractMessageLatencyStats(data: LatencyStatsResponse[]): MessageLatencyStats[] {
  if (!data) return [];
  return data.flatMap((item) => Object.values(item.messageTypes));
}
