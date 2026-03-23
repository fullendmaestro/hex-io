import express from "express";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { AgentCard } from "@a2a-js/sdk";
import {
  AgentExecutor,
  DefaultRequestHandler,
  InMemoryTaskStore,
  TaskStore,
} from "@a2a-js/sdk/server";
import { A2AExpressApp } from "@a2a-js/sdk/server/express";
import { loadChatModel } from "../common/model.js";
import { LangGraphAgentAdapter } from "../common/adapter.js";
import { LangGraphAgentExecutor } from "../common/agent-executor.js";
import { neuralxAgentCard } from "./card.js";
import { TOOLS } from "./tools.js";
import { SYSTEM_PROMPT_TEMPLATE } from "./prompts.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });
dotenv.config({ path: path.join(__dirname, "..", ".env") });

function getWeather(cityName: string): string {
  return `${cityName} is Sunny`;
}

async function createWeatherAgent() {
  return createReactAgent({
    name: "neuralx",
    llm: await loadChatModel(
      process.env.AZURE_OPENAI_MODEL_NAME ?? "gpt-5-mini",
    ),
    tools: TOOLS,
    prompt: SYSTEM_PROMPT_TEMPLATE,
  });
}

async function main() {
  const host = "localhost";
  const port = Number(process.env.NEURALX_AGENT_PORT || 10004);

  console.log("[NeuralX] Boot diagnostics", {
    cwd: process.cwd(),
    nodeEnv: process.env.NODE_ENV || "undefined",
    hederaNetwork: process.env.HEDERA_NETWORK || "undefined",
    azureModel: process.env.AZURE_OPENAI_MODEL_NAME || "undefined",
    neuralxAgentPort: process.env.NEURALX_AGENT_PORT || "undefined",
    envLangsmithSet: !!process.env.LANGSMITH_API_KEY,
  });

  const agentGraph = await createWeatherAgent();
  const adapter = new LangGraphAgentAdapter(agentGraph as any);
  const agentExecutor: AgentExecutor = new LangGraphAgentExecutor(adapter);

  const taskStore: TaskStore = new InMemoryTaskStore();
  const requestHandler = new DefaultRequestHandler(
    neuralxAgentCard,
    taskStore,
    agentExecutor,
  );
  const appBuilder = new A2AExpressApp(requestHandler);
  const expressApp = appBuilder.setupRoutes(express() as any);

  expressApp.use((req, res, next) => {
    const startedAt = Date.now();
    console.log(`[NeuralX] -> ${req.method} ${req.originalUrl}`);
    res.on("finish", () => {
      console.log(
        `[NeuralX] <- ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - startedAt}ms`,
      );
    });
    next();
  });

  expressApp.listen(port, () => {
    console.log(`[NeuralX] Server started on http://${host}:${port}`);
    console.log(
      `[NeuralX] Agent Card: http://${host}:${port}/.well-known/agent-card.json`,
    );
    console.log(`[NeuralX] Registered tools: ${TOOLS.length}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
