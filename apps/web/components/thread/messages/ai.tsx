import { parsePartialJson } from "@langchain/core/output_parsers";
import { useStreamContext } from "@/providers/Stream";
import {
  AIMessage,
  Checkpoint,
  Message,
  ToolMessage,
} from "@langchain/langgraph-sdk";
import { getContentString } from "../utils";
import { BranchSwitcher, CommandBar } from "./shared";
import { MarkdownText } from "../markdown-text";
import { LoadExternalComponent } from "@langchain/langgraph-sdk/react-ui";
import { cn } from "@/lib/utils";
import { ToolCalls, ToolResult } from "./tool-calls";
import { getToolUI } from "./tools/registry";
import { MessageContentComplex } from "@langchain/core/messages";
import { Fragment } from "react/jsx-runtime";
import { useMemo } from "react";
import { isAgentInboxInterruptSchema } from "@/lib/agent-inbox-interrupt";
import { ThreadView } from "../agent-inbox";
import { useAppSelector } from "@/lib/store/hooks";
import { selectHideToolCalls } from "@/lib/store/features/ui/uiSlice";
import { GenericInterruptView } from "./generic-interrupt";

function CustomComponent({
  message,
  thread,
}: {
  message: Message;
  thread: ReturnType<typeof useStreamContext>;
}) {
  const { values } = useStreamContext();
  const customComponents = values.ui?.filter(
    (ui) => ui.metadata?.message_id === message.id,
  );

  if (!customComponents?.length) return null;
  return (
    <Fragment key={message.id}>
      {customComponents.map((customComponent) => (
        <LoadExternalComponent
          key={customComponent.id}
          // react-ui expects the base useStream return shape; our typed stream is a compatible superset.
          stream={thread as any}
          message={customComponent}
          meta={{ ui: customComponent }}
        />
      ))}
    </Fragment>
  );
}

function parseAnthropicStreamedToolCalls(
  content: MessageContentComplex[],
): AIMessage["tool_calls"] {
  const toolCallContents = content.filter((c) => c.type === "tool_use" && c.id);

  return toolCallContents.map((tc) => {
    const toolCall = tc as Record<string, any>;
    let json: Record<string, any> = {};
    if (toolCall?.input) {
      try {
        json = parsePartialJson(toolCall.input) ?? {};
      } catch {
        // Pass
      }
    }
    return {
      name: toolCall.name ?? "",
      id: toolCall.id ?? "",
      args: json,
      type: "tool_call",
    };
  });
}

function getMessageToolCalls(
  message: Message | undefined,
): AIMessage["tool_calls"] {
  if (!message || message.type !== "ai") return undefined;

  const directToolCalls =
    "tool_calls" in message
      ? (message.tool_calls as AIMessage["tool_calls"])
      : undefined;
  if (directToolCalls?.length) return directToolCalls;

  if (Array.isArray(message.content)) {
    const streamedToolCalls =
      parseAnthropicStreamedToolCalls(
        message.content as MessageContentComplex[],
      ) ?? [];
    if (streamedToolCalls.length) return streamedToolCalls;
  }

  return undefined;
}

function isToolOnlyAiMessage(message: Message | undefined): boolean {
  if (!message || message.type !== "ai") return false;
  if (getContentString(message.content ?? []).length > 0) return false;
  return !!getMessageToolCalls(message)?.length;
}

function hasPriorToolOnlyAiInRun(
  messages: Message[],
  messageIndex: number,
): boolean {
  for (let idx = messageIndex - 1; idx >= 0; idx -= 1) {
    const candidate = messages[idx];
    if (!candidate) continue;

    if (candidate.type === "human") return false;

    if (candidate.type === "ai") {
      if (getContentString(candidate.content ?? []).length > 0) return false;
      return isToolOnlyAiMessage(candidate);
    }
  }

  return false;
}

function collectToolCallsInRun(
  messages: Message[],
  messageIndex: number,
): AIMessage["tool_calls"] {
  const combined: NonNullable<AIMessage["tool_calls"]> = [];

  const currentToolCalls = getMessageToolCalls(messages[messageIndex]);
  if (currentToolCalls?.length) {
    combined.push(...currentToolCalls);
  }

  for (let idx = messageIndex + 1; idx < messages.length; idx += 1) {
    const candidate = messages[idx];
    if (!candidate) continue;

    if (candidate.type === "human") break;

    if (candidate.type === "ai") {
      if (getContentString(candidate.content ?? []).length > 0) break;

      const candidateToolCalls = getMessageToolCalls(candidate);
      if (candidateToolCalls?.length) {
        combined.push(...candidateToolCalls);
        continue;
      }

      break;
    }
  }

  return combined;
}

/**
 * Build a map from tool_call_id → ToolMessage for pairing tool calls with results.
 */
function buildToolResultsMap(messages: Message[]): Record<string, ToolMessage> {
  const map: Record<string, ToolMessage> = {};
  for (const msg of messages) {
    if (msg.type === "tool" && "tool_call_id" in msg && msg.tool_call_id) {
      map[msg.tool_call_id as string] = msg as ToolMessage;
    }
  }
  return map;
}

