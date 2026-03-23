import { AccountId, Client } from "@hashgraph/sdk";

import {
  AgentMode,
  HederaLangchainToolkit,
  type Context,
} from "hedera-agent-kit";

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

// Classification for Hedera tools - mirrors client-agent's pattern
export const TRANSACTION_TOOL_NAMES = [
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

const TRANSACTION_TOOL_NAME_SET = new Set<string>(TRANSACTION_TOOL_NAMES);

export function isTransactionToolName(toolName: string): boolean {
  // Fail-safe: unknown tools default to "transaction" behavior so they still require approval.
  return TRANSACTION_TOOL_NAME_SET.has(toolName) || !toolName;
}

export const TOOLS: any[] = hederaToolkit.getTools() as any[];
