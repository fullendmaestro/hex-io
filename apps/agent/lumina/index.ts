import express from "express";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AgentExecutor,
  DefaultRequestHandler,
  InMemoryTaskStore,
  TaskStore,
} from "@a2a-js/sdk/server";
import { A2AExpressApp } from "@a2a-js/sdk/server/express";
import { LangGraphAgentAdapter } from "../common/adapter.js";
import { LangGraphAgentExecutor } from "../common/agent-executor.js";
import { luminaAgentCard } from "./card.js";
import { TOOLS } from "./tools.js";
import { graph } from "./graph.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });
dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function main() {
  const host = "localhost";
  const port = process.env.LUMINA_AGENT_PORT || 10003;

  console.log("[LuminaAgent] Boot diagnostics", {
    cwd: process.cwd(),
    nodeEnv: process.env.NODE_ENV || "undefined",
    hederaNetwork: process.env.HEDERA_NETWORK || "undefined",
    azureModel: process.env.AZURE_OPENAI_MODEL_NAME || "undefined",
    luminaAgentPort: process.env.LUMINA_AGENT_PORT || "undefined",
    envLangsmithSet: !!process.env.LANGSMITH_API_KEY,
  });

  const adapter = new LangGraphAgentAdapter(graph as any);
  const agentExecutor: AgentExecutor = new LangGraphAgentExecutor(adapter);

  const taskStore: TaskStore = new InMemoryTaskStore();
  const requestHandler = new DefaultRequestHandler(
    luminaAgentCard,
    taskStore,
    agentExecutor,
  );
  const appBuilder = new A2AExpressApp(requestHandler);
  const expressApp = appBuilder.setupRoutes(express() as any);

  expressApp.use((req, res, next) => {
    const startedAt = Date.now();
    console.log(`[LuminaAgent] -> ${req.method} ${req.originalUrl}`);
    res.on("finish", () => {
      console.log(
        `[LuminaAgent] <- ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - startedAt}ms`,
      );
    });
    next();
  });

  expressApp.listen(port, () => {
    console.log(`[LuminaAgent] Server started on http://${host}:${port}`);
    console.log(
      `[LuminaAgent] Agent Card: http://${host}:${port}/.well-known/agent-card.json`,
    );
    console.log(`[LuminaAgent] Registered tools: ${TOOLS.length}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
