import { v4 as uuidv4 } from "uuid";
import { ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/Stream";
import { useState, FormEvent } from "react";
import { Button } from "@hexio/ui/components/button";
import { Checkpoint, Message } from "@langchain/langgraph-sdk";
import { AssistantMessage, AssistantMessageLoading } from "./messages/ai";
import { HumanMessage } from "./messages/human";
import {
  DO_NOT_RENDER_ID_PREFIX,
  ensureToolCallsHaveResponses,
} from "@/lib/ensure-tool-responses";
import { LangGraphLogoSVG } from "../icons/langgraph";
import { Avatar, AvatarFallback } from "@hexio/ui/components/avatar";
import { ArrowDown, LoaderCircle, ChevronDown, SquarePen, Sparkles } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  selectThreadId,
  setThreadId,
} from "@/lib/store/features/thread/threadSlice";
import {
  selectHideToolCalls,
  setHideToolCalls,
} from "@/lib/store/features/ui/uiSlice";
import { selectWalletAccountId } from "@/lib/store/features/wallet/walletSlice";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import ThreadHistory from "./history";
import { toast } from "sonner";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@hexio/ui/components/sidebar";
import { Label } from "@hexio/ui/components/label";
import { Switch } from "@hexio/ui/components/switch";
import { AgentLogoSVG } from "../icons/agent";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@hexio/ui/components/tooltip";

function StickyToBottomContent(props: {
  content: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const context = useStickToBottomContext();
  return (
    <div
      ref={context.scrollRef}
      style={{ width: "100%", height: "100%" }}
      className={props.className}
    >
      <div ref={context.contentRef} className={props.contentClassName}>
        {props.content}
      </div>

      {props.footer}
    </div>
  );
}

function ScrollToBottom(props: { className?: string }) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;
  return (
    <Button
      variant="outline"
      className={props.className}
      onClick={() => scrollToBottom()}
    >
      <ArrowDown className="w-4 h-4" />
      <span>Scroll to bottom</span>
    </Button>
  );
}

function AgentSidebarTrigger() {
  const { toggleSidebar } = useSidebar();
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => toggleSidebar()}
            className="flex items-center justify-center hover:bg-accent p-1.5 rounded-md transition-colors"
          >
            <AgentLogoSVG width="24" height="24" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Agents</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ThreadHeader({ chatStarted }: { chatStarted: boolean }) {
  const dispatch = useAppDispatch();
  const { open } = useSidebar();

  return (
    <div className="flex flex-col sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
      <header className="flex md:grid md:grid-cols-3 items-center w-full h-16 px-2 md:px-4 relative justify-between">
        <div className="flex items-center gap-2 justify-start min-w-0 z-20">
          {!open && (
            <SidebarTrigger className="text-muted-foreground w-8 h-8" />
          )}
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 flex items-center justify-center pointer-events-none md:static md:translate-x-0 md:pointer-events-auto min-w-0 max-w-[50%] md:max-w-none">
          {chatStarted && (
            <div className="pointer-events-auto flex justify-center max-w-full md:max-w-none">
              <Button
                variant="ghost"
                className="justify-center whitespace-nowrap rounded-md hover:bg-accent hover:text-accent-foreground py-2 flex items-center gap-1 h-8 px-2 text-sm md:text-base font-medium w-auto max-w-full"
              >
                <span className="truncate max-w-[120px] xs:max-w-[160px] sm:max-w-[220px] md:max-w-[300px] lg:max-w-[400px] xl:max-w-[500px]">
                  Agent Chat
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground opacity-50 flex-shrink-0" />
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 z-20">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              dispatch(setThreadId(null));
            }}
          >
            <SquarePen className="w-5 h-5 text-muted-foreground" />
          </Button>
          <div className="md:hidden">
            <Avatar className="w-8 h-8 border border-border/50">
              <AvatarFallback className="bg-muted text-muted-foreground text-xs font-bold text-white bg-gradient-to-br from-primary/30 to-primary/60">
                L
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="hidden md:flex">
            <AgentSidebarTrigger />
          </div>
        </div>
      </header>
    </div>
  );
}

