import {
    accentClasses,
    getTransactionToolConfig,
    TransactionToolConfig,
} from "./transaction-tool-config";
import { isComplexValue } from "./utils/content";
import { ToolCall } from "./types";

function formatArgValue(value: unknown): string {
    if (value === null || value === undefined) return "—";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "string" || typeof value === "number")
        return String(value);
    return JSON.stringify(value, null, 2);
}

function ArgValueDisplay({ value }: { value: unknown }) {
    if (isComplexValue(value)) {
        return (
            <code className="bg-black/5 rounded px-1.5 py-0.5 font-mono text-xs break-all whitespace-pre-wrap">
                {formatArgValue(value)}
            </code>
        );
    }
    return <span>{formatArgValue(value)}</span>;
}

function sortArgs(
    args: Record<string, unknown>,
    config: TransactionToolConfig,
): [string, unknown][] {
    const hidden = new Set(config.argHidden ?? []);
    const entries = Object.entries(args).filter(([k]) => !hidden.has(k));

    if (!config.argPriority?.length) return entries;

    const prioritySet = new Set(config.argPriority);
    const prioritized: [string, unknown][] = [];
    const rest: [string, unknown][] = [];

    for (const entry of entries) {
        if (prioritySet.has(entry[0])) {
            prioritized.push(entry);
        } else {
            rest.push(entry);
        }
    }

    prioritized.sort(
        (a, b) =>
            config.argPriority!.indexOf(a[0]) - config.argPriority!.indexOf(b[0]),
    );

    return [...prioritized, ...rest];
}

/**
 * Renders the args table for a tool call.
 * When `isInline` is true, renders only the table (no outer card/header).
 */
export function TransactionToolCallCard({
    toolCall,
    isInline,
}: {
    toolCall: ToolCall;
    isInline?: boolean;
}) {
    const config = getTransactionToolConfig(toolCall.name);
    if (!config) return null;

    const colors = accentClasses[config.accent];
    const args = (toolCall.args ?? {}) as Record<string, unknown>;
    const sortedArgs = sortArgs(args, config);

    const argsContent =
        sortedArgs.length > 0 ? (
            <div className="px-4 py-2">
                <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide mb-2">
                    Parameters
                </h4>
                <table className="w-full text-sm">
                    <tbody className={`divide-y ${colors.divide}`}>
                        {sortedArgs.map(([key, value]) => (
                            <tr key={key}>
                                <td
                                    className={`py-2 pr-4 font-medium ${colors.text} whitespace-nowrap text-xs w-[140px]`}
                                >
                                    {config.argLabels?.[key] ?? key}
                                </td>
                                <td
                                    className={`py-2 ${colors.textMuted} text-xs break-all`}
                                >
                                    <ArgValueDisplay value={value} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
            <div className={`px-4 py-3 text-xs ${colors.textMuted}`}>
                No parameters provided
            </div>
        );

    // Inline mode: just the args table (used inside unified renderer)
    if (isInline) {
        return argsContent;
    }

    // Standalone mode: full card with header (used by default/non-unified flow)
    const Icon = config.icon;
    return (
        <div
            className={`rounded-xl border ${colors.borderLight} overflow-hidden shadow-sm`}
        >
            <div
                className={`${colors.bgLight} px-4 py-3 flex items-center gap-3 border-b ${colors.borderLight}`}
            >
                <div
                    className={`shrink-0 w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center`}
                >
                    <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-sm ${colors.text}`}>
                        {config.label}
                    </h3>
                    <p className={`text-xs ${colors.textMuted} opacity-70`}>
                        {config.category}
                    </p>
                </div>
            </div>
            {argsContent}
        </div>
    );
}
