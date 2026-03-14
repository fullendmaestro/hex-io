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
  // If this tool has a unified renderer, skip standalone rendering —
  // it's already rendered inside the paired ToolCall component.
  const ui = getToolUI(message.name);
  if (ui.isUnified) return null;

  const Renderer = ui.ToolResult;
  return <>{Renderer({ message })}</>;
}
