import { A2AClientToolProvider } from "./a2a-client-tools.js";
import {
  QUERY_TOOLS as HEDERA_QUERY_TOOLS,
  hederaToolkit,
} from "./hedera-tools.js";
import { getTokenAccountIdTool } from "./token-account-id-tool.js";
import { executeTransactionFromBase64Tool } from "./transaction.js";

export { isTransactionToolName } from "./hedera-tools.js";

const a2aProvider = new A2AClientToolProvider([
  process.env.LUMINA_AGENT_URL || "http://localhost:10003",
  process.env.NEURALX_AGENT_URL || "http://localhost:10004",
]);

export const TOOLS: any[] = [
  ...(hederaToolkit.getTools() as any[]),
  ...a2aProvider.tools,
  getTokenAccountIdTool,
  executeTransactionFromBase64Tool,
];

// Query-only tool set used by the queryTools graph node.
// Keep this in sync with routeModelOutput classification so query-routed tools exist here.
export const QUERY_TOOLS: any[] = [
  ...HEDERA_QUERY_TOOLS,
  ...a2aProvider.tools,
  getTokenAccountIdTool,
];
