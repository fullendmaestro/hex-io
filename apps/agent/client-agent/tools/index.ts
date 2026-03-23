import { A2AClientToolProvider } from "./a2a-client-tools.js";
import { hederaToolkit } from "./hedera-tools.js";

const a2aProvider = new A2AClientToolProvider([
  process.env.CURRENCY_AGENT_URL || "http://localhost:10000",
  process.env.WEATHER_AGENT_URL || "http://localhost:20000",
]);

export const TOOLS: any[] = [
  ...(hederaToolkit.getTools() as any[]),
  a2aProvider.tools,
];
