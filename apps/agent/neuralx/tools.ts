import { AccountId, Client } from "@hashgraph/sdk";
import { saucerswapPlugin } from "hak-saucerswap-plugin";

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
    plugins: [saucerswapPlugin],
  },
});

export const TOOLS: any[] = [...(hederaToolkit.getTools() as any[])];
