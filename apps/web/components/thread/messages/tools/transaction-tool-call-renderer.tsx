"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  CheckCircle,
  Circle,
  ExternalLink,
  Loader2,
  XCircle,
  CircleDot,
} from "lucide-react";
import { Badge } from "@hexio/ui/components/badge";
import { Button } from "@hexio/ui/components/button";
import { TransactionToolCallCard } from "./transaction-tool-call-card";
import { ToolCallRendererProps } from "./types";
import {
  getTransactionToolConfig,
  accentClasses,
  type TransactionToolConfig,
} from "./transaction-tool-config";
import { findBytesBase64 } from "./utils/content";
import {
  connectWallet,
  fromBase64,
  getPairedAccountId,
  signAndExecuteBytes,
} from "@/lib/wallet/walletconnect";
import { useStreamContext } from "@/providers/Stream";

type TransactionExecutionStatus = "success" | "rejected" | "failed";

interface TransactionExecutionResult {
  schema: "hex.transaction.result.v1";
  status: TransactionExecutionStatus;
  message: string;
  transactionId?: string;
  networkStatus?: string;
  reason?: string;
  submittedAt: string;
  toolName: string;
}

function humanizeToolName(toolName: string): string {
  return toolName
    .replace(/_tool$/i, "")
    .split("_")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function getFallbackTransactionConfig(toolName: string): TransactionToolConfig {
  return {
    label: humanizeToolName(toolName),
    category: "Transaction",
    accent: "slate",
    icon: CircleDot,
  };
}

function pickSubmissionSummary(result: unknown): Record<string, string> {
  if (!result || typeof result !== "object") return {};
  const record = result as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const field of ["transactionId", "status", "consensusStatus"]) {
    const value = record[field];
    if (typeof value === "string" || typeof value === "number") {
      out[field] = String(value);
    }
  }
  return out;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseTransactionExecutionResult(
  content: unknown,
): TransactionExecutionResult | null {
  let parsed: unknown = content;

  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return null;
    }
  }

  if (!isRecord(parsed) || parsed.schema !== "hex.transaction.result.v1") {
    return null;
  }

  const status = parsed.status;
  const message = parsed.message;
  const submittedAt = parsed.submittedAt;
  const toolName = parsed.toolName;
  if (
    (status !== "success" && status !== "rejected" && status !== "failed") ||
    typeof message !== "string" ||
    typeof submittedAt !== "string" ||
    typeof toolName !== "string"
  ) {
    return null;
  }

  const getOptionalString = (value: unknown): string | undefined =>
    typeof value === "string" ? value : undefined;

  return {
    schema: "hex.transaction.result.v1",
    status,
    message,
    submittedAt,
    toolName,
    transactionId: getOptionalString(parsed.transactionId),
    networkStatus: getOptionalString(parsed.networkStatus),
    reason: getOptionalString(parsed.reason),
  };
}

function classifySigningError(error: unknown): {
  status: "rejected" | "failed";
  reason: string;
} {
  const reason = error instanceof Error ? error.message : String(error);
  const normalized = reason.toLowerCase();
  const isRejected =
    normalized.includes("reject") ||
    normalized.includes("declin") ||
    normalized.includes("cancel") ||
    normalized.includes("denied") ||
    normalized.includes("4001");

  return {
    status: isRejected ? "rejected" : "failed",
    reason,
  };
}

