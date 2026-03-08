import { Button } from "@hexio/ui/components/button";
import { useThreads } from "@/providers/Thread";
import { Thread } from "@langchain/langgraph-sdk";
import { useEffect } from "react";

import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  selectThreadId,
  setThreadId,
} from "@/lib/store/features/thread/threadSlice";
import { Skeleton } from "@hexio/ui/components/skeleton";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@hexio/ui/components/sidebar";
import { PanelLeftClose, SquarePen, Search } from "lucide-react";
import { ThreadItem } from "./thread-item";
import { UserNav } from "./user-nav";

function ThreadHistoryLoading() {
  return (
    <SidebarGroup className="flex-1 flex flex-col w-full gap-2 items-start justify-start px-3">
      {Array.from({ length: 15 }).map((_, i) => (
        <Skeleton
          key={`skeleton-${i}`}
          className="w-full h-[60px] rounded-lg"
        />
      ))}
    </SidebarGroup>
  );
}

function ThreadList({
  threads,
  onThreadClick,
}: {
  threads: Thread[];
  onThreadClick?: (threadId: string) => void;
}) {
  const dispatch = useAppDispatch();
  const threadId = useAppSelector(selectThreadId);

  const handleThreadClick = (selectedThreadId: string) => {
    onThreadClick?.(selectedThreadId);
    if (selectedThreadId === threadId) return;
    dispatch(setThreadId(selectedThreadId));
  };

  return (
    <SidebarGroup className="relative flex w-full min-w-0 flex-col p-2 flex-1 min-h-0 h-full border-none shadow-none">
      <SidebarGroupContent className="w-full text-sm h-full min-h-0">
        <div className="h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Chats
          </div>
          <SidebarMenu className="flex w-full min-w-0 flex-col gap-1 space-y-0.5 pb-4 px-1">
            {threads.map((thread) => (
              <ThreadItem
                key={thread.thread_id}
                thread={thread}
                isActive={thread.thread_id === threadId}
                onClick={handleThreadClick}
              />
            ))}
          </SidebarMenu>
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export default function ThreadHistory() {
  const dispatch = useAppDispatch();
  const { getThreads, threads, setThreads, threadsLoading, setThreadsLoading } =
    useThreads();
  const { toggleSidebar, isMobile, setOpenMobile } = useSidebar();

  useEffect(() => {
    if (typeof window === "undefined") return;
    setThreadsLoading(true);
    getThreads()
      .then(setThreads)
      .catch(console.error)
      .finally(() => setThreadsLoading(false));
  }, []);

  return (
    <Sidebar className="custom-scrollbar bg-zinc-100/95 dark:bg-zinc-950/95 backdrop-blur-sm border-r border-border/50 shadow-xl">
      <SidebarHeader className="flex flex-col gap-2 p-3 border-b border-border/30 overflow-hidden">
        <div className="flex w-full min-w-0 flex-col gap-1 custom-scrollbar">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between mb-2">
              <a className="flex items-center font-bold text-lg" href="/">
                Hex.io
              </a>
              <Button
                onClick={toggleSidebar}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium rounded-md h-8 w-8 p-0 text-neutral-600 dark:text-neutral-400 hover:text-foreground hover:bg-transparent transition-colors bg-transparent border-0 shadow-none"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={() => {
                dispatch(setThreadId(null));
              }}
              className="inline-flex items-center whitespace-nowrap text-sm font-medium w-full justify-start gap-3 px-3 py-2 h-auto text-neutral-600 dark:text-neutral-400 hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors bg-transparent shadow-none border-0"
            >
              <SquarePen className="h-4 w-4" />
              <span className="text-sm font-medium">New chat</span>
            </Button>
            <Button className="inline-flex items-center whitespace-nowrap text-sm font-medium w-full justify-start gap-3 px-3 py-2 h-auto text-neutral-600 dark:text-neutral-400 hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors bg-transparent shadow-none border-0">
              <Search className="h-4 w-4" />
              <span className="text-sm font-medium">Search chats</span>
            </Button>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex min-h-0 flex-1 flex-col gap-2 group-data-[collapsible=icon]:overflow-hidden custom-scrollbar px-2 py-4 overflow-hidden">
        {threadsLoading ? (
          <ThreadHistoryLoading />
        ) : (
          <ThreadList
            threads={threads}
            onThreadClick={() => {
              if (isMobile) {
                setOpenMobile(false);
              }
            }}
          />
        )}
      </SidebarContent>

      <SidebarFooter className="flex flex-col gap-2 p-4 border-t border-border/10">
        <SidebarMenu className="flex w-full min-w-0 flex-col gap-1">
          <SidebarMenuItem className="group/menu-item relative">
            <UserNav />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
