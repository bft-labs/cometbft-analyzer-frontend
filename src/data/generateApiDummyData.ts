// Helper functions to generate random data
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const randomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomHex = (length: number): string =>
  Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join("");

const randomSha = (length: number = 64): string => randomHex(length);
const randomSignature = (): string => randomHex(128);

// --- Realistic Mock Data Configuration ---
const NODE_IDS = [
  "b38789be5ff2cf33b5a8b21b8944300ffc3fd486",
  "3a432fbc81f62792b8cadf8bcb7132596ec0fe30",
  "1098fd57a14f56a55a19421fb832d72c31bdab34",
  "fdbfcd2693b7bec454147eb3716fe50f13f5256d",
  "e6e98ee6a79089f25e691697a630c7d0bc60e48b",
];

const VALIDATOR_ADDRESSES = [
  "9DF5496645C9BE0A54E2A682AAB851BD7BC680CF",
  "B37600500B356FE14DFF8522BA61ADCE9E91DD3A",
  "54AFEE1ECC3D98D707438A73E36678668E728B46",
  "E6E98EE6A79089F25E691697A630C7D0BC60E48B",
  "9df5496645c9be0a54e2a682aab851bd7bc680cf",
];

const PEERS = NODE_IDS.map((id) => `${id}@127.0.0.1:${randomInt(20000, 60000)}`);

const EVENT_TYPES: EventTypes[] = ["sendVote", "receiveVote", "stepChange", "scheduledTimeout", "receivedProposal"];
const VOTE_TYPES = ["prevote", "precommit"];
const STEPS = ["newHeight", "propose", "prevote", "precommit", "commit"];

/**
 * Generates a realistic-looking dummy API event response based on the provided sample data.
 * @returns {DraftApiEventResponse} A single dummy event.
 */
export function generateApiDummyData(count: number = 200): DraftApiEventResponse[] {
  const dummyData: DraftApiEventResponse[] = [];
  let currentTime = new Date();
  let currentHeight = 369;
  let currentRound = 0;

  for (let i = 0; i < count; i++) {
    // Increment time slightly for each event
    currentTime = new Date(currentTime.getTime() + randomInt(5, 50));

    const eventType = randomElement(EVENT_TYPES);
    const nodeId = randomElement(NODE_IDS);
    const validatorAddress = randomElement(VALIDATOR_ADDRESSES);

    const baseEvent: Partial<DraftApiEventResponse> = {
      Type: eventType,
      Timestamp: currentTime.toISOString(),
      NodeId: nodeId,
      ValidatorAddress: validatorAddress,
    };

    switch (eventType) {
      case "sendVote":
      case "receiveVote": {
        const voteTimestamp = new Date(currentTime.getTime() - randomInt(10, 100));
        baseEvent.vote = {
          Type: randomElement(VOTE_TYPES),
          Height: currentHeight,
          Round: currentRound,
          BlockId: {
            Hash: randomSha(),
            PartSetHeader: {
              Total: 1,
              Hash: randomSha(),
            },
          },
          Timestamp: voteTimestamp.toISOString(),
          ValidatorAddress: randomElement(VALIDATOR_ADDRESSES),
          ValidatorIndex: randomInt(0, NODE_IDS.length - 1),
          Signature: randomSignature(),
          Extension: "",
          ExtensionSignature: "",
        };

        const peer = randomElement(PEERS.filter((p) => !p.startsWith(nodeId)));
        if (eventType === "sendVote") {
          baseEvent.recipientPeer = peer;
        } else {
          baseEvent.sourcePeer = peer;
        }
        break;
      }

      case "stepChange": {
        const previousStep = randomElement(STEPS);
        let targetStep = randomElement(STEPS);
        while (targetStep === previousStep) {
          targetStep = randomElement(STEPS);
        }
        baseEvent.currentHeight = currentHeight;
        baseEvent.currentRound = currentRound;
        baseEvent.currentStep = previousStep;
        baseEvent.targetStep = targetStep;
        break;
      }

      case "scheduledTimeout": {
        baseEvent.height = currentHeight;
        baseEvent.round = currentRound;
        baseEvent.duration = `${randomInt(500, 1500)}.${randomInt(100, 999)}ms`;
        baseEvent.step = randomElement(STEPS);
        break;
      }

      case "receivedProposal": {
        baseEvent.proposal = {
          Height: currentHeight,
          Round: currentRound,
          PolRound: -1,
          BlockID: {
            Hash: randomSha(),
            PartSetHeader: {
              Total: randomInt(1, 100),
              Hash: randomSha(),
            },
          },
          Timestamp: new Date(currentTime.getTime() - randomInt(50, 200)).toISOString(),
          Signature: randomSignature(),
        };
        break;
      }
    }

    dummyData.push(baseEvent as DraftApiEventResponse);

    // Occasionally increment height and reset round
    if (Math.random() < 0.05) {
      currentHeight++;
      currentRound = 0;
    } else if (Math.random() < 0.1) {
      currentRound++;
    }
  }

  return dummyData;
}
