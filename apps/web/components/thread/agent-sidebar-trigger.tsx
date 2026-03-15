import { useSidebar } from "@hexio/ui/components/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@hexio/ui/components/tooltip";
import { AgentLogoSVG } from "../icons/agent";

export function AgentSidebarTrigger() {
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
