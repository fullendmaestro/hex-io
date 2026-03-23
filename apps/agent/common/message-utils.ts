import { AIMessage, BaseMessage, ToolMessage } from "@langchain/core/messages";

export function contentToText(content: unknown): string {
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (
          typeof part === "object" &&
          part !== null &&
          "text" in part &&
          typeof (part as { text?: unknown }).text === "string"
        ) {
          return (part as { text: string }).text;
        }
        return "";
      })
      .join("\n")
      .trim();
  }

  return JSON.stringify(content ?? {});
}

export function getLastMessageText(messages: BaseMessage[]): string {
  if (!messages.length) return "";

  const toolMessages = messages.filter(
    (m): m is ToolMessage => m._getType() === "tool",
  );

  const preferred =
    toolMessages[toolMessages.length - 1] || messages[messages.length - 1];
  return contentToText((preferred as AIMessage | ToolMessage).content);
}
