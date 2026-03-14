import { AIMessage, ToolMessage } from "@langchain/langgraph-sdk";
import { getToolUI } from "./tools/registry";

export function ToolCalls({
  toolCalls,
  toolResults,
}: {
  toolCalls: AIMessage["tool_calls"];
  /** Map of tool_call_id → paired ToolMessage result */
  toolResults?: Record<string, ToolMessage>;
}) {
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="space-y-4 w-full max-w-4xl">
      {toolCalls.map((toolCall, idx) => {
        const ui = getToolUI(toolCall.name);
        // Skip tool calls that have no registered UI component
        if (!ui) return null;

        const pairedResult = toolCall.id
          ? toolResults?.[toolCall.id]
          : undefined;
        const Renderer = ui.ToolCall;
        return (
          <Renderer
            key={toolCall.id || idx}
            toolCall={toolCall}
            toolResult={pairedResult}
          />
        );
      })}
    </div>
  );
}

export function ToolResult({ message }: { message: ToolMessage }) {
  const ui = getToolUI(message.name);
  // Skip tools with no registered UI or unified renderers
  if (!ui || ui.isUnified) return null;

  const Renderer = ui.ToolResult;
  return <>{Renderer({ message })}</>;
}
