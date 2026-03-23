import { ToolCallRendererProps } from "./types";
import { parseToolResultContent } from "./utils/content";

function toTitleCase(raw: string): string {
  return raw
    .replace(/_tool$/i, "")
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function summarizeResult(content: unknown): string {
  if (content == null) return "Running...";

  const parsed = parseToolResultContent(content);
  if (typeof parsed.parsedContent === "string") {
    const text = parsed.parsedContent.trim();
    return text || "Completed.";
  }

  if (typeof parsed.parsedContent === "object" && parsed.parsedContent) {
    const record = parsed.parsedContent as Record<string, unknown>;
    const status =
      typeof record.status === "string" && record.status.trim().length > 0
        ? record.status.trim()
        : null;
    const message =
      typeof record.message === "string" && record.message.trim().length > 0
        ? record.message.trim()
        : null;

    if (status && message) return `${status}: ${message}`;
    if (message) return message;
    if (status) return status;
  }

  const compact = parsed.contentString.replace(/\s+/g, " ").trim();
  return compact || "Completed.";
}

export function MinimalToolCallRenderer({
  toolCall,
  toolResult,
}: ToolCallRendererProps) {
  const actionLabel = toTitleCase(toolCall.name);
  const summary = summarizeResult(toolResult?.content);

  return (
    <div className="rounded-md border border-border/60 bg-background/70 px-3 py-2">
      <p className="text-sm text-foreground/90">{actionLabel}</p>
      <p className="mt-1 text-xs text-muted-foreground">{summary}</p>
    </div>
  );
}