export function AssistantMessage({
  message,
  messages,
  messageIndex,
  isLoading,
  handleRegenerate,
}: {
  message: Message | undefined;
  messages?: Message[];
  messageIndex?: number;
  isLoading: boolean;
  handleRegenerate: (parentCheckpoint: Checkpoint | null | undefined) => void;
}) {
  const content = message?.content ?? [];
  const contentString = getContentString(content);
  const hideToolCalls = useAppSelector(selectHideToolCalls);

  const thread = useStreamContext();
  const isLastMessage =
    thread.messages[thread.messages.length - 1]?.id === message?.id;
  const hasNoAIOrToolMessages = !thread.messages.find(
    (m) => m.type === "ai" || m.type === "tool",
  );
  const meta = message ? thread.getMessagesMetadata(message) : undefined;
  const threadInterrupt = thread.interrupt;

  // Build tool results pairing map for unified rendering
  const toolResultsMap = useMemo(
    () => buildToolResultsMap(thread.messages),
    [thread.messages],
  );

  const parentCheckpoint = meta?.firstSeenState?.parent_checkpoint;
  const messageToolCalls = getMessageToolCalls(message);
  const hasToolCalls = !!messageToolCalls?.length;
  const toolCallsHaveContents =
    hasToolCalls &&
    messageToolCalls?.some((tc) => tc.args && Object.keys(tc.args).length > 0);
  const isToolResult = message?.type === "tool";

  const shouldMergeWithPreviousToolRun = useMemo(() => {
    if (!messages || messageIndex == null) return false;
    if (!isToolOnlyAiMessage(message)) return false;
    return hasPriorToolOnlyAiInRun(messages, messageIndex);
  }, [message, messageIndex, messages]);

  const groupedToolCalls = useMemo(() => {
    if (!messages || messageIndex == null) return messageToolCalls;
    if (!isToolOnlyAiMessage(message)) return messageToolCalls;
    return collectToolCallsInRun(messages, messageIndex);
  }, [message, messageIndex, messageToolCalls, messages]);

  const hasDisplayedToolCalls =
    !hideToolCalls &&
    !shouldMergeWithPreviousToolRun &&
    !!groupedToolCalls?.length;

  // Check if any tool call on this message has a registered UI renderer.
  // If so, the tool's own component handles the interrupt-resume flow,
  // so we suppress the generic interrupt view.
  const hasRegisteredToolUI = useMemo(() => {
    const toolCalls = groupedToolCalls;
    return toolCalls?.some((tc) => getToolUI(tc.name) !== null) ?? false;
  }, [groupedToolCalls]);

  if (isToolResult && hideToolCalls) {
    return null;
  }

  // Consecutive tool-only AI messages are merged into the first "Working" block.
  if (
    !hideToolCalls &&
    !isToolResult &&
    shouldMergeWithPreviousToolRun &&
    contentString.length === 0
  ) {
    return null;
  }

  return (
    <div className="flex items-start mr-auto gap-2 group">
      {isToolResult ? (
        <ToolResult message={message} />
      ) : (
        <div className="flex flex-col gap-2">
          {contentString.length > 0 && (
            <div className="py-1">
              <MarkdownText>{contentString}</MarkdownText>
            </div>
          )}

          {!hideToolCalls && (
            <>
              {(hasToolCalls && toolCallsHaveContents && (
                <ToolCalls
                  toolCalls={groupedToolCalls}
                  toolResults={toolResultsMap}
                />
              )) ||
                (hasToolCalls && (
                  <ToolCalls
                    toolCalls={groupedToolCalls}
                    toolResults={toolResultsMap}
                  />
                ))}
            </>
          )}

          {message && <CustomComponent message={message} thread={thread} />}
          {isAgentInboxInterruptSchema(threadInterrupt?.value) &&
            (isLastMessage || hasNoAIOrToolMessages) && (
              <ThreadView interrupt={threadInterrupt.value} />
            )}
          {threadInterrupt?.value &&
          !isAgentInboxInterruptSchema(threadInterrupt.value) &&
          !hasRegisteredToolUI &&
          isLastMessage ? (
            <GenericInterruptView interrupt={threadInterrupt.value} />
          ) : null}
          <div
            className={cn(
              "flex gap-2 items-center mr-auto transition-opacity",
              "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
            )}
          >
            <BranchSwitcher
              branch={meta?.branch}
              branchOptions={meta?.branchOptions}
              onSelect={(branch) => thread.setBranch(branch)}
              isLoading={isLoading}
            />
            <CommandBar
              content={contentString}
              isLoading={isLoading}
              isAiMessage={true}
              showCopyAction={!hasDisplayedToolCalls}
              showRefreshAction={!hasDisplayedToolCalls}
              handleRegenerate={() => handleRegenerate(parentCheckpoint)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function AssistantMessageLoading() {
  return (
    <div className="flex items-start mr-auto gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-1">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-foreground animate-[pulse_1.4s_ease-in-out_infinite]"></span>
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-foreground animate-[pulse_1.4s_ease-in-out_0.2s_infinite]"></span>
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-foreground animate-[pulse_1.4s_ease-in-out_0.4s_infinite]"></span>
      </div>
    </div>
  );
}
