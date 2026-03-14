"use client";

import { useState } from "react";
import {
    ChevronDown,
    CheckCircle,
    Circle,
    Loader2,
} from "lucide-react";
import { Badge } from "@hexio/ui/components/badge";
import { Button } from "@hexio/ui/components/button";
import { TransactionToolCallCard } from "./transaction-tool-call-card";
import { TransactionSignPanel } from "./transaction-sign-panel";
import { ToolCallRendererProps } from "./types";
import {
    getTransactionToolConfig,
    accentClasses,
} from "./transaction-tool-config";
import { findBytesBase64 } from "./utils/content";

export function TransactionToolCallRenderer({
    toolCall,
    toolResult,
}: ToolCallRendererProps) {
    const [isOpen, setIsOpen] = useState(true);
    const config = getTransactionToolConfig(toolCall.name);
    if (!config) return null;

    const colors = accentClasses[config.accent];
    const Icon = config.icon;

    const hasResult = !!toolResult;
    const bytesBase64 = hasResult ? findBytesBase64(toolResult.content) : null;

    // Extract summary rows from result for sign panel
    const summaryRows = extractResultSummary(toolResult?.content, toolCall.name);

    return (
        <div className={`rounded-xl border ${colors.borderLight} overflow-hidden shadow-sm`}>
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
                    <StatusBadge hasResult={hasResult} />
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

                    {/* Sign panel (when result with bytes is available) */}
                    {hasResult && bytesBase64 && (
                        <div className="p-4">
                            <TransactionSignPanel
                                bytesBase64={bytesBase64}
                                toolName={toolCall.name}
                                summaryRows={summaryRows.length > 0 ? summaryRows : undefined}
                            />
                        </div>
                    )}

                    {/* Result without bytes — tool ran but no transaction bytes */}
                    {hasResult && !bytesBase64 && (
                        <div className={`px-4 py-3 text-sm ${colors.textMuted}`}>
                            <div className={`rounded-lg border ${colors.borderLight} ${colors.bgLight} px-3 py-2`}>
                                {config.label} completed, but no transaction bytes were returned.
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

function StatusBadge({ hasResult }: { hasResult: boolean }) {
    return (
        <Badge className="gap-1.5 rounded-full text-xs" variant="secondary">
            {hasResult ? (
                <>
                    <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                    Completed
                </>
            ) : (
                <>
                    <Circle className="w-3.5 h-3.5 animate-pulse" />
                    Calling
                </>
            )}
        </Badge>
    );
}

function extractResultSummary(
    content: unknown,
    toolName: string,
): [string, unknown][] {
    const config = getTransactionToolConfig(toolName);
    if (!config || !content) return [];

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
        ...(config.argHidden ?? []),
    ]);

    for (const [key, value] of Object.entries(parsed)) {
        if (hidden.has(key) || value === undefined || value === null) continue;
        const label = config.argLabels?.[key] ?? key;
        rows.push([label, value]);
    }

    return rows;
}