export function TransactionToolCallRenderer({
  toolCall,
  toolResult,
}: ToolCallRendererProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [status, setStatus] = useState<"idle" | "signing">("idle");
  const [executionResult, setExecutionResult] =
    useState<TransactionExecutionResult | null>(null);

  const stream = useStreamContext();
  const threadInterrupt = stream.interrupt;

  const config =
    getTransactionToolConfig(toolCall.name) ??
    getFallbackTransactionConfig(toolCall.name);

  const colors = accentClasses[config.accent];
  const Icon = config.icon;

  const hasResult = !!toolResult;
  const bytesBase64 = hasResult ? findBytesBase64(toolResult.content) : null;
  const persistedExecutionResult = useMemo(
    () => parseTransactionExecutionResult(toolResult?.content),
    [toolResult?.content],
  );
  const effectiveExecutionResult = executionResult ?? persistedExecutionResult;
  const isInterrupted =
    !!threadInterrupt &&
    hasResult &&
    !!bytesBase64 &&
    !persistedExecutionResult;
  const submittedSummary = useMemo(
    () => pickSubmissionSummary(toolResult?.content),
    [toolResult?.content],
  );

  // Extract summary rows from result for sign panel
  const summaryRows = extractResultSummary(toolResult?.content, toolCall.name);

  const resumeGraphWithResult = (result: TransactionExecutionResult) => {
    if (!toolResult?.id) return;
    stream.submit(
      {},
      {
        command: {
          update: {
            messages: [
              {
                type: "tool",
                tool_call_id: toolResult.tool_call_id,
                content: JSON.stringify(result),
                id: toolResult.id,
                name: toolCall.name,
              },
            ],
          },
        },
      },
    );
  };

  const handleSignAndSubmit = async () => {
    if (!bytesBase64) return;
    setStatus("signing");
    setExecutionResult(null);

    try {
      let accountId: string;
      try {
        accountId = await getPairedAccountId();
      } catch {
        await connectWallet();
        accountId = await getPairedAccountId();
      }

      const result = await signAndExecuteBytes({
        bytes: fromBase64(bytesBase64),
        accountId,
      });

      const summary = pickSubmissionSummary(result);
      const structuredResult: TransactionExecutionResult = {
        schema: "hex.transaction.result.v1",
        status: "success",
        message: summary.transactionId
          ? `Transaction confirmed and submitted to the network. Transaction ID: ${summary.transactionId}.`
          : "Transaction confirmed and submitted to the network.",
        toolName: toolCall.name,
        transactionId: summary.transactionId,
        networkStatus: summary.status ?? summary.consensusStatus,
        submittedAt: new Date().toISOString(),
      };
      setExecutionResult(structuredResult);
      setStatus("idle");
      resumeGraphWithResult(structuredResult);
    } catch (error) {
      const { status: executionStatus, reason } = classifySigningError(error);
      const structuredResult: TransactionExecutionResult = {
        schema: "hex.transaction.result.v1",
        status: executionStatus,
        message:
          executionStatus === "rejected"
            ? "Transaction rejected by user."
            : "Transaction failed to submit.",
        toolName: toolCall.name,
        reason,
        submittedAt: new Date().toISOString(),
      };
      setExecutionResult(structuredResult);
      setStatus("idle");
      resumeGraphWithResult(structuredResult);
    }
  };

  const statusLabel =
    status === "signing"
      ? "Signing"
      : effectiveExecutionResult?.status === "success"
        ? "Success"
        : effectiveExecutionResult?.status === "rejected"
          ? "Rejected"
          : effectiveExecutionResult?.status === "failed"
            ? "Failed"
            : hasResult
              ? "Ready"
              : "Calling";
  const statusVariant =
    effectiveExecutionResult?.status === "failed" ||
    effectiveExecutionResult?.status === "rejected"
      ? ("destructive" as const)
      : ("secondary" as const);

  return (
    <div
      className={`rounded-xl border ${colors.borderLight} overflow-hidden shadow-sm`}
    >
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 ${colors.bgLight} border-b ${colors.borderLight} cursor-pointer hover:opacity-90 transition-opacity`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`shrink-0 w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center`}
          >
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <h3 className={`font-semibold text-sm ${colors.text}`}>
              {config.label}
            </h3>
            <p className={`text-xs ${colors.textMuted} opacity-70`}>
              {config.category}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge
            statusLabel={statusLabel}
            variant={statusVariant}
            isSigning={status === "signing"}
            isSuccess={effectiveExecutionResult?.status === "success"}
          />
          <ChevronDown
            className={`w-4 h-4 ${colors.textMuted} transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Collapsible content */}
      {isOpen && (
        <div className="divide-y divide-gray-100">
          {/* Args preview */}
          <TransactionToolCallCard toolCall={toolCall} isInline />

          {effectiveExecutionResult?.status === "success" && (
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-emerald-700">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Transaction submitted</span>
              </div>
              {(effectiveExecutionResult.transactionId ||
                submittedSummary.transactionId) && (
                <a
                  href={`https://hashscan.io/mainnet/transaction/${effectiveExecutionResult.transactionId || submittedSummary.transactionId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {effectiveExecutionResult.transactionId ||
                    submittedSummary.transactionId}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {effectiveExecutionResult.networkStatus && (
                <p className="text-xs text-muted-foreground">
                  Network status: {effectiveExecutionResult.networkStatus}
                </p>
              )}
            </div>
          )}

          {(effectiveExecutionResult?.status === "rejected" ||
            effectiveExecutionResult?.status === "failed") && (
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-destructive">
                <XCircle className="w-4 h-4" />
                <span className="font-medium">
                  {effectiveExecutionResult.status === "rejected"
                    ? "Transaction rejected"
                    : "Transaction failed"}
                </span>
              </div>
              {effectiveExecutionResult.reason && (
                <p className="text-xs text-muted-foreground break-all">
                  {effectiveExecutionResult.reason}
                </p>
              )}
            </div>
          )}

          {isInterrupted && (
            <div className="p-4 space-y-3">
              {summaryRows.length > 0 && (
                <table className="w-full text-xs">
                  <tbody className={`divide-y ${colors.divide}`}>
                    {summaryRows.map(([key, value]) => (
                      <tr key={key}>
                        <td
                          className={`py-1.5 pr-3 font-medium ${colors.text}`}
                        >
                          {key}
                        </td>
                        <td className={`py-1.5 ${colors.textMuted} break-all`}>
                          {typeof value === "object"
                            ? JSON.stringify(value)
                            : String(value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <Button
                type="button"
                size="sm"
                className="w-full"
                onClick={handleSignAndSubmit}
                disabled={status === "signing"}
              >
                {status === "signing" ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Waiting for wallet...
                  </span>
                ) : (
                  "Sign & Submit"
                )}
              </Button>
            </div>
          )}

          {hasResult &&
            bytesBase64 &&
            !isInterrupted &&
            !effectiveExecutionResult && (
              <div className="px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Processing
              </div>
            )}

          {/* Result without bytes — tool ran but no transaction bytes */}
          {hasResult && !bytesBase64 && (
            <div className={`px-4 py-3 text-sm ${colors.textMuted}`}>
              <div
                className={`rounded-lg border ${colors.borderLight} ${colors.bgLight} px-3 py-2`}
              >
                {config.label} completed, but no transaction bytes were
                returned.
              </div>
            </div>
          )}

          {/* Pending state */}
          {!hasResult && (
            <div className="px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Waiting for tool to complete…
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({
  statusLabel,
  variant,
  isSigning,
  isSuccess,
}: {
  statusLabel: string;
  variant: "secondary" | "destructive";
  isSigning: boolean;
  isSuccess: boolean;
}) {
  return (
    <Badge className="gap-1.5 rounded-full text-xs" variant={variant}>
      {isSigning ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isSuccess ? (
        <CheckCircle className="w-3.5 h-3.5 text-green-600" />
      ) : (
        <Circle className="w-3.5 h-3.5" />
      )}
      {statusLabel}
    </Badge>
  );
}

function extractResultSummary(
  content: unknown,
  toolName: string,
): [string, unknown][] {
  const config = getTransactionToolConfig(toolName);
  if (!content) return [];

  let parsed: Record<string, unknown> | null = null;

  if (typeof content === "string") {
    try {
      const obj = JSON.parse(content);
      if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
        parsed = obj;
      }
    } catch {
      // not JSON
    }
  } else if (
    typeof content === "object" &&
    content !== null &&
    !Array.isArray(content)
  ) {
    parsed = content as Record<string, unknown>;
  }

  if (!parsed) return [];

  const rows: [string, unknown][] = [];
  const hidden = new Set([
    "bytesBase64",
    "bytes",
    "observation",
    "output",
    "intermediateSteps",
    ...(config?.argHidden ?? []),
  ]);

  for (const [key, value] of Object.entries(parsed)) {
    if (hidden.has(key) || value === undefined || value === null) continue;
    const label = config?.argLabels?.[key] ?? key;
    rows.push([label, value]);
  }

  return rows;
}
