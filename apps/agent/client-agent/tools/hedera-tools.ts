import { AccountId, Client } from "@hashgraph/sdk";
import {
  AgentMode,
  HederaLangchainToolkit,
  type Context,
} from "hedera-agent-kit";
import { ClientFactory } from "@a2a-js/sdk/client";
import { DynamicStructuredTool } from "@langchain/core/tools";
import {
  type Message,
  type Part,
  type Task,
  type TaskStatusUpdateEvent,
} from "@a2a-js/sdk";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { RemoteAgent } from "../agents-config.js";

export const QUERY_TOOL_NAMES = [
  "a2a_discover_agent",
  "a2a_list_discovered_agents",
  "a2a_send_message",
  "get_token_account_id_tool",
  "ask_remote_agent_tool",
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

export const TRANSACTION_TOOL_NAMES = [
  "execute_transaction_from_base64_tool",
  "execute_remote_agent_transaction_tool",
  "transfer_hbar_tool",
  "approve_hbar_allowance_tool",
  "delete_hbar_allowance_tool",
  "delete_account_tool",
  "update_account_tool",
  "create_account_tool",
  "sign_schedule_transaction_tool",
  "schedule_delete_tool",
  "approve_token_allowance_tool",
  "transfer_hbar_with_allowance_tool",
  "delete_token_allowance_tool",
  "create_topic_tool",
  "submit_topic_message_tool",
  "delete_topic_tool",
  "update_topic_tool",
  "create_erc20_tool",
  "transfer_erc20_tool",
  "transfer_erc721_tool",
  "mint_erc721_tool",
  "create_erc721_tool",
  "create_fungible_token_tool",
  "mint_fungible_token_tool",
  "create_non_fungible_token_tool",
  "airdrop_fungible_token_tool",
  "mint_non_fungible_token_tool",
  "approve_nft_allowance_tool",
  "delete_non_fungible_token_allowance_tool",
  "update_token_tool",
  "dissociate_token_tool",
  "associate_token_tool",
  "transfer_non_fungible_token_with_allowance_tool",
  "transfer_non_fungible_token_tool",
  "transfer_fungible_token_with_allowance_tool",
] as const;

const QUERY_TOOL_NAME_SET = new Set<string>(QUERY_TOOL_NAMES);
const TRANSACTION_TOOL_NAME_SET = new Set<string>(TRANSACTION_TOOL_NAMES);

type HederaNetwork = "mainnet" | "testnet";

function getHederaNetwork(): HederaNetwork {
  return process.env.HEDERA_NETWORK === "mainnet" ? "mainnet" : "testnet";
}

function createHederaClient(network: HederaNetwork): Client {
  return network === "mainnet" ? Client.forMainnet() : Client.forTestnet();
}

function createToolkitContext(): Context {
  const context: Context = {
    mode: AgentMode.RETURN_BYTES,
  };

  const configuredAccountId = process.env.ACCOUNT_ID;
  if (configuredAccountId) {
    context.accountId = AccountId.fromString(configuredAccountId).toString();
  }

  return context;
}

export const hederaToolkit = new HederaLangchainToolkit({
  client: createHederaClient(getHederaNetwork()),
  configuration: {
    context: createToolkitContext(),
    plugins: [],
  },
});

function getToolName(tool: unknown): string | null {
  if (!tool || typeof tool !== "object") return null;
  const maybeName = (tool as { name?: unknown }).name;
  return typeof maybeName === "string" ? maybeName : null;
}

export function isTransactionToolName(toolName: string): boolean {
  // Fail-safe: unknown tools default to "transaction" behavior so they still require approval.
  return (
    TRANSACTION_TOOL_NAME_SET.has(toolName) ||
    !QUERY_TOOL_NAME_SET.has(toolName)
  );
}

export const QUERY_TOOLS: any[] = hederaToolkit.getTools().filter((tool) => {
  const name = getToolName(tool);
  return !!name && QUERY_TOOL_NAME_SET.has(name);
});
