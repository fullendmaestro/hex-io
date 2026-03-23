export type HederaNetwork = "mainnet" | "testnet";

export const TOKEN_ACCOUNT_IDS_BY_NETWORK = {
  mainnet: {},
  testnet: {
    usdc: "0.0.5449",
    sauce: "0.0.1183558",
    dai: "0.0.5529",
    "karate-combat": "0.0.3772909",
  },
} as const;

type NetworkTokenMap = typeof TOKEN_ACCOUNT_IDS_BY_NETWORK;
export type TokenSymbolForNetwork<N extends HederaNetwork> =
  keyof NetworkTokenMap[N] & string;

export function normalizeTokenSymbol(token: string): string {
  return token.trim().toLowerCase().replace(/_/g, "-");
}

export function getTokenAccountId(
  network: HederaNetwork,
  token: string,
): string | null {
  const normalizedToken = normalizeTokenSymbol(token);
  const networkMap = TOKEN_ACCOUNT_IDS_BY_NETWORK[network] as Record<
    string,
    string
  >;

  return networkMap[normalizedToken] ?? null;
}

export function listSupportedTokens(network: HederaNetwork): string[] {
  return Object.keys(TOKEN_ACCOUNT_IDS_BY_NETWORK[network]);
}
