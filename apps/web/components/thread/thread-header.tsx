import { useSidebar, SidebarTrigger } from "@hexio/ui/components/sidebar";
import { Button } from "@hexio/ui/components/button";
import { ChevronDown, SquarePen } from "lucide-react";
import { Avatar, AvatarFallback } from "@hexio/ui/components/avatar";
import { useAppDispatch } from "@/lib/store/hooks";
import { setThreadId } from "@/lib/store/features/thread/threadSlice";
import { AgentSidebarTrigger } from "./agent-sidebar-trigger";

export function ThreadHeader({ chatStarted }: { chatStarted: boolean }) {
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
