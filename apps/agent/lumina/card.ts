import { AgentCard } from "@a2a-js/sdk";

export const luminaAgentCard: AgentCard = {
  protocolVersion: "0.3.0",
  name: "Lumina DeFi Research Assistant",
  description:
    "A DeFi research assistant for protocol analysis, risk review, and market context.",
  url: "http://localhost:10003/",
  provider: {
    organization: "A2A Samples",
    url: "https://example.com/a2a-samples",
  },
  version: "1.0.0",
  capabilities: {
    streaming: true,
    pushNotifications: false,
    stateTransitionHistory: false,
  },
  securitySchemes: undefined,
  security: undefined,
  defaultInputModes: ["text"],
  defaultOutputModes: ["text"],
  skills: [
    {
      id: "defi-research",
      name: "DeFi research",
      description: "Analyzes DeFi protocols, token dynamics, and risk signals",
      tags: ["defi", "research", "onchain", "crypto"],
      examples: [
        "Compare the TVL quality and incentive risk of two lending protocols",
        "Summarize key smart contract and liquidity risks for this token",
      ],
      inputModes: ["text"],
      outputModes: ["text"],
    },
  ],
  supportsAuthenticatedExtendedCard: false,
};
