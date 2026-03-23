"use client";

import { useState, useMemo } from "react";
import { CheckCircle2, ExternalLink, Loader2, XCircle } from "lucide-react";
import { Button } from "@hexio/ui/components/button";
import { ToolCallRendererProps } from "./types";
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

  if (!isRecord(parsed)) return null;
  if (parsed.schema !== "hex.transaction.result.v1") return null;

  const status = parsed.status;
  const message = parsed.message;
  const submittedAt = parsed.submittedAt;
  if (
    (status !== "success" && status !== "rejected" && status !== "failed") ||
    typeof message !== "string" ||
    typeof submittedAt !== "string"
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

export function ExecuteTransactionToolCallRenderer({
  toolCall,
  toolResult,
}: ToolCallRendererProps) {
  const stream = useStreamContext();
  const threadInterrupt = stream.interrupt;

  const hasResult = !!toolResult;
  const bytesBase64 = hasResult ? findBytesBase64(toolResult.content) : null;

  const persistedExecutionResult = useMemo(
    () => parseTransactionExecutionResult(toolResult?.content),
    [toolResult?.content],
  );

  const isInterrupted =
    !!threadInterrupt &&
    hasResult &&
    !!bytesBase64 &&
    !persistedExecutionResult;

  const [status, setStatus] = useState<"idle" | "signing">("idle");
  const [executionResult, setExecutionResult] =
    useState<TransactionExecutionResult | null>(null);
  const [submittedResult, setSubmittedResult] = useState<unknown>(null);

  const effectiveExecutionResult = executionResult ?? persistedExecutionResult;

  const submittedSummary = useMemo(
    () => pickSubmissionSummary(submittedResult),
    [submittedResult],
  );

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
    setSubmittedResult(null);

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
      setSubmittedResult(result);

      const summary = pickSubmissionSummary(result);
      const structuredResult: TransactionExecutionResult = {
        schema: "hex.transaction.result.v1",
        status: "success",
        message: summary.transactionId
          ? `Transaction confirmed. ID: ${summary.transactionId}`
          : "Transaction confirmed and submitted.",
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
            ? "Transaction rejected."
            : "Transaction failed.",
        reason,
        submittedAt: new Date().toISOString(),
      };
      setExecutionResult(structuredResult);
      setStatus("idle");
      resumeGraphWithResult(structuredResult);
    }
  };

  /* ── Success view ────────────────────────────────────────────── */
  if (effectiveExecutionResult?.status === "success") {
    return (
      <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
        <div className="max-w-sm space-y-2 py-1">
          <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
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
      </div>
    );
  }

  /* ── Error view ──────────────────────────────────────────────── */
  if (
    effectiveExecutionResult?.status === "rejected" ||
    effectiveExecutionResult?.status === "failed"
  ) {
    const isRejected = effectiveExecutionResult.status === "rejected";
    return (
      <div
        className={`text-sm font-medium ${
          isRejected ? "text-destructive" : "text-amber-600 dark:text-amber-400"
        }`}
      >
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4" />
          <span>{effectiveExecutionResult.message}</span>
        </div>
      </div>
    );
  }

  /* ── Sign & Submit button ────────────────────────────────────── */
  if (isInterrupted) {
    return (
      <div className="max-w-sm rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-3">
          <p className="text-sm font-medium text-foreground">
            Execute Transaction
          </p>
          <p className="text-xs text-muted-foreground">
            Ready to sign and submit
          </p>
        </div>
        <div className="border-t border-border px-4 py-3">
          <Button
            type="button"
            size="sm"
            onClick={handleSignAndSubmit}
            disabled={status === "signing"}
            className="w-full"
          >
            {status === "signing" ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Waiting for wallet…
              </span>
            ) : (
              "Sign & Submit"
            )}
          </Button>
        </div>
      </div>
    );
  }

  /* ── Loading state ───────────────────────────────────────────── */
  if (!hasResult) {
    return (
      <div className="max-w-sm rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-3">
          <p className="text-sm font-medium text-foreground">
            Execute Transaction
          </p>
        </div>
        <div className="border-t border-border px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Preparing…
          </div>
        </div>
      </div>
    );
  }

  /* ── No bytes returned ───────────────────────────────────────── */
  if (!bytesBase64) {
    return (
      <div className="max-w-sm rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-3">
          <p className="text-sm font-medium text-foreground">
            Execute Transaction
          </p>
        </div>
        <div className="border-t border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">
            No transaction bytes returned.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
