

export function isComplexValue(value: unknown): boolean {
  return Array.isArray(value) || (typeof value === "object" && value !== null);
}

function toBase64Local(bytes: Uint8Array): string {
  if (typeof window === "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function toUint8(x: unknown): Uint8Array | null {
  if (x instanceof Uint8Array) return x;
  if (Array.isArray(x) && x.every((n) => typeof n === "number")) {
    return new Uint8Array(x as number[]);
  }
  if (
    typeof x === "object" &&
    x !== null &&
    "data" in x &&
    Array.isArray((x as { data?: unknown[] }).data) &&
    (x as { data: unknown[] }).data.every((n) => typeof n === "number")
  ) {
    return new Uint8Array((x as { data: number[] }).data);
  }
  return null;
}

export function findBytesBase64(value: unknown): string | null {
  if (!value) return null;

  if (typeof value === "string") {
    try {
      return findBytesBase64(JSON.parse(value));
    } catch {
      return null;
    }
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findBytesBase64(item);
      if (found) return found;
    }
    return null;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    if (typeof record.bytesBase64 === "string") {
      return record.bytesBase64;
    }

    if ("bytes" in record) {
      const bytesValue = record.bytes;
      if (typeof bytesValue === "string") {
        return bytesValue;
      }
      const u8 = toUint8(bytesValue);
      if (u8) {
        return toBase64Local(u8);
      }
    }

    if ("observation" in record) {
      const foundInObservation = findBytesBase64(record.observation);
      if (foundInObservation) return foundInObservation;
    }

    if ("output" in record) {
      const foundInOutput = findBytesBase64(record.output);
      if (foundInOutput) return foundInOutput;
    }

    if ("intermediateSteps" in record) {
      const foundInSteps = findBytesBase64(record.intermediateSteps);
      if (foundInSteps) return foundInSteps;
    }
  }

  return null;
}

export function parseToolResultContent(content: unknown): {
  isJsonContent: boolean;
  parsedContent: unknown;
  contentString: string;
} {
  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content);
      return {
        isJsonContent: true,
        parsedContent: parsed,
        contentString: JSON.stringify(parsed, null, 2),
      };
    } catch {
      return {
        isJsonContent: false,
        parsedContent: content,
        contentString: content,
      };
    }
  }

  if (
    Array.isArray(content) ||
    (typeof content === "object" && content !== null)
  ) {
    return {
      isJsonContent: true,
      parsedContent: content,
      contentString: JSON.stringify(content, null, 2),
    };
  }

  return {
    isJsonContent: false,
    parsedContent: content,
    contentString: String(content),
  };
}

