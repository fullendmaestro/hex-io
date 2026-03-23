import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import {
  getTokenAccountId,
  listSupportedTokens,
  normalizeTokenSymbol,
  type HederaNetwork,
} from "../../common/tokens.js";

function getDefaultNetwork(): HederaNetwork {
  return process.env.HEDERA_NETWORK === "mainnet" ? "mainnet" : "testnet";
}

export const getTokenAccountIdTool = new DynamicStructuredTool({
  name: "get_token_account_id_tool",
  description:
    "Get the Hedera token account ID for a token symbol on a specific network.",
  schema: z.object({
    token: z.string().min(1).describe("Token symbol or key (e.g. usdc, sauce)"),
    network: z.enum(["testnet", "mainnet"]).optional(),
  }),
  func: async (input) => {
    const typed = input as { token: string; network?: HederaNetwork };
    const network = typed.network ?? getDefaultNetwork();
    const normalizedToken = normalizeTokenSymbol(typed.token);
    const accountId = getTokenAccountId(network, normalizedToken);

    if (!accountId) {
      return JSON.stringify({
        status: "not_found",
        network,
        token: normalizedToken,
        message: `No account ID mapping found for token '${normalizedToken}' on ${network}.`,
        supportedTokens: listSupportedTokens(network),
      });
    }

    return JSON.stringify({
      status: "success",
      network,
      token: normalizedToken,
      accountId,
    });
  },
});
