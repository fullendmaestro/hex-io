import { memo, useState } from "react";
import type { Thread } from "@langchain/langgraph-sdk";
import { cn } from "@/lib/utils";
import { getContentString } from "../utils";
import {
  GlobeIcon,
  LockIcon,
  MoreHorizontalIcon,
  ShareIcon,
  TrashIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@hexio/ui/components/dropdown-menu";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@hexio/ui/components/sidebar";
import { CheckCircleFillIcon } from "@/components/icons/checkcirclefill";

const PureThreadItem = ({
  thread,
  isActive,
  onClick,
}: {
  thread: Thread;
  isActive: boolean;
  onClick: (threadId: string) => void;
}) => {
  const [visibilityType, setVisibilityType] = useState<"private" | "public">(
    "private",
  );

  let itemText = thread.thread_id;
  if (
    typeof thread.values === "object" &&
    thread.values &&
    "messages" in thread.values &&
    Array.isArray(thread.values.messages) &&
    thread.values.messages?.length > 0
  ) {
    const firstMessage = thread.values.messages[0];
    itemText = getContentString(firstMessage.content);
  }

  return (
    <SidebarMenuItem className="group/menu-item relative group">
      <div className="relative flex items-center rounded-lg w-full min-w-0">
        <SidebarMenuButton
          isActive={isActive}
          onClick={(e) => {
            e.preventDefault();
            onClick(thread.thread_id);
          }}
          className={cn(
            "flex w-full items-center overflow-hidden text-left outline-none h-8 text-sm flex-1 rounded-lg transition-all duration-200 border-0 px-3 py-2.5 min-w-0 group",
            isActive
              ? "bg-muted/80 text-foreground font-semibold"
              : "hover:bg-muted/40 text-muted-foreground/70",
          )}
        >
          <span className="truncate flex-1 text-left">{itemText}</span>
        </SidebarMenuButton>
      </div>

      <DropdownMenu modal={true}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction
            className="mr-0.5 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            showOnHover={!isActive}
          >
            <MoreHorizontalIcon />
            <span className="sr-only">More</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" side="bottom">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer">
              <ShareIcon />
              <span>Share</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  className="cursor-pointer flex-row justify-between"
                  onClick={() => {
                    setVisibilityType("private");
                    // TODO: Implement share action
                  }}
                >
                  <div className="flex flex-row items-center gap-2">
                    <LockIcon size={12} />
                    <span>Private</span>
                  </div>
                  {visibilityType === "private" ? (
                    <CheckCircleFillIcon />
                  ) : null}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer flex-row justify-between"
                  onClick={() => {
                    setVisibilityType("public");
                    // TODO: Implement share action
                  }}
                >
                  <div className="flex flex-row items-center gap-2">
                    <GlobeIcon />
                    <span>Public</span>
                  </div>
                  {visibilityType === "public" ? <CheckCircleFillIcon /> : null}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive dark:text-red-500"
            onSelect={() => {
              // TODO: Implement delete action
            }}
          >
            <TrashIcon />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

export const ThreadItem = memo(PureThreadItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) {
    return false;
  }
  if (prevProps.thread.thread_id !== nextProps.thread.thread_id) {
    return false;
  }
  return true;
});
