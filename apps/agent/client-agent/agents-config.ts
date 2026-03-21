/**
 * A2A Agent Configuration
 * Defines remote agents available for delegation, their URLs, and specializations.
 */

export type AgentSpecialization =
  | "defi_research"
  | "market_analysis"
  | "portfolio_management"
  | "risk_assessment"
  | "governance";

export interface RemoteAgent {
  /** Unique identifier for the agent */
  id: string;
  /** Display name */
  name: string;
  /** A2A server URL */
  url: string;
  /** Specialization(s) */
  specializations: AgentSpecialization[];
  /** Description of what this agent does */
  description: string;
  /** Whether this agent is enabled */
  enabled: boolean;
}

/**
 * Registry of all available remote A2A agents.
 * Add new agents here when they become available.
 */
export const REMOTE_AGENTS: Record<string, RemoteAgent> = {
  lumina: {
    id: "lumina",
    name: "Lumina",
    url: process.env.LUMINA_AGENT_URL ?? "http://localhost:10003",
    specializations: ["defi_research", "market_analysis", "risk_assessment"],
    description:
      "DeFi protocol specialist - handles research, tokenomics, liquidity analysis, and market context",
    enabled: true,
  },
  // Add more agents here in the future
  // arbitrageur: {
  //   id: "arbitrageur",
  //   name: "Arbitrageur",
  //   url: process.env.ARBITRAGEUR_AGENT_URL ?? "http://localhost:10004",
  //   specializations: ["market_analysis", "portfolio_management"],
  //   description: "Trading specialist - identifies opportunities and optimizes portfolios",
  //   enabled: true,
  // },
};

/**
 * Mapping of query keywords/patterns to the best agent for handling them.
 * Used to intelligently route requests to specialized agents.
 */
export const SPECIALIZATION_KEYWORDS: Record<AgentSpecialization, string[]> = {
  defi_research: [
    "protocol",
    "tokenomics",
    "liquidity",
    "apy",
    "yield",
    "smart contract",
    "defi",
  ],
  market_analysis: [
    "price",
    "market",
    "trading",
    "volume",
    "trends",
    "momentum",
  ],
  portfolio_management: [
    "portfolio",
    "allocation",
    "rebalance",
    "diversify",
    "weights",
  ],
  risk_assessment: [
    "risk",
    "volatility",
    "drawdown",
    "slippage",
    "impermanent loss",
    "liquidation",
  ],
  governance: ["vote", "proposal", "governance", "dao", "snapshot", "quorum"],
};

/**
 * Get enabled remote agents filtered by specialization.
 */
export function getAgentsBySpecialization(
  specialization: AgentSpecialization,
): RemoteAgent[] {
  return Object.values(REMOTE_AGENTS).filter(
    (agent) => agent.enabled && agent.specializations.includes(specialization),
  );
}

/**
 * Get the best agent for a given query by matching keywords.
 * Returns the first enabled agent that matches the query specialization.
 */
export function getBestAgentForQuery(query: string): RemoteAgent | null {
  const lowerQuery = query.toLowerCase();

  for (const [specialization, keywords] of Object.entries(
    SPECIALIZATION_KEYWORDS,
  )) {
    const matched = keywords.some((keyword) => lowerQuery.includes(keyword));

    if (matched) {
      const agents = getAgentsBySpecialization(
        specialization as AgentSpecialization,
      );
      return agents[0] ?? null;
    }
  }

  // Default to Lumina if no specific match
  const luminaAgent = REMOTE_AGENTS.lumina;
  return luminaAgent?.enabled ? luminaAgent : null;
}

/**
 * Get all enabled remote agents.
 */
export function getEnabledRemoteAgents(): RemoteAgent[] {
  return Object.values(REMOTE_AGENTS).filter((agent) => agent.enabled);
}
