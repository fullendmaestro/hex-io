import { DefaultToolCallRenderer } from "./default-tool-call";
import { DefaultToolResultRenderer } from "./default-tool-result";
import { TransactionToolCallRenderer } from "./transaction-tool-call-renderer";
import { TRANSACTION_TOOL_CONFIGS } from "./transaction-tool-config";
import { ToolUIEntry } from "./types";

const DEFAULT_TOOL_UI: ToolUIEntry = {
  ToolCall: DefaultToolCallRenderer,
  ToolResult: DefaultToolResultRenderer,
};

// Transaction tools use a unified renderer — ToolCall handles the result too
const TRANSACTION_TOOL_UI: ToolUIEntry = {
  ToolCall: TransactionToolCallRenderer,
  ToolResult: DefaultToolResultRenderer, // fallback; never used when isUnified=true
  isUnified: true,
};

const TOOL_UI_BY_NAME: Record<string, ToolUIEntry> = {};

// Register every transaction tool from the config map
for (const toolName of Object.keys(TRANSACTION_TOOL_CONFIGS)) {
  TOOL_UI_BY_NAME[toolName] = TRANSACTION_TOOL_UI;
}

export function getToolUI(toolName?: string): ToolUIEntry {
  if (!toolName) return DEFAULT_TOOL_UI;
  return TOOL_UI_BY_NAME[toolName] ?? DEFAULT_TOOL_UI;
}
