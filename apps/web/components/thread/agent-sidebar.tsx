import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@hexio/ui/components/sidebar";
import { AgentLogoSVG } from "../icons/agent";

export function AgentSidebar() {
  return (
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
  );
}
