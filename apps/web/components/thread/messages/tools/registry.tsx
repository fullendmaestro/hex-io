import { DefaultToolResultRenderer } from "./default-tool-result";
import { TransactionToolCallRenderer } from "./transaction-tool-call-renderer";
import { TransferHbarToolCallRenderer } from "./transfer-hbar-tool-call";
import { ExecuteTransactionToolCallRenderer } from "./execute-transaction-tool-call";
import { SubAgentToolCallRenderer } from "./subagent-tool-call";
import { HEDERA_TRANSACTION_TOOL_NAMES } from "./transaction-tool-config";
import { ToolUIEntry } from "./types";

// Transaction tools use a unified renderer — ToolCall handles the result too
const TRANSACTION_TOOL_UI: ToolUIEntry = {
  ToolCall: TransactionToolCallRenderer,
  ToolResult: DefaultToolResultRenderer, // fallback; never used when isUnified=true
  isUnified: true,
};

// Transfer HBAR gets a dedicated, polished renderer
const TRANSFER_HBAR_TOOL_UI: ToolUIEntry = {
  ToolCall: TransferHbarToolCallRenderer,
  ToolResult: DefaultToolResultRenderer,
  isUnified: true,
};

// Execute Transaction from base64 uses minimal inline renderer
const EXECUTE_TRANSACTION_TOOL_UI: ToolUIEntry = {
  ToolCall: ExecuteTransactionToolCallRenderer,
  ToolResult: DefaultToolResultRenderer,
  isUnified: true,
};

// Remote A2A delegation uses a subagent-style indicator with input/output details
const SUBAGENT_TOOL_UI: ToolUIEntry = {
  ToolCall: SubAgentToolCallRenderer,
  ToolResult: DefaultToolResultRenderer,
  isUnified: true,
};

const TOOL_UI_BY_NAME: Record<string, ToolUIEntry> = {};

// Register every Hedera transaction tool with the default transaction renderer
for (const toolName of HEDERA_TRANSACTION_TOOL_NAMES) {
  TOOL_UI_BY_NAME[toolName] = TRANSACTION_TOOL_UI;
}

// Override: transfer_hbar_tool uses the dedicated component
TOOL_UI_BY_NAME["transfer_hbar_tool"] = TRANSFER_HBAR_TOOL_UI;
TOOL_UI_BY_NAME["execute_transaction_from_base64_tool"] =
  EXECUTE_TRANSACTION_TOOL_UI;
TOOL_UI_BY_NAME["ask_remote_agent_tool"] = SUBAGENT_TOOL_UI;

/**
 * Returns the ToolUIEntry for a given tool name, or null if the tool
 * has no registered UI component (unregistered tools are not rendered).
 */
export function getToolUI(toolName?: string): ToolUIEntry | null {
  if (!toolName) return null;
  return TOOL_UI_BY_NAME[toolName] ?? null;
}
