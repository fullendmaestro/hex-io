"use client";

import { LedgerId } from "@hashgraph/sdk";
import type {
  DAppConnector,
} from "@hashgraph/hedera-wallet-connect";
import { HederaNetwork } from "../agent-config";

let connectorSingleton: DAppConnector | undefined;

export function mapNetworkToLedgerId(network: HederaNetwork): LedgerId {
  return network === "mainnet" ? LedgerId.MAINNET : LedgerId.TESTNET;
}

export function getAllowedChains(): string[] {
  // Allow both Hedera Native chain ids; wallets handle the selected session chain
  return ["hedera:mainnet", "hedera:testnet"];
}

export function getNetwork(): HederaNetwork {
  return (process.env.NEXT_PUBLIC_NETWORK as HederaNetwork) || "testnet";
}

export function toHip30AccountId(
  network: HederaNetwork,
  accountId: string,
): string {
  // network:shard.realm.num
  const hip30Network =
    network === "mainnet" ? "hedera:mainnet" : "hedera:testnet";
  return `${hip30Network}:${accountId}`;
}

export async function initWalletConnector(): Promise<DAppConnector | undefined> {
  if (typeof window === "undefined") return undefined;
  if (connectorSingleton) return connectorSingleton;

  const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;
  if (!projectId) throw new Error("NEXT_PUBLIC_WC_PROJECT_ID is required");

  // Dynamically import the wallet connect module
  const { DAppConnector, HederaChainId, HederaJsonRpcMethod, HederaSessionEvent } = await import("@hashgraph/hedera-wallet-connect");

  const network = getNetwork();
  const ledgerId = mapNetworkToLedgerId(network);

  const metadata = {
    name: "Hedera Agent App",
    description: "HITL signing via Hedera WalletConnect",
    url: window.location.origin,
    icons: ["https://avatars.githubusercontent.com/u/31002956"],
  };

  connectorSingleton = new DAppConnector(
    metadata,
    ledgerId,
    projectId,
    Object.values(HederaJsonRpcMethod),
    [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
    // Allow both Hedera Native chain ids; wallets handle the selected session chain
    [HederaChainId.Mainnet, HederaChainId.Testnet]
  );

  return connectorSingleton;
}

export async function ensureWalletConnector(
  logger: "error" | "warn" | "info" = "warn",
) {
  const c = await initWalletConnector();
  if (!c) {
    throw new Error("WalletConnect cannot be initialized on the server.");
  }
  if (!c.walletConnectClient) {
    await c.init({ logger });
  }
  return c;
}

export async function connectWallet(): Promise<void> {
  const c = await ensureWalletConnector();
  await c.openModal();
}

export async function disconnectAllSessions(): Promise<void> {
  const c = await ensureWalletConnector();
  await c.disconnectAll();
}

/**
 * Returns the first paired Hedera account id (shard.realm.num) from the active WalletConnect session.
 * Throws if no session is connected.
 */
export async function getPairedAccountId(): Promise<string> {
  const c = await ensureWalletConnector("warn");
  type WalletConnectClientLike = {
    session?: {
      getAll?: () => Array<{
        namespaces?: {
          hedera?: {
            accounts?: string[];
          };
        };
      }>;
    };
  };
  const wc = (c as unknown as { walletConnectClient?: WalletConnectClientLike })
    .walletConnectClient;
  // WalletConnect v2 sessions live under client.session.getAll()
  const sessions = wc?.session?.getAll?.() ?? [];
  const accounts: string[] = [];
  for (const s of sessions) {
    const ns = s?.namespaces?.hedera;
    if (ns?.accounts && Array.isArray(ns.accounts)) {
      accounts.push(...ns.accounts);
    }
  }
  // Fallback: attempt to read from connector signers shape if present
  if (
    accounts.length === 0 &&
    (c as unknown as { signers?: Array<{ accounts?: string[] }> }).signers
  ) {
    const signers =
      (c as unknown as { signers?: Array<{ accounts?: string[] }> }).signers ??
      [];
    for (const signer of signers) {
      if (Array.isArray(signer.accounts)) accounts.push(...signer.accounts);
    }
  }
  if (accounts.length === 0) {
    throw new Error(
      "No connected wallet session. Please connect your wallet first.",
    );
  }
  // accounts are HIP-30 identifiers like "hedera:testnet:0.0.1234" → return the trailing account id
  const first = accounts[0];
  const parts = String(first).split(":");
  const accountId = parts[parts.length - 1];
  if (!accountId) {
    throw new Error("Invalid account ID format in wallet session.");
  }
  return accountId;
}

export function toBase64(bytes: Uint8Array | ArrayBuffer): string {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (typeof window === "undefined") {
    return Buffer.from(u8).toString("base64");
  }
  let binary = "";
  u8.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

export function fromBase64(base64: string): Uint8Array {
  if (typeof window === "undefined") {
    return new Uint8Array(Buffer.from(base64, "base64"));
  }
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

export async function signAndExecuteBytes(params: {
  bytes: Uint8Array | ArrayBuffer;
  accountId: string;
}) {
  const c = await ensureWalletConnector();
  const network = getNetwork();
  const hip30 = toHip30AccountId(network, params.accountId);
  const base64 = toBase64(params.bytes);

  return c.signAndExecuteTransaction({
    signerAccountId: hip30,
    transactionList: base64,
  });
}
