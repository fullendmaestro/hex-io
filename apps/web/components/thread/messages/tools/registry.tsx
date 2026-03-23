import { DefaultToolResultRenderer } from "./default-tool-result";
import { MinimalToolCallRenderer } from "./minimal-tool-call";
import { TransactionToolCallRenderer } from "./transaction-tool-call-renderer";
import { TransferHbarToolCallRenderer } from "./transfer-hbar-tool-call";
import { ExecuteTransactionToolCallRenderer } from "./execute-transaction-tool-call";
import { SubAgentToolCallRenderer } from "./subagent-tool-call";
import { GetHbarBalanceToolCallRenderer } from "./get-hbar-balance-tool-call";
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

const GET_HBAR_BALANCE_TOOL_UI: ToolUIEntry = {
  ToolCall: GetHbarBalanceToolCallRenderer,
  ToolResult: DefaultToolResultRenderer,
  isUnified: true,
};

// Lightweight renderer used for simple query/intent tools.
const MINIMAL_TOOL_UI: ToolUIEntry = {
  ToolCall: MinimalToolCallRenderer,
  ToolResult: DefaultToolResultRenderer,
  isUnified: true,
};

export const CLIENT_AGENT_TOOL_TITLE_BY_NAME: Record<string, string> = {
  // A2A tools
  a2a_discover_agent: "Discovering Agent",
  a2a_list_discovered_agents: "Listing Discovered Agents",
  a2a_send_message: "Sending Message To Agent",
  ask_remote_agent_tool: "Asking Remote Agent",

  // Utility tools
  get_token_account_id_tool: "Fetching Token Account ID",
  execute_transaction_from_base64_tool: "Preparing Transaction",
  execute_remote_agent_transaction_tool: "Executing Remote Agent Transaction",

  // Query tools
  get_hbar_balance_query_tool: "Fetching HBAR Balance",
  get_account_query_tool: "Fetching Account Info",
  get_account_token_balances_query_tool: "Fetching Account Token Balances",
  get_topic_messages_query_tool: "Fetching Topic Messages",
  get_topic_info_query_tool: "Fetching Topic Info",
  get_contract_info_query_tool: "Fetching Contract Info",
  get_exchange_rate_tool: "Fetching Exchange Rate",
  get_token_info_query_tool: "Fetching Token Info",
  get_pending_airdrop_tool: "Fetching Pending Airdrops",
  get_transaction_record_query_tool: "Fetching Transaction Record",

  // Transaction tools
  transfer_hbar_tool: "Transferring HBAR",
  approve_hbar_allowance_tool: "Approving HBAR Allowance",
  delete_hbar_allowance_tool: "Deleting HBAR Allowance",
  delete_account_tool: "Deleting Account",
  update_account_tool: "Updating Account",
  create_account_tool: "Creating Account",
  sign_schedule_transaction_tool: "Signing Scheduled Transaction",
  schedule_delete_tool: "Deleting Scheduled Transaction",
  approve_token_allowance_tool: "Approving Token Allowance",
  transfer_hbar_with_allowance_tool: "Transferring HBAR With Allowance",
  delete_token_allowance_tool: "Deleting Token Allowance",
  create_topic_tool: "Creating Topic",
  submit_topic_message_tool: "Submitting Topic Message",
  delete_topic_tool: "Deleting Topic",
  update_topic_tool: "Updating Topic",
  create_erc20_tool: "Creating ERC20 Token",
  transfer_erc20_tool: "Transferring ERC20",
  transfer_erc721_tool: "Transferring ERC721",
  mint_erc721_tool: "Minting ERC721",
  create_erc721_tool: "Creating ERC721 Token",
  create_fungible_token_tool: "Creating Fungible Token",
  mint_fungible_token_tool: "Minting Fungible Token",
  create_non_fungible_token_tool: "Creating Non Fungible Token",
  airdrop_fungible_token_tool: "Airdropping Fungible Token",
  mint_non_fungible_token_tool: "Minting Non Fungible Token",
  approve_nft_allowance_tool: "Approving NFT Allowance",
  delete_non_fungible_token_allowance_tool: "Deleting NFT Allowance",
  update_token_tool: "Updating Token",
  dissociate_token_tool: "Dissociating Token",
  associate_token_tool: "Associating Token",
  transfer_non_fungible_token_with_allowance_tool:
    "Transferring NFT With Allowance",
  transfer_non_fungible_token_tool: "Transferring NFT",
  transfer_fungible_token_with_allowance_tool:
    "Transferring Fungible Token With Allowance",
};

const MINIMAL_CLIENT_AGENT_TOOL_NAMES = [
  "a2a_discover_agent",
  "a2a_list_discovered_agents",
  "a2a_send_message",
  "get_token_account_id_tool",
  "get_hbar_balance_query_tool",
  "get_account_query_tool",
  "get_account_token_balances_query_tool",
  "get_topic_messages_query_tool",
  "get_topic_info_query_tool",
  "get_contract_info_query_tool",
  "get_exchange_rate_tool",
  "get_token_info_query_tool",
  "get_pending_airdrop_tool",
  "get_transaction_record_query_tool",
] as const;

const TOOL_UI_BY_NAME: Record<string, ToolUIEntry> = {};

// Register every Hedera transaction tool with the default transaction renderer
for (const toolName of HEDERA_TRANSACTION_TOOL_NAMES) {
  TOOL_UI_BY_NAME[toolName] = TRANSACTION_TOOL_UI;
}

for (const toolName of MINIMAL_CLIENT_AGENT_TOOL_NAMES) {
  TOOL_UI_BY_NAME[toolName] = MINIMAL_TOOL_UI;
}

// Override: transfer_hbar_tool uses the dedicated component
TOOL_UI_BY_NAME["transfer_hbar_tool"] = TRANSFER_HBAR_TOOL_UI;
TOOL_UI_BY_NAME["execute_transaction_from_base64_tool"] =
  EXECUTE_TRANSACTION_TOOL_UI;
TOOL_UI_BY_NAME["ask_remote_agent_tool"] = SUBAGENT_TOOL_UI;
TOOL_UI_BY_NAME["get_hbar_balance_query_tool"] = GET_HBAR_BALANCE_TOOL_UI;

/**
 * Returns the ToolUIEntry for a given tool name, or null if the tool
 * has no registered UI component (unregistered tools are not rendered).
 */
export function getToolUI(toolName?: string): ToolUIEntry | null {
  if (!toolName) return null;
  return TOOL_UI_BY_NAME[toolName] ?? null;
}
