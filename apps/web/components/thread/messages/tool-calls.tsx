import { AIMessage, ToolMessage } from "@langchain/langgraph-sdk";
import { CLIENT_AGENT_TOOL_TITLE_BY_NAME, getToolUI } from "./tools/registry";
import {
  ChainOfTool,
  ChainOfToolContent,
  ChainOfToolHeader,
  ChainOfToolStep,
  type ChainOfToolStepProps,
} from "@/components/ai/chain-of-thought";
import type { ToolUIEntry } from "./tools/types";

type ToolResponseState = "pending" | "success" | "error";

const TOOL_CALL_NAME_TO_CHAIN_OF_TOOL_TITLE = CLIENT_AGENT_TOOL_TITLE_BY_NAME;

const TOOL_RESPONSE_STATE_TO_CHAIN_OF_TOOL_STEP_STATUS: Record<
  ToolResponseState,
  ChainOfToolStepProps["status"]
> = {
  pending: "active",
  success: "complete",
  error: "complete",
};

const TOOL_CALL_NAME_TO_CHAIN_OF_TOOL_COMPONENT: Partial<
  Record<string, ToolUIEntry["ToolCall"]>
> = Object.fromEntries(
  Object.keys(TOOL_CALL_NAME_TO_CHAIN_OF_TOOL_TITLE)
    .map((toolName) => [toolName, getToolUI(toolName)?.ToolCall] as const)
    .filter((entry): entry is readonly [string, ToolUIEntry["ToolCall"]] =>
      Boolean(entry[1]),
    ),
);

function toToolTitle(toolName: string): string {
  if (TOOL_CALL_NAME_TO_CHAIN_OF_TOOL_TITLE[toolName]) {
    return TOOL_CALL_NAME_TO_CHAIN_OF_TOOL_TITLE[toolName];
  }

  return toolName
    .replace(/[_-]+/g, " ")
    .replace(/\btool\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function inferToolResponseState(toolResult?: ToolMessage): ToolResponseState {
  if (!toolResult) return "pending";

  const contentText =
    typeof toolResult.content === "string"
      ? toolResult.content
      : JSON.stringify(toolResult.content ?? "");
  const normalized = contentText.toLowerCase();

  if (
    normalized.includes("error") ||
    normalized.includes("failed") ||
    normalized.includes("exception")
  ) {
    return "error";
  }

  return "success";
}

export function ToolCalls({
  toolCalls,
  toolResults,
}: {
  toolCalls: AIMessage["tool_calls"];
  /** Map of tool_call_id → paired ToolMessage result */
  toolResults?: Record<string, ToolMessage>;
}) {
  if (!toolCalls || toolCalls.length === 0) return null;

  const renderableToolCalls = toolCalls
    .map((toolCall, idx) => {
      const ui = getToolUI(toolCall.name);
      if (!ui) return null;

      const pairedResult = toolCall.id ? toolResults?.[toolCall.id] : undefined;
      const renderer =
        TOOL_CALL_NAME_TO_CHAIN_OF_TOOL_COMPONENT[toolCall.name] ?? ui.ToolCall;
      const toolResponseState = inferToolResponseState(pairedResult);

      return {
        idx,
        pairedResult,
        renderer,
        status:
          TOOL_RESPONSE_STATE_TO_CHAIN_OF_TOOL_STEP_STATUS[toolResponseState],
        toolCall,
      };
    })
    .filter((toolCall): toolCall is NonNullable<typeof toolCall> => !!toolCall);

  if (renderableToolCalls.length === 0) return null;

  return (
    <ChainOfTool defaultOpen>
      <ChainOfToolHeader>Working</ChainOfToolHeader>
      <ChainOfToolContent className="w-full max-w-4xl">
        {renderableToolCalls.map(
          ({ idx, pairedResult, renderer: Renderer, status, toolCall }) => (
            <ChainOfToolStep
              key={toolCall.id || idx}
              label={toToolTitle(toolCall.name)}
              status={status}
            >
              <Renderer toolCall={toolCall} toolResult={pairedResult} />
            </ChainOfToolStep>
          ),
        )}
      </ChainOfToolContent>
    </ChainOfTool>
  );
}

export function ToolResult({ message }: { message: ToolMessage }) {
  const ui = getToolUI(message.name);
  // Skip tools with no registered UI or unified renderers
  if (!ui || ui.isUnified) return null;

  const Renderer = ui.ToolResult;
  return <>{Renderer({ message })}</>;
}
