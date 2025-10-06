export const nodes = ["N0", "N1", "N2", "N3", "N4"];

const stateOptions = [
  "ReceivedCompleteProposalBlock",
  "EnteringNewRound",
  "EnteringProposeStep",
  "EnteringPrevoteStep",
  "EnteringPrevoteWaitStep",
  "EnteringPrecommitStep",
  "EnteringPrecommitWaitStep",
  "EnteringCommitStep",
  "Locking",
  "ScheduledTimeout",
  "FinalizingCommitOfBlock",
  "CommittedBlock",
  "UpdatingValidBlock",
];

export function generateDummyData(): EventData[] {
  const dummyData: EventData[] = [];
  let currentTime = 1679048123401;
  const numPairs = 150;

  for (let i = 0; i < numPairs; i++) {
    const delta = Math.floor(Math.random() * 400) + 100;
    currentTime += delta;

    const fromNode = nodes[Math.floor(Math.random() * nodes.length)];
    let toNode = nodes[Math.floor(Math.random() * nodes.length)];
    while (toNode === fromNode) {
      toNode = nodes[Math.floor(Math.random() * nodes.length)];
    }

    const msgTypes: EventData["message_type"][] = ["SendVote", "ReceiveVote", "SendBlockPart", "ReceiveBlockPart"];
    const messageType = msgTypes[Math.floor(Math.random() * msgTypes.length)];

    const height = Math.floor(Math.random() * 11) + 10;

    // send_vote
    const sendEvent: EventData = {
      event_type: "send_vote",
      timestamp: currentTime,
      from: fromNode,
      to: toNode,
      message_type: messageType,
      signature: "0x" + Math.random().toString(16).slice(2, 18).toUpperCase(),
    };
    dummyData.push(sendEvent);

    // receive_vote
    const recvDelay = Math.floor(Math.random() * 50) + 1;
    const receiveEvent: EventData = {
      event_type: "receive_vote",
      timestamp: currentTime + recvDelay,
      from: fromNode,
      to: toNode,
      message_type: messageType,
      signature: "0x" + Math.random().toString(16).slice(2, 18).toUpperCase(),
    };

    dummyData.push(receiveEvent);

    // state_change
    if (Math.random() < 0.33) {
      const stateDelay = Math.floor(Math.random() * 80) + 20;
      const stateNode = nodes[Math.floor(Math.random() * nodes.length)];
      const randomIndex = Math.floor(Math.random() * stateOptions.length);
      const stateEvent: EventData = {
        event_type: "state_change",
        timestamp: currentTime + stateDelay,
        height,
        previousRound: 1,
        currentRound: 2,
        node: stateNode,
        currentStep: stateOptions[randomIndex],
        targetStep: stateOptions[randomIndex],
      };
      dummyData.push(stateEvent);
    }
  }

  return dummyData;
}