export function Thread() {
  const dispatch = useAppDispatch();
  const threadId = useAppSelector(selectThreadId);
  const hideToolCalls = useAppSelector(selectHideToolCalls);
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
                  {messages
                    .filter((m) => !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX))
                    .map((message, index) =>
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
                  {!chatStarted && (
                    <div className="flex flex-col items-start w-full max-w-3xl mx-auto px-4 md:px-0 mb-4">
                      <div className="flex items-center gap-2 text-primary dark:text-gray-300">
                        <Sparkles className="w-6 h-6 fill-current text-blue-500" />
                        <span className="text-xl font-medium tracking-tight">
                          Hello
                        </span>
                      </div>
                      <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-foreground/90 mt-1">
                        What would you like to do?
                      </h1>
                    </div>
                  )}

                  <ScrollToBottom className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 animate-in fade-in-0 zoom-in-95" />

                  <div className="bg-muted rounded-2xl border shadow-xs mx-auto mb-8 w-full max-w-3xl relative z-10">
                    <form
                      onSubmit={handleSubmit}
                      className="grid grid-rows-[1fr_auto] gap-2 max-w-3xl mx-auto"
                    >
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (
                            e.key === "Enter" &&
                            !e.shiftKey &&
                            !e.metaKey &&
                            !e.nativeEvent.isComposing
                          ) {
                            e.preventDefault();
                            const el = e.target as HTMLElement | undefined;
                            const form = el?.closest("form");
                            form?.requestSubmit();
                          }
                        }}
                        placeholder="Type your message..."
                        className="p-3.5 pb-0 border-none bg-transparent field-sizing-content shadow-none ring-0 outline-none focus:outline-none focus:ring-0 resize-none"
                      />

                      <div className="flex items-center justify-between p-2 pt-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="render-tool-calls"
                              checked={hideToolCalls ?? false}
                              onCheckedChange={(checked) =>
                                dispatch(setHideToolCalls(checked))
                              }
                            />
                            <Label
                              htmlFor="render-tool-calls"
                              className="text-sm text-gray-600"
                            >
                              Hide Tool Calls
                            </Label>
                          </div>
                        </div>
                        {stream.isLoading ? (
                          <Button key="stop" onClick={() => stream.stop()}>
                            <LoaderCircle className="w-4 h-4 animate-spin" />
                            Cancel
                          </Button>
                        ) : (
                          <Button
                            type="submit"
                            className="transition-all shadow-md"
                            disabled={isLoading || !input.trim()}
                          >
                            Send
                          </Button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              }
            />
          </StickToBottom>
        </div>
          </SidebarInset>
          <Sidebar
            side="right"
            className="custom-sidebar bg-zinc-100/95 dark:bg-zinc-950/95 backdrop-blur-sm border-l border-border/50 shadow-xl"
          >
            <SidebarHeader className="flex flex-col gap-2 p-3 border-b border-border/30 overflow-hidden">
              <div className="flex w-full min-w-0 flex-col gap-1 custom-scrollbar">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center p-2 mb-2">
                    <span className="font-bold text-lg">Agents</span>
                  </div>
                </div>
              </div>
            </SidebarHeader>
            <SidebarContent className="flex min-h-0 flex-1 flex-col gap-2 group-data-[collapsible=icon]:overflow-hidden custom-scrollbar px-2 py-4 overflow-hidden">
              <SidebarGroup className="relative flex w-full min-w-0 flex-col p-2 flex-1 min-h-0 h-full border-none shadow-none">
                <SidebarGroupContent className="w-full text-sm h-full min-h-0">
                  <div className="h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Recent Agents
                    </div>
                    <SidebarMenu className="flex w-full min-w-0 flex-col gap-1 space-y-0.5 pb-4 px-1">
                      {[
                        { name: "DeFi Analyst Analyst", stats: "124 trades, 98% SR (powered by erc8004)" },
                        { name: "NFT Sniper", stats: "45 assets, 2.1 ETH Vol (powered by erc8004)" },
                        { name: "Yield Farmer", stats: "4 active pools, 12% APY (powered by erc8004)" },
                        { name: "Token Launch Monitor", stats: "Tracking 12 projects (powered by erc8004)" }
                      ].map((agent, i) => (
                        <SidebarMenuItem key={i}>
                          <SidebarMenuButton className="inline-flex items-center text-sm font-medium w-full justify-start gap-3 px-3 py-2 h-auto text-neutral-600 dark:text-neutral-400 hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors bg-transparent shadow-none border-0">
                            <div className="flex items-center gap-3 w-full">
                              <div className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center">
                                <AgentLogoSVG width="20" height="20" className="text-muted-foreground" />
                              </div>
                              <div className="flex flex-col flex-1 overflow-hidden text-left">
                                <span className="font-medium text-sm text-foreground truncate">{agent.name}</span>
                                <span className="text-[10px] text-muted-foreground truncate opacity-80 mt-0.5">
                                  {agent.stats}
                                </span>
                              </div>
                            </div>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        </SidebarProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
