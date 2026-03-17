"use client";

import { useState, useMemo } from "react";
import {
    CheckCircle2,
    Loader2,
    ExternalLink,
    ArrowRight,
    XCircle,
} from "lucide-react";
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

/* ── Types ───────────────────────────────────────────────────────── */

interface HbarTransfer {
    accountId: string;
    amount: number;
}

interface TransferHbarArgs {
    transfers?: HbarTransfer[];
    sourceAccountId?: string;
    transactionMemo?: string;
    schedulingParams?: unknown;
}

/* ── Helpers ─────────────────────────────────────────────────────── */

function truncate(id?: string | null): string {
    if (!id) return "";
    if (id.length <= 12) return id;
    return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

function pickSubmissionSummary(result: unknown): Record<string, string> {
    if (!result || typeof result !== "object") return {};
    const record = result as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const field of ["transactionId", "status"]) {
        const value = record[field];
        if (typeof value === "string" || typeof value === "number") {
            out[field] = String(value);
        }
    }
    return out;
}

/* ── Main Component ──────────────────────────────────────────────── */

export function TransferHbarToolCallRenderer({
    toolCall,
    toolResult,
}: ToolCallRendererProps) {
    const args = (toolCall.args ?? {}) as TransferHbarArgs;
    const transfers = args.transfers ?? [];
    const sourceAccountId = args.sourceAccountId;
    const memo = args.transactionMemo;

    const stream = useStreamContext();
    const threadInterrupt = stream.interrupt;

    const totalAmount = useMemo(
        () => transfers.reduce((sum, t) => sum + (t.amount ?? 0), 0),
        [transfers],
    );

    const hasResult = !!toolResult;
    const bytesBase64 = hasResult ? findBytesBase64(toolResult.content) : null;

    // Determine if this tool call is currently interrupted (graph is paused after tool execution)
    const isInterrupted = !!threadInterrupt && hasResult && !!bytesBase64;

    /* ── Signing state ───────────────────────────────────────────── */
    const [status, setStatus] = useState<
        "idle" | "signing" | "submitted" | "error"
    >("idle");
    const [errorDetail, setErrorDetail] = useState<string | null>(null);
    const [submittedResult, setSubmittedResult] = useState<unknown>(null);

    const submittedSummary = useMemo(
        () => pickSubmissionSummary(submittedResult),
        [submittedResult],
    );

    /**
     * Resume the graph with an updated tool result message.
     * Uses Command({ update }) to replace the original tool result (bytes)
     * with the signing outcome so the model sees "confirmed" or "rejected".
     */
    const resumeGraphWithResult = (content: string) => {
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
                                content,
                                id: toolResult.id,
                                name: toolCall.name,
                            },
                        ],
                    },
                },
            },
        );
    };

    const handleSign = async () => {
        if (!bytesBase64) return;
        setStatus("signing");
        setErrorDetail(null);
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
            setStatus("submitted");

            // Resume graph with confirmation
            const summary = pickSubmissionSummary(result);
            const confirmationMessage = summary.transactionId
                ? `Transaction confirmed and submitted to the network. Transaction ID: ${summary.transactionId}. Status: ${summary.status || "SUCCESS"}.`
                : `Transaction confirmed and submitted to the network. Status: ${summary.status || "SUCCESS"}.`;
            resumeGraphWithResult(confirmationMessage);
        } catch (error) {
            setStatus("error");
            const message =
                error instanceof Error ? error.message : String(error);
            setErrorDetail(message);

            // Resume graph with rejection
            resumeGraphWithResult(
                `Transaction rejected by user. Reason: ${message}`,
            );
        }
    };

    /* ── Submitted success view ──────────────────────────────────── */
    if (status === "submitted") {
        return (
            <div className="max-w-sm space-y-2 py-1">
                <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-medium">
                        Sent {totalAmount.toLocaleString()} ℏ
                    </span>
                    <span className="text-muted-foreground text-xs">
                        →{" "}
                        {transfers.length === 1 && transfers[0]
                            ? truncate(transfers[0].accountId)
                            : `${transfers.length} recipients`}
                    </span>
                </div>

                {submittedSummary.transactionId && (
                    <a
                        href={`https://hashscan.io/mainnet/transaction/${submittedSummary.transactionId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {submittedSummary.transactionId}
                        <ExternalLink className="w-3 h-3" />
                    </a>
                )}
            </div>
        );
    }

    /* ── Error view (transaction rejected) ───────────────────────── */
    if (status === "error") {
        return (
            <div className="max-w-sm space-y-2 py-1">
                <div className="flex items-center gap-2 text-sm text-destructive">
                    <XCircle className="w-4 h-4" />
                    <span className="font-medium">Transaction rejected</span>
                </div>
                {errorDetail && (
                    <p className="text-xs text-muted-foreground break-all">
                        {errorDetail}
                    </p>
                )}
            </div>
        );
    }

    /* ── Review transfer view ────────────────────────────────────── */
    return (
        <div className="max-w-sm rounded-lg border border-border overflow-hidden">
            {/* Amount + direction */}
            <div className="px-4 py-3 space-y-2">
                <div className="flex items-baseline justify-between">
                    <span className="text-lg font-semibold text-foreground tabular-nums">
                        {totalAmount.toLocaleString()} ℏ
                    </span>
                    <span className="text-xs text-muted-foreground">HBAR</span>
                </div>

                {/* Transfer rows */}
                {transfers.map((t, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                        {sourceAccountId && (
                            <>
                                <span className="font-mono">
                                    {truncate(sourceAccountId)}
                                </span>
                                <ArrowRight className="w-3 h-3 shrink-0" />
                            </>
                        )}
                        <span className="font-mono text-foreground">
                            {truncate(t.accountId)}
                        </span>
                        {transfers.length > 1 && (
                            <span className="ml-auto tabular-nums">
                                {t.amount.toLocaleString()} ℏ
                            </span>
                        )}
                    </div>
                ))}

                {memo && (
                    <p className="text-xs text-muted-foreground italic">
                        {memo}
                    </p>
                )}
            </div>

            {/* Action bar */}
            <div className="border-t border-border px-4 py-3">
                {!hasResult && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Preparing…
                    </div>
                )}

                {hasResult && !bytesBase64 && (
                    <p className="text-xs text-muted-foreground">
                        No transaction bytes returned.
                    </p>
                )}

                {isInterrupted && (
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleSign}
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
                )}

                {hasResult && bytesBase64 && !isInterrupted && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Transaction processed
                    </div>
                )}
            </div>
        </div>
    );
}
