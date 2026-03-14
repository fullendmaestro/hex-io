import { AIMessage, ToolMessage } from "@langchain/langgraph-sdk";
import { ReactNode } from "react";

export type ToolCall = NonNullable<AIMessage["tool_calls"]>[number];

export type ToolCallRendererProps = {
  toolCall: ToolCall;
  /** Paired tool result message (if available). Used by unified renderers. */
  toolResult?: ToolMessage;
};

export type ToolResultRendererProps = {
  message: ToolMessage;
};

export type ToolUIEntry = {
  ToolCall: (props: ToolCallRendererProps) => ReactNode;
  ToolResult: (props: ToolResultRendererProps) => ReactNode;
  /** If true, the ToolCall renderer handles the result too — skip standalone ToolResult rendering. */
  isUnified?: boolean;
};
