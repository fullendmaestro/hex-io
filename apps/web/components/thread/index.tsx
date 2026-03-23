import { v4 as uuidv4 } from "uuid";
import { useEffect, useRef, useState, FormEvent } from "react";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/Stream";
import { Checkpoint, Message } from "@langchain/langgraph-sdk";
import { AssistantMessage, AssistantMessageLoading } from "./messages/ai";
import { HumanMessage } from "./messages/human";
import {
  DO_NOT_RENDER_ID_PREFIX,
  ensureToolCallsHaveResponses,
} from "@/lib/ensure-tool-responses";
import { useAppSelector } from "@/lib/store/hooks";
import { selectThreadId } from "@/lib/store/features/thread/threadSlice";
import { selectWalletAccountId } from "@/lib/store/features/wallet/walletSlice";
import { StickToBottom } from "use-stick-to-bottom";
import ThreadHistory from "./history";
import { toast } from "sonner";
import { SidebarProvider, SidebarInset } from "@hexio/ui/components/sidebar";

import { StickyToBottomContent } from "./sticky-to-bottom-content";
import { ScrollToBottom } from "./scroll-to-bottom";
import { ThreadHeader } from "./thread-header";
import { AgentSidebar } from "./agent-sidebar";
import { ThreadWelcome } from "./thread-welcome";
import { ThreadInput } from "./thread-input";

export function Thread() {
  const threadId = useAppSelector(selectThreadId);
  const walletAccountId = useAppSelector(selectWalletAccountId);

  const [input, setInput] = useState("");
  const [firstTokenReceived, setFirstTokenReceived] = useState(false);

  const stream = useStreamContext();
  const messages = stream.messages;
  const isLoading = stream.isLoading;

  const lastError = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!stream.error) {
      lastError.current = undefined;
      return;
    }
    try {
      const message = (stream.error as any).message;
      if (!message || lastError.current === message) {
        // Message has already been logged. do not modify ref, return early.
        return;
      }

      // Message is defined, and it has not been logged yet. Save it, and send the error
      lastError.current = message;
      toast.error("An error occurred. Please try again.", {
        description: (
          <p>
            <strong>Error:</strong> <code>{message}</code>
          </p>
        ),
        richColors: true,
        closeButton: true,
      });
    } catch {
      // no-op
    }
  }, [stream.error]);

  // TODO: this should be part of the useStream hook
  const prevMessageLength = useRef(0);
  useEffect(() => {
    if (
      messages.length !== prevMessageLength.current &&
      messages?.length &&
      messages[messages.length - 1]?.type === "ai"
    ) {
      setFirstTokenReceived(true);
    }

    prevMessageLength.current = messages.length;
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    setFirstTokenReceived(false);

    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: input,
    };

    const toolMessages = ensureToolCallsHaveResponses(stream.messages);
    stream.submit(
      {
        messages: [...toolMessages, newHumanMessage],
        walletAccountId: walletAccountId || "",
      },
      {
        streamMode: ["values"],
        optimisticValues: (prev) => ({
          ...prev,
          messages: [
            ...(prev.messages ?? []),
            ...toolMessages,
            newHumanMessage,
          ],
        }),
      },
    );

    setInput("");
  };

  const handleRegenerate = (
    parentCheckpoint: Checkpoint | null | undefined,
  ) => {
    // Do this so the loading state is correct
    prevMessageLength.current = prevMessageLength.current - 1;
    setFirstTokenReceived(false);
    stream.submit(undefined, {
      checkpoint: parentCheckpoint,
      streamMode: ["values"],
    });
  };

  const chatStarted = !!threadId || !!messages.length;
  const hasNoAIOrToolMessages = !messages.find(
    (m) => m.type === "ai" || m.type === "tool",
  );
  const renderMessages = messages.filter(
    (m) => !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX),
  );

  return (
    <SidebarProvider defaultOpen={true}>
      <ThreadHistory />
      <SidebarInset>
        <SidebarProvider defaultOpen={false}>
          <SidebarInset>
            <div className="flex flex-col min-w-0 h-dvh bg-background">
              <ThreadHeader chatStarted={chatStarted} />

              <StickToBottom className="relative flex-1 overflow-hidden">
                <StickyToBottomContent
                  className={cn(
                    "absolute px-4 inset-0 overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent",
                    !chatStarted && "flex flex-col items-stretch mt-[25vh]",
                    chatStarted && "grid grid-rows-[1fr_auto]",
                  )}
                  contentClassName="pt-8 pb-16  max-w-3xl mx-auto flex flex-col gap-4 w-full"
                  content={
                    <>
                      {renderMessages.map((message, index) =>
                        message.type === "human" ? (
                          <HumanMessage
                            key={message.id || `${message.type}-${index}`}
                            message={message}
                            isLoading={isLoading}
                          />
                        ) : (
                          <AssistantMessage
                            key={message.id || `${message.type}-${index}`}
                            message={message}
                            messages={renderMessages}
                            messageIndex={index}
                            isLoading={isLoading}
                            handleRegenerate={handleRegenerate}
                          />
                        ),
                      )}
                      {/* Special rendering case where there are no AI/tool messages, but there is an interrupt.
                    We need to render it outside of the messages list, since there are no messages to render */}
                      {hasNoAIOrToolMessages && !!stream.interrupt && (
                        <AssistantMessage
                          key="interrupt-msg"
                          message={undefined}
                          isLoading={isLoading}
                          handleRegenerate={handleRegenerate}
                        />
                      )}
                      {isLoading && !firstTokenReceived && (
                        <AssistantMessageLoading />
                      )}
                    </>
                  }
                  footer={
                    <div className="sticky flex flex-col w-full gap-8 bottom-0">
                      {!chatStarted && <ThreadWelcome />}

                      <ScrollToBottom className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 animate-in fade-in-0 zoom-in-95" />

                      <ThreadInput
                        input={input}
                        setInput={setInput}
                        handleSubmit={handleSubmit}
                        isLoading={isLoading}
                        stopStream={() => stream.stop()}
                      />
                    </div>
                  }
                />
              </StickToBottom>
            </div>
          </SidebarInset>
          <AgentSidebar />
        </SidebarProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
