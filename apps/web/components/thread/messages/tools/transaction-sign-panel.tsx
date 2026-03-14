import { useMemo, useState } from "react";
import { CircleDot } from "lucide-react";
import { Badge } from "@hexio/ui/components/badge";
import { Button } from "@hexio/ui/components/button";
import {
    connectWallet,
    fromBase64,
    getPairedAccountId,
    signAndExecuteBytes,
} from "@/lib/wallet/walletconnect";
import {
    accentClasses,
    getTransactionToolConfig,
    type TransactionToolConfig,
} from "./transaction-tool-config";
import { isComplexValue } from "./utils/content";

function pickSubmissionSummary(result: unknown): Record<string, string> {
    if (!result || typeof result !== "object") return {};
    const record = result as Record<string, unknown>;
    const fields = [
        "transactionId",
        "hash",
        "status",
        "consensusStatus",
        "nodeId",
    ];
    const out: Record<string, string> = {};
    for (const field of fields) {
        const value = record[field];
        if (typeof value === "string" || typeof value === "number") {
            out[field] = String(value);
        }
    }
    return out;
}

function SummaryTable({
    rows,
    config,
}: {
    rows: [string, unknown][];
    config: TransactionToolConfig;
}) {
    const colors = accentClasses[config.accent];
    const filtered = rows.filter(([, v]) => v !== null && v !== undefined);

    if (filtered.length === 0) return null;

    return (
        <table className="w-full text-xs">
            <tbody className={`divide-y ${colors.divide}`}>
                {filtered.map(([key, value]) => (
                    <tr key={key}>
                        <td className={`py-1.5 pr-3 font-medium ${colors.text}`}>
                            {key}
                        </td>
                        <td className={`py-1.5 ${colors.textMuted} break-all`}>
                            {isComplexValue(value) ? (
                                <code className="bg-black/5 rounded px-1 py-0.5 font-mono text-xs break-all whitespace-pre-wrap">
                                    {JSON.stringify(value, null, 2)}
                                </code>
                            ) : (
                                String(value)
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export function TransactionSignPanel({
    bytesBase64,
    toolName,
    summaryRows,
}: {
    bytesBase64: string;
    toolName: string;
    summaryRows?: [string, unknown][];
}) {
    const config = getTransactionToolConfig(toolName);

    // Fallback config for unrecognized tools
    const fallbackConfig: TransactionToolConfig = {
        label: toolName,
        category: "Transaction",
        accent: "emerald",
        icon: CircleDot,
    };
    const effectiveConfig = config ?? fallbackConfig;

    const colors = accentClasses[effectiveConfig.accent];
    const Icon = effectiveConfig.icon;

    const [status, setStatus] = useState<
        "idle" | "signing" | "submitted" | "error"
    >("idle");
    const [errorDetail, setErrorDetail] = useState<string | null>(null);
    const [submittedResult, setSubmittedResult] = useState<unknown>(null);

    const submittedSummary = useMemo(
        () => pickSubmissionSummary(submittedResult),
        [submittedResult],
    );
    const submittedResultJson = useMemo(() => {
        if (submittedResult === null) return null;
        return JSON.stringify(submittedResult, null, 2);
    }, [submittedResult]);

    const handleSignAndSubmit = async () => {
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
        } catch (error) {
            setStatus("error");
            setErrorDetail(error instanceof Error ? error.message : String(error));
        }
    };

    const statusBadgeVariant =
        status === "submitted"
            ? ("default" as const)
            : status === "error"
                ? ("destructive" as const)
                : ("secondary" as const);

    return (
        <div
            className={`border ${colors.borderLight} ${colors.bgLight} rounded-xl p-4 space-y-3 shadow-sm`}
        >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                    <div
                        className={`shrink-0 w-7 h-7 rounded-lg ${colors.bg} flex items-center justify-center`}
                    >
                        <Icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                        <p className={`text-sm font-semibold ${colors.text}`}>
                            {effectiveConfig.label}
                        </p>
                        <p className={`text-xs ${colors.textMuted} opacity-70`}>
                            Review and sign this transaction
                        </p>
                    </div>
                </div>
                <Badge variant={statusBadgeVariant} className="capitalize text-xs">
                    {status}
                </Badge>
            </div>

            {/* Summary rows */}
            {summaryRows && summaryRows.length > 0 && (
                <div
                    className={`rounded-lg border ${colors.borderLight} bg-white p-3`}
                >
                    <SummaryTable rows={summaryRows} config={effectiveConfig} />
                </div>
            )}

            {/* CTA */}
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    size="sm"
                    onClick={handleSignAndSubmit}
                    disabled={status === "signing" || status === "submitted"}
                    className="shadow-sm"
                >
                    {status === "signing"
                        ? "Waiting for wallet…"
                        : status === "submitted"
                            ? "✓ Submitted"
                            : "Sign and Submit"}
                </Button>
            </div>

            {/* Result */}
            {Object.keys(submittedSummary).length > 0 && (
                <div
                    className={`rounded-lg border ${colors.borderLight} bg-white p-3`}
                >
                    <div className={`text-xs font-medium ${colors.text} mb-1`}>
                        Submission Result
                    </div>
                    <table className="w-full text-xs">
                        <tbody className={`divide-y ${colors.divide}`}>
                            {Object.entries(submittedSummary).map(([key, value]) => (
                                <tr key={key}>
                                    <td className={`py-1 pr-3 font-medium ${colors.text}`}>
                                        {key}
                                    </td>
                                    <td className={`py-1 ${colors.textMuted} break-all`}>
                                        {value}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {submittedResultJson && (
                <code
                    className={`text-xs block p-3 bg-white border ${colors.borderLight} rounded-lg break-all`}
                >
                    {submittedResultJson}
                </code>
            )}

            {errorDetail && (
                <code className="text-xs block p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg break-all">
                    {errorDetail}
                </code>
            )}
        </div>
    );
}
