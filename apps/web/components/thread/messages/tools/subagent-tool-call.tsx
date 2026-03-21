"use client";

import { useMemo } from "react";
import { Bot, ChevronRight } from "lucide-react";
import { Button } from "@hexio/ui/components/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@hexio/ui/components/drawer";
import { ToolCallRendererProps } from "./types";
import { parseToolResultContent } from "./utils/content";

function toTitleCase(value: string): string {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function extractAgentName(
  toolCall: ToolCallRendererProps["toolCall"],
  rawResult: unknown,
): string {
  const args = (toolCall.args ?? {}) as Record<string, unknown>;
  const preferred = args.preferred_agent;
  if (typeof preferred === "string" && preferred.trim().length > 0) {
    return toTitleCase(preferred.trim());
  }

  if (typeof rawResult === "string") {
    const match = rawResult.match(/^\[([^\]]+)\]/);
    if (match?.[1]) return match[1].trim();
  }

  return "Remote Agent";
}

function sanitizeResultText(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return "No response yet.";
  return trimmed.replace(/^\[[^\]]+\]:\s*/, "");
}

export function SubAgentToolCallRenderer({
  toolCall,
  toolResult,
}: ToolCallRendererProps) {
  const args = (toolCall.args ?? {}) as Record<string, unknown>;
  const question = typeof args.question === "string" ? args.question : "";
  const context = typeof args.context === "string" ? args.context : "";
  const preferredAgent =
    typeof args.preferred_agent === "string" ? args.preferred_agent : "";

  const parsed = useMemo(
    () => parseToolResultContent(toolResult?.content),
    [toolResult?.content],
  );

  const outputText = useMemo(() => {
    if (!toolResult) return "Waiting for subagent response...";
    if (typeof parsed.parsedContent === "string") {
      return sanitizeResultText(parsed.parsedContent);
    }
    return sanitizeResultText(parsed.contentString);
  }, [parsed.contentString, parsed.parsedContent, toolResult]);

  const subAgentName = useMemo(
    () => extractAgentName(toolCall, parsed.parsedContent),
    [toolCall, parsed.parsedContent],
  );

  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <button
          type="button"
          className="w-full max-w-4xl rounded-lg border border-border/70 bg-card overflow-hidden"
        >
          <div className="flex w-full items-center justify-between gap-2 px-4 py-2 text-left transition-colors hover:bg-muted/40">
            <div className="flex items-center gap-2 min-w-0">
              <Bot size={14} className="shrink-0 text-foreground/70" />
              <span className="truncate text-[15px] font-semibold leading-[140%] tracking-[-0.2px] text-foreground/90">
                {subAgentName}
              </span>
            </div>
            <ChevronRight size={14} className="shrink-0 text-foreground/60" />
          </div>
        </button>
      </DrawerTrigger>
      <DrawerContent className="w-full sm:max-w-xl">
        <DrawerHeader>
          <DrawerTitle>{subAgentName}</DrawerTitle>
          <DrawerDescription>
            Delegated request details and remote subagent response.
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-2 text-sm">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/70">
            Input
          </h4>
          <p className="whitespace-pre-wrap text-foreground/90">
            {question || "No question payload provided."}
          </p>

          {context ? (
            <div className="mt-4">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/70">
                Context
              </h4>
              <p className="whitespace-pre-wrap text-foreground/80">{context}</p>
            </div>
          ) : null}

          {preferredAgent ? (
            <p className="mt-4 text-foreground/70">
              Preferred agent: {toTitleCase(preferredAgent)}
            </p>
          ) : null}

          <div className="mt-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/70">
              Output
            </h4>
            <p className="whitespace-pre-wrap text-foreground/90">{outputText}</p>
          </div>
        </div>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
