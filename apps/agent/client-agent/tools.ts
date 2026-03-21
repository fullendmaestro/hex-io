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
import {
  getEnabledRemoteAgents,
  getBestAgentForQuery,
  type RemoteAgent,
} from "./agents-config.js";

export const QUERY_TOOL_NAMES = [
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

// Cache for A2A client connections (keyed by agent ID)
const a2aClientCache = new Map<
  string,
  Promise<Awaited<ReturnType<ClientFactory["createFromUrl"]>>>
>();

/**
 * Get or create an A2A client for a specific remote agent.
 */
async function getA2AClient(agent: RemoteAgent) {
  if (!a2aClientCache.has(agent.id)) {
    const factory = new ClientFactory();
    a2aClientCache.set(agent.id, factory.createFromUrl(agent.url));
  }
  return a2aClientCache.get(agent.id)!;
}

function partsToText(parts: Part[] | undefined): string {
  if (!parts || parts.length === 0) return "";

  return parts
    .map((part) => {
      if (part.kind !== "text") return "";
      return typeof part.text === "string" ? part.text : "";
    })
    .filter(Boolean)
    .join("\n")
    .trim();
}

function getTextFromTask(task: Task): string {
  const statusMessage = task.status?.message;
  if (statusMessage?.kind === "message") {
    const statusText = partsToText(statusMessage.parts);
    if (statusText) return statusText;
  }

  const lastHistoryMessage = [...(task.history ?? [])]
    .reverse()
    .find((entry) => entry.kind === "message" && entry.role === "agent");

  if (lastHistoryMessage && lastHistoryMessage.kind === "message") {
    const historyText = partsToText(lastHistoryMessage.parts);
    if (historyText) return historyText;
  }

  return `Agent completed task ${task.id} with state ${task.status?.state ?? "unknown"}.`;
}

/**
 * Creates a tool that delegates queries to a remote A2A agent.
 * The tool intelligently routes to the best available agent based on the query content.
 */
const REMOTE_AGENT_DELEGATION_TOOL = new DynamicStructuredTool({
  name: "ask_remote_agent_tool",
  description:
    "Delegate specialized queries to remote A2A agents: DeFi research (Lumina), market analysis, risk assessment, and more. The system automatically routes to the best agent for your question.",
  schema: z.object({
    question: z
      .string()
      .min(1)
      .describe("The exact question to delegate to a remote specialist agent."),
    context: z
      .string()
      .optional()
      .describe(
        "Optional additional context to help the remote agent understand your question better.",
      ),
    preferred_agent: z
      .string()
      .optional()
      .describe(
        "Optionally specify a preferred agent ID (e.g., 'lumina'). If not provided, the best agent is auto-selected.",
      ),
  }),
  func: async ({ question, context, preferred_agent }) => {
    try {
      // Determine which agent to use
      let targetAgent = preferred_agent
        ? Object.values(getEnabledRemoteAgents()).find(
            (a) => a.id === preferred_agent,
          )
        : null;

      if (!targetAgent) {
        targetAgent = getBestAgentForQuery(question);
      }

      if (!targetAgent) {
        return "No remote agents are available for this query.";
      }

      // Prepare the message
      const userText = context
        ? `${question}\n\nAdditional context:\n${context}`
        : question;

      // Send to the remote agent
      const client = await getA2AClient(targetAgent);
      const response = await client.sendMessage({
        message: {
          kind: "message",
          messageId: uuidv4(),
          role: "user",
          parts: [{ kind: "text", text: userText }],
        },
      });

      // Process the response
      if (response.kind === "message") {
        const responseText =
          partsToText(response.parts) ||
          `${targetAgent.name} returned an empty response.`;
        return `[${targetAgent.name}]: ${responseText}`;
      }

      if (response.kind === "task") {
        return `[${targetAgent.name}] (task): ${getTextFromTask(response)}`;
      }

      return `${targetAgent.name} returned an unsupported response type.`;
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      return `Failed to reach remote agents: ${reason}`;
    }
  },
});

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

const hederaToolkit = new HederaLangchainToolkit({
  client: createHederaClient(getHederaNetwork()),
  configuration: {
    context: createToolkitContext(),
    plugins: [],
  },
});

const TOOLKIT_TOOLS: any[] = [
  ...(hederaToolkit.getTools() as any[]),
  REMOTE_AGENT_DELEGATION_TOOL,
];

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

export const QUERY_TOOLS: any[] = TOOLKIT_TOOLS.filter((tool) => {
  const name = getToolName(tool);
  return !!name && QUERY_TOOL_NAME_SET.has(name);
});

export const TOOLS: any[] = TOOLKIT_TOOLS;
