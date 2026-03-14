import { AccountId, Client } from "@hashgraph/sdk";
import {
  AgentMode,
  HederaLangchainToolkit,
  type Context,
} from "hedera-agent-kit";

type HederaNetwork = "mainnet" | "testnet";

function getHederaNetwork(): HederaNetwork {
  return process.env.HEDERA_NETWORK === "mainnet" ? "mainnet" : "testnet";
}

function createHederaClient(network: HederaNetwork): Client {
  return network === "mainnet" ? Client.forMainnet() : Client.forTestnet();
}

function createToolkitContext(): Context {
  const context: Context = {
    mode: AgentMode.RETURN_BYTES,
  };

  const configuredAccountId = process.env.ACCOUNT_ID;
  if (configuredAccountId) {
    context.accountId = AccountId.fromString(configuredAccountId).toString();
  }

  return context;
}

const hederaToolkit = new HederaLangchainToolkit({
  client: createHederaClient(getHederaNetwork()),
  configuration: {
    context: createToolkitContext(),
    plugins: [],
  },
});

export const TOOLS: any[] = hederaToolkit.getTools() as any[];
