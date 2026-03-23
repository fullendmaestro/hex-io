import { ToolCallRendererProps } from "./types";
import { parseToolResultContent } from "./utils/content";

type HbarBalanceResult = {
  raw?: {
    accountId?: string;
    hbarBalance?: string;
  };
  humanMessage?: string;
};

function parseHbarResult(content: unknown): HbarBalanceResult | null {
  const parsed = parseToolResultContent(content);

  if (typeof parsed.parsedContent === "object" && parsed.parsedContent) {
    return parsed.parsedContent as HbarBalanceResult;
  }

  return null;
}

export function GetHbarBalanceToolCallRenderer({
  toolResult,
}: ToolCallRendererProps) {
  if (!toolResult) {
    return (
      <div className="rounded-md border border-border/60 bg-background/70 px-3 py-2">
        <p className="text-sm text-foreground/90">Fetching HBAR balance</p>
        <p className="mt-1 text-xs text-muted-foreground">Running...</p>
      </div>
    );
  }

  const result = parseHbarResult(toolResult.content);
  const humanMessage =
    typeof result?.humanMessage === "string" ? result.humanMessage : "";
  const accountId =
    typeof result?.raw?.accountId === "string" ? result.raw.accountId : "";
  const hbarBalance =
    typeof result?.raw?.hbarBalance === "string" ? result.raw.hbarBalance : "";

  return (
    <div className="rounded-md border border-border/60 bg-background/70 px-3 py-2">
      <p className="text-sm text-foreground/90">Fetching HBAR balance</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {humanMessage || "HBAR balance fetched."}
      </p>
      {accountId && hbarBalance ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Account: {accountId} | Balance: {hbarBalance} HBAR
        </p>
      ) : null}
    </div>
  );
}
