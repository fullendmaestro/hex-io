import { ToolCallRendererProps } from "./types";
import { isComplexValue } from "./utils/content";

export function DefaultToolCallRenderer({ toolCall }: ToolCallRendererProps) {
  const args = (toolCall.args ?? {}) as Record<string, unknown>;
  const hasArgs = Object.keys(args).length > 0;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <h3 className="font-medium text-gray-900">
          {toolCall.name}
          {toolCall.id && (
            <code className="ml-2 text-sm bg-gray-100 px-2 py-1 rounded">
              {toolCall.id}
            </code>
          )}
        </h3>
      </div>
      {hasArgs ? (
        <table className="min-w-full divide-y divide-gray-200">
          <tbody className="divide-y divide-gray-200">
            {Object.entries(args).map(([key, value], argIdx) => (
              <tr key={argIdx}>
                <td className="px-4 py-2 text-sm font-medium text-gray-900 whitespace-nowrap">
                  {key}
                </td>
                <td className="px-4 py-2 text-sm text-gray-500">
                  {isComplexValue(value) ? (
                    <code className="bg-gray-50 rounded px-2 py-1 font-mono text-sm break-all">
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
      ) : (
        <code className="text-sm block p-3">{"{}"}</code>
      )}
    </div>
  );
}
