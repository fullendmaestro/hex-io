import { DefaultToolResultRenderer } from "./default-tool-result";
import { TransactionToolCallRenderer } from "./transaction-tool-call-renderer";
import { TransferHbarToolCallRenderer } from "./transfer-hbar-tool-call";
import { TRANSACTION_TOOL_CONFIGS } from "./transaction-tool-config";
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

const TOOL_UI_BY_NAME: Record<string, ToolUIEntry> = {};

// Register every transaction tool from the config map
for (const toolName of Object.keys(TRANSACTION_TOOL_CONFIGS)) {
  TOOL_UI_BY_NAME[toolName] = TRANSACTION_TOOL_UI;
}

// Override: transfer_hbar_tool uses the dedicated component
TOOL_UI_BY_NAME["transfer_hbar_tool"] = TRANSFER_HBAR_TOOL_UI;

/**
 * Returns the ToolUIEntry for a given tool name, or null if the tool
 * has no registered UI component (unregistered tools are not rendered).
 */
export function getToolUI(toolName?: string): ToolUIEntry | null {
  if (!toolName) return null;
  return TOOL_UI_BY_NAME[toolName] ?? null;
}
