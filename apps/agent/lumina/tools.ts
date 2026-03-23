import { AccountId, Client } from "@hashgraph/sdk";

import {
  AgentMode,
  HederaLangchainToolkit,
  type Context,
} from "hedera-agent-kit";

export const hederaToolkit = new HederaLangchainToolkit({
  client: Client.forTestnet(),
  configuration: {
    context: {
      mode: AgentMode.RETURN_BYTES,
    },
    plugins: [],
  },
});

export const TOOLS: any[] = [...(hederaToolkit.getTools() as any[])];
