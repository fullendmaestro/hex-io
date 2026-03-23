import { AgentCard } from "@a2a-js/sdk";

export const neuralxAgentCard: AgentCard = {
  protocolVersion: "0.3.0",
  name: "NeuralX Hedera Execution Agent",
  description:
    "A Hedera execution specialist for SaucerSwap, pool analysis, swaps, and liquidity operations.",
  url: "http://localhost:10004/",
  provider: {
    organization: "Hex.IO",
    url: "https://example.com/hexio",
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
      id: "hedera-defi-execution",
      name: "Hedera DeFi execution",
      description: "Builds and analyzes SaucerSwap and Hedera execution plans.",
      tags: ["hedera", "defi", "saucerswap", "swap", "liquidity"],
      examples: [
        "Quote and prepare a swap from HBAR to USDC with 1% slippage",
        "Analyze pool depth before adding liquidity for a token pair",
      ],
      inputModes: ["text"],
      outputModes: ["text"],
    },
  ],
  supportsAuthenticatedExtendedCard: false,
};
