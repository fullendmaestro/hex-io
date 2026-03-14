"use client";

import { useCallback, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  ChevronDown,
  LogOut,
  Settings,
  CreditCard,
  Sun,
  Moon,
  Monitor,
  Wallet,
  Crown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@hexio/ui/components/dropdown-menu";
import { SidebarMenuButton } from "@hexio/ui/components/sidebar";
import { Badge } from "@hexio/ui/components/badge";
import { Button } from "@hexio/ui/components/button";
import {
  ensureWalletConnector,
  connectWallet,
  disconnectAllSessions,
  getPairedAccountId,
} from "@/lib/wallet/walletconnect";
import { useAppDispatch } from "@/lib/store/hooks";
import {
  setWalletAccountId,
  clearWalletAccountId,
} from "@/lib/store/features/wallet/walletSlice";

// Mock user data - replace with actual user data later
const MOCK_USER = {
  name: "User",
  email: "user@example.com",
  initials: "L",
};

export function UserNav() {
  const { theme, setTheme } = useTheme();
  const [connected, setConnected] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();

  useEffect(() => {
    (async () => {
      try {
        const c = await ensureWalletConnector("warn");
        const isConnected = Boolean(
          (c as unknown as { signers?: unknown[] }).signers?.length,
        );
        setConnected(isConnected);
        if (isConnected) {
          try {
            const acct = await getPairedAccountId();
            setAccountId(acct);
            dispatch(setWalletAccountId(acct));
          } catch {
            // ignore if cannot derive
          }
        }
        // basic session event hooks
        (
          c as unknown as {
            walletConnectClient?: { on: (evt: string, cb: () => void) => void };
          }
        ).walletConnectClient?.on("session_update", async () => {
          setConnected(true);
          try {
            const acct = await getPairedAccountId();
            setAccountId(acct);
            dispatch(setWalletAccountId(acct));
          } catch {
            setAccountId(null);
            dispatch(clearWalletAccountId());
          }
        });
        (
          c as unknown as {
            walletConnectClient?: { on: (evt: string, cb: () => void) => void };
          }
        ).walletConnectClient?.on("session_delete", () => {
          setConnected(false);
          setAccountId(null);
          dispatch(clearWalletAccountId());
        });
      } catch {
        // ignore on load
      }
    })();
  }, []);

  const onConnect = useCallback(async () => {
    setLoading(true);
    try {
      await connectWallet();
      setConnected(true);
      try {
        const acct = await getPairedAccountId();
        setAccountId(acct);
        dispatch(setWalletAccountId(acct));
      } catch {
        setAccountId(null);
        dispatch(clearWalletAccountId());
      }
    } catch (e) {
      console.error("Failed to connect wallet:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const onDisconnect = useCallback(async () => {
    setLoading(true);
    try {
      await disconnectAllSessions();
      setConnected(false);
      setAccountId(null);
      dispatch(clearWalletAccountId());
    } catch (e) {
      console.error("Failed to disconnect wallet:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    // TODO: Implement logout logic
    console.log("Logging out...");
  };

  const handleUpgradePlan = () => {
    // TODO: Implement upgrade plan logic
    console.log("Opening upgrade plan...");
  };

  const handleBilling = () => {
    // TODO: Implement billing logic
    console.log("Opening billing...");
  };

  const handleSettings = () => {
    // TODO: Implement settings logic
    console.log("Opening settings...");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="flex items-center gap-2 overflow-hidden p-2 text-left h-12 w-full px-4 bg-transparent border border-transparent hover:bg-muted/30 transition-all duration-200 rounded-xl group-data-[collapsible=icon]:!p-2 data-[state=open]:bg-muted/50"
        >
          <div className="flex w-full items-center justify-start gap-3">
            <div className="rounded-full shadow-sm bg-gradient-to-br from-primary/30 to-primary/60 flex items-center justify-center transition-all duration-200 w-8 h-8 border-2 border-border/30 shrink-0">
              <span className="text-xs font-bold text-white">
                {MOCK_USER.initials}
              </span>
            </div>
            <div className="block flex-1 text-left min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {MOCK_USER.name}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {connected && accountId
                  ? accountId.substring(0, 12) + "..."
                  : MOCK_USER.email}
              </div>
            </div>
            <ChevronDown className="block h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </div>
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[280px] bg-background/95 backdrop-blur-sm border-border/50 shadow-xl"
        align="end"
        side="top"
        sideOffset={8}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{MOCK_USER.name}</p>
            {connected && accountId ? (
              <div className="flex items-center gap-2">
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {accountId}
                </p>
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-4 bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                >
                  Connected
                </Badge>
              </div>
            ) : (
              <p className="text-xs leading-none text-muted-foreground">
                {MOCK_USER.email}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Wallet Connection */}
        {connected ? (
          <DropdownMenuItem
            onClick={onDisconnect}
            disabled={loading}
            className="cursor-pointer"
          >
            <Wallet className="mr-2 h-4 w-4" />
            <span>Disconnect Wallet</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={onConnect}
            disabled={loading}
            className="cursor-pointer"
          >
            <Wallet className="mr-2 h-4 w-4" />
            <span>Connect Wallet</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Upgrade Plan */}
        <DropdownMenuItem
          onClick={handleUpgradePlan}
          className="cursor-pointer"
        >
          <Crown className="mr-2 h-4 w-4" />
          <span>Upgrade Plan</span>
        </DropdownMenuItem>

        {/* Theme Selector */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer">
            <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="ml-6">Theme</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
              <DropdownMenuRadioItem value="light" className="cursor-pointer">
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark" className="cursor-pointer">
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system" className="cursor-pointer">
                <Monitor className="mr-2 h-4 w-4" />
                <span>System</span>
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Billing */}
        <DropdownMenuItem onClick={handleBilling} className="cursor-pointer">
          <CreditCard className="mr-2 h-4 w-4" />
          <span>Billing</span>
        </DropdownMenuItem>

        {/* Settings */}
        <DropdownMenuItem onClick={handleSettings} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Log out */}
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
