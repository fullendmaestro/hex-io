import { DynamicStructuredTool } from "@langchain/core/tools";
import { Transaction } from "@hashgraph/sdk";
import { z } from "zod";

type UnknownRecord = Record<string, unknown>;

function parseJsonSafely(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function looksLikeBase64(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed.length > 0 &&
    trimmed.length % 4 === 0 &&
    /^[A-Za-z0-9+/]+={0,2}$/.test(trimmed)
  );
}

function extractBase64FromUnknown(value: unknown): string | null {
  if (!value) return null;

  if (typeof value === "string") {
    const parsed = parseJsonSafely(value);
    if (parsed !== value) {
      return extractBase64FromUnknown(parsed);
    }
    return looksLikeBase64(value) ? value.trim() : null;
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    const record = value as UnknownRecord;
    const directKeys = [
      "serializedTransactionBase64",
      "bytesBase64",
      "serialized_transaction_base64",
      "bytes",
    ];

    for (const key of directKeys) {
      if (typeof record[key] === "string") {
        const candidate = extractBase64FromUnknown(record[key]);
        if (candidate) return candidate;
      }
    }

    for (const nestedKey of [
      "transactionRequest",
      "serializedTransaction",
      "data",
    ]) {
      if (nestedKey in record) {
        const candidate = extractBase64FromUnknown(record[nestedKey]);
        if (candidate) return candidate;
      }
    }
  }

  return null;
}

export const executeTransactionFromBase64Tool = new DynamicStructuredTool({
  name: "execute_transaction_from_base64_tool",
  description:
    "Deserialize a remote-agent serialized Hedera transaction payload and return transaction bytes.",
  schema: z.object({
    serializedTransactionBase64: z
      .string()
      .optional()
      .describe("Raw base64 Hedera transaction bytes."),
    serializedTransaction: z
      .union([z.string(), z.record(z.string(), z.unknown())])
      .optional()
      .describe(
        "Serialized transaction payload (stringified JSON/object) from remote agent response.",
      ),
  }),
  func: async (input) => {
    const typed = input as {
      serializedTransactionBase64?: string;
      serializedTransaction?: unknown;
    };

    const extractedBase64 =
      extractBase64FromUnknown(typed.serializedTransactionBase64) ??
      extractBase64FromUnknown(typed.serializedTransaction);

    if (!extractedBase64) {
      return JSON.stringify({
        status: "invalid_input",
        message:
          "No transaction base64 found. Provide serializedTransactionBase64 or a serializedTransaction payload containing bytesBase64.",
      });
    }

    const bytes = new Uint8Array(Buffer.from(extractedBase64, "base64"));

    if (!bytes.byteLength) {
      return JSON.stringify({
        status: "invalid_input",
        message: "Decoded transaction bytes are empty.",
      });
    }

    try {
      // Validate bytes can be reconstructed as a Hedera Transaction.
      Transaction.fromBytes(bytes);
    } catch (error: unknown) {
      return JSON.stringify({
        status: "invalid_transaction",
        message:
          error instanceof Error
            ? error.message
            : "Failed to deserialize transaction bytes.",
      });
    }

    return JSON.stringify({
      status: "success",
      schema: "hex.transaction.request.v1",
      source: "remote-agent",
      encoding: "base64",
      bytesBase64: extractedBase64,
      byteLength: bytes.byteLength,
      bytes: Array.from(bytes),
    });
  },
});
