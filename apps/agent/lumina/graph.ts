import { AIMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import {
  MessagesAnnotation,
  StateGraph,
  Annotation,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { DynamicStructuredTool } from "@langchain/core/tools";

import { TOOLS, isTransactionToolName } from "./tools.js";
import { loadChatModel } from "../common/model.js";
import { SYSTEM_PROMPT_TEMPLATE } from "./prompts.js";

// Define the agent state extending MessagesAnnotation
// This allows us to track state throughout the agent's execution
export const AgentState = Annotation.Root({
  ...MessagesAnnotation.spec,
});

// Serialization utilities for transaction results
function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

function findBytes(value: unknown): Uint8Array | null {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) {
    const view = value as ArrayBufferView;
    return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
  }
  if (Array.isArray(value) && value.every((n) => typeof n === "number")) {
    return new Uint8Array(value as number[]);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return findBytes(parsed);
    } catch {
      return null;
    }
  }
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;

    // Node.js Buffer JSON shape: { type: "Buffer", data: number[] }
    if (
      record.type === "Buffer" &&
      Array.isArray(record.data) &&
      record.data.every((n) => typeof n === "number")
    ) {
      return new Uint8Array(record.data as number[]);
    }

    // Generic object with `data: number[]` payload.
    if (
      Array.isArray(record.data) &&
      record.data.every((n) => typeof n === "number")
    ) {
      return new Uint8Array(record.data as number[]);
    }

    if (typeof record.bytesBase64 === "string") {
      return new Uint8Array(Buffer.from(record.bytesBase64, "base64"));
    }
    if (typeof record.bytes === "string") {
      return new Uint8Array(Buffer.from(record.bytes, "base64"));
    }
    for (const nestedKey of [
      "observation",
      "output",
      "intermediateSteps",
      "bytes",
    ]) {
      if (nestedKey in record) {
        const found = findBytes(record[nestedKey]);
        if (found) return found;
      }
    }
  }
  return null;
}

function sanitizePayload(value: unknown): unknown {
  if (typeof value !== "object" || Array.isArray(value) || value === null) {
    return value;
  }
  const record = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(record)) {
    if (
      key === "bytes" ||
      key === "bytesBase64" ||
      key === "observation" ||
      key === "output" ||
      key === "intermediateSteps"
    ) {
      continue;
    }
    out[key] = v;
  }
  return out;
}

/**
 * Serialize transaction tool results to a structured format.
 * This allows the LLM to reason about transaction bytes without token bloat.
 */
function serializeTransactionResult(
  toolName: string,
  rawResult: unknown,
): string {
  const bytes = findBytes(rawResult);
  if (!bytes) {
    // No bytes found, return raw result as JSON
    return typeof rawResult === "string"
      ? rawResult
      : JSON.stringify(rawResult);
  }

  const serialized = {
    schema: "hex.transaction.request.v1",
    source: "lumina",
    toolName,
    encoding: "base64",
    bytesBase64: toBase64(bytes),
    byteLength: bytes.byteLength,
    summary: sanitizePayload(rawResult),
  };

  return JSON.stringify(serialized);
}

/**
 * Create wrapped tools that serialize transaction results.
 * Query tools return results as-is; transaction tools serialize to compact JSON.
 */
function createWrappedTools(rawTools: any[]): DynamicStructuredTool[] {
  return rawTools.map((tool) => {
    const toolName = typeof tool?.name === "string" ? tool.name : "hedera_tool";
    const isTransaction = isTransactionToolName(toolName);

    return new DynamicStructuredTool({
      name: toolName,
      description:
        typeof tool?.description === "string"
          ? tool.description
          : "Hedera tool",
      schema: tool?.schema,
      func: async (input) => {
        const rawResult = await tool.invoke(input);

        // Serialize transaction tool results; pass through query results
        if (isTransaction) {
          return serializeTransactionResult(toolName, rawResult);
        }

        return typeof rawResult === "string"
          ? rawResult
          : JSON.stringify(rawResult);
      },
    });
  });
}

const WRAPPED_TOOLS = createWrappedTools(TOOLS as any);
const TOOLS_NODE = new ToolNode(WRAPPED_TOOLS as any) as any;

// Define the function that calls the model
async function callModel(
  state: typeof AgentState.State,
  config: RunnableConfig,
): Promise<typeof MessagesAnnotation.Update> {
  /**
   * Call the LLM powering Lumina.
   * The model is bound with wrapped tools that serialize transaction results.
   */
  const model = (
    await loadChatModel(process.env.AZURE_OPENAI_MODEL_NAME ?? "gpt-5-mini")
  ).bindTools(WRAPPED_TOOLS as any);

  const response = await model.invoke([
    {
      role: "system",
      content: SYSTEM_PROMPT_TEMPLATE.replace(
        "{system_time}",
        new Date().toISOString(),
      ),
    },
    ...state.messages,
  ]);

  return { messages: [response] };
}

// Define the function that determines whether to continue or route to tools
function routeModelOutput(state: typeof AgentState.State): string {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];
  const toolCalls = (lastMessage as AIMessage)?.tool_calls ?? [];

  if (toolCalls.length > 0) {
    return "tools";
  }

  // Otherwise end the graph
  return "__end__";
}

// Define the graph
const workflow = new StateGraph(AgentState)
  // Define the nodes we use for the agent loop
  .addNode("callModel", callModel as any)
  .addNode("tools", TOOLS_NODE)
  // Set the entrypoint as `callModel`
  .addEdge("__start__", "callModel")
  .addConditionalEdges(
    // First, we define the edges' source node. We use `callModel`.
    "callModel",
    // Next, we pass in the function that will determine the sink node(s)
    routeModelOutput,
  )
  // Loop back to model after tool execution
  // This allows the model to see serialized transaction results and continue reasoning
  .addEdge("tools", "callModel");

/**
 * Compile the graph with continuous execution.
 *
 * When transaction tools are executed on Lumina:
 * 1. Tool returns bytes (uint8array) or structured result
 * 2. Result is serialized to hex.transaction.request.v1 schema
 * 3. Serialized result is passed to the model for continued reasoning
 * 4. Query tools are passed through as-is without serialization
 * 5. Graph continues until model decides to end (no more tool calls)
 *
 * This keeps the graph running continuously while optimizing token usage
 * by compressing binary transaction bytes into a structured JSON schema.
 */
export const graph = workflow.compile();
