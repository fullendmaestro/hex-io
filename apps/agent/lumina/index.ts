import express from "express";
import { v4 as uuidv4 } from "uuid"; // For generating unique IDs
import { AIMessage, HumanMessage } from "@langchain/core/messages";

import {
  AgentCard,
  Task,
  TaskStatusUpdateEvent,
  TextPart,
  Message,
} from "@a2a-js/sdk";
import {
  InMemoryTaskStore,
  TaskStore,
  AgentExecutor,
  RequestContext,
  ExecutionEventBus,
  DefaultRequestHandler,
} from "@a2a-js/sdk/server"; // Import server components
import { A2AExpressApp } from "@a2a-js/sdk/server/express";
import { graph } from "./graph/index.js";

import * as dotenv from "dotenv";
dotenv.config();

if (
  !process.env.OPENAI_API_KEY &&
  !(process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY) &&
  process.env.LLM_PROVIDER !== "ollama"
) {
  throw new Error(
    "Configure OPENAI_API_KEY, Azure OpenAI env vars, or LLM_PROVIDER=ollama before starting Lumina.",
  );
}

class DefiResearchAgentExecutor implements AgentExecutor {
  private cancelledTasks = new Set<string>();

  public cancelTask = async (
    taskId: string,
    eventBus: ExecutionEventBus,
  ): Promise<void> => {
    this.cancelledTasks.add(taskId);
  };

  async execute(
    requestContext: RequestContext,
    eventBus: ExecutionEventBus,
  ): Promise<void> {
    const userMessage = requestContext.userMessage;
    const existingTask = requestContext.task;

    const taskId = existingTask?.id || uuidv4();
    const contextId =
      userMessage.contextId || existingTask?.contextId || uuidv4();

    console.log(
      `[DefiResearchAgentExecutor] Processing message ${userMessage.messageId} for task ${taskId} (context: ${contextId})`,
    );

    if (!existingTask) {
      const initialTask: Task = {
        kind: "task",
        id: taskId,
        contextId: contextId,
        status: {
          state: "submitted",
          timestamp: new Date().toISOString(),
        },
        history: [userMessage],
        metadata: userMessage.metadata,
      };
      eventBus.publish(initialTask);
    }

    const workingStatusUpdate: TaskStatusUpdateEvent = {
      kind: "status-update",
      taskId: taskId,
      contextId: contextId,
      status: {
        state: "working",
        message: {
          kind: "message",
          role: "agent",
          messageId: uuidv4(),
          parts: [{ kind: "text", text: "Researching DeFi question..." }],
          taskId: taskId,
          contextId: contextId,
        },
        timestamp: new Date().toISOString(),
      },
      final: false,
    };
    eventBus.publish(workingStatusUpdate);

    const historyForGraph = existingTask?.history
      ? [...existingTask.history]
      : [];
    if (!historyForGraph.find((m) => m.messageId === userMessage.messageId)) {
      historyForGraph.push(userMessage);
    }

    const messages = historyForGraph
      .map((m) => {
        const text = m.parts
          .filter((p): p is TextPart => p.kind === "text" && !!p.text)
          .map((p) => p.text)
          .join("\n")
          .trim();

        if (!text) return null;

        return m.role === "agent"
          ? new AIMessage(text)
          : new HumanMessage(text);
      })
      .filter((message): message is AIMessage | HumanMessage => !!message);

    if (messages.length === 0) {
      console.warn(
        `[DefiResearchAgentExecutor] No valid text messages found in history for task ${taskId}.`,
      );
      const failureUpdate: TaskStatusUpdateEvent = {
        kind: "status-update",
        taskId: taskId,
        contextId: contextId,
        status: {
          state: "failed",
          message: {
            kind: "message",
            role: "agent",
            messageId: uuidv4(),
            parts: [{ kind: "text", text: "No message found to process." }],
            taskId: taskId,
            contextId: contextId,
          },
          timestamp: new Date().toISOString(),
        },
        final: true,
      };
      eventBus.publish(failureUpdate);
      return;
    }

    try {
      const response = await graph.invoke({ messages });

      if (this.cancelledTasks.has(taskId)) {
        console.log(
          `[DefiResearchAgentExecutor] Request cancelled for task: ${taskId}`,
        );

        const cancelledUpdate: TaskStatusUpdateEvent = {
          kind: "status-update",
          taskId: taskId,
          contextId: contextId,
          status: {
            state: "canceled",
            timestamp: new Date().toISOString(),
          },
          final: true,
        };
        eventBus.publish(cancelledUpdate);
        return;
      }

      const lastMessage = response.messages[response.messages.length - 1];
      const responseText =
        typeof lastMessage?.content === "string"
          ? lastMessage.content
          : Array.isArray(lastMessage?.content)
            ? lastMessage.content
                .map((part) => {
                  if (typeof part === "string") return part;
                  if ("text" in part && typeof part.text === "string") {
                    return part.text;
                  }
                  return "";
                })
                .join("\n")
            : "";
      console.info(
        `[DefiResearchAgentExecutor] Prompt response: ${responseText}`,
      );

      const agentMessage: Message = {
        kind: "message",
        role: "agent",
        messageId: uuidv4(),
        parts: [{ kind: "text", text: responseText || "Completed." }],
        taskId: taskId,
        contextId: contextId,
      };

      const finalUpdate: TaskStatusUpdateEvent = {
        kind: "status-update",
        taskId: taskId,
        contextId: contextId,
        status: {
          state: "completed",
          message: agentMessage,
          timestamp: new Date().toISOString(),
        },
        final: true,
      };
      eventBus.publish(finalUpdate);

      console.log(
        `[DefiResearchAgentExecutor] Task ${taskId} finished with state: completed`,
      );
    } catch (error: unknown) {
      console.error(
        `[DefiResearchAgentExecutor] Error processing task ${taskId}:`,
        error,
      );
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      const errorUpdate: TaskStatusUpdateEvent = {
        kind: "status-update",
        taskId: taskId,
        contextId: contextId,
        status: {
          state: "failed",
          message: {
            kind: "message",
            role: "agent",
            messageId: uuidv4(),
            parts: [{ kind: "text", text: `Agent error: ${errorMessage}` }],
            taskId: taskId,
            contextId: contextId,
          },
          timestamp: new Date().toISOString(),
        },
        final: true,
      };
      eventBus.publish(errorUpdate);
    }
  }
}

const luminaAgentCard: AgentCard = {
  protocolVersion: "0.3.0",
  name: "Lumina DeFi Research Assistant (JS)",
  description:
    "A DeFi research assistant for protocol analysis, risk review, and market context.",
  url: "http://localhost:10003/",
  provider: {
    organization: "A2A Samples",
    url: "https://example.com/a2a-samples",
  },
  version: "1.0.0",
  capabilities: {
    streaming: true,
    pushNotifications: false,
    stateTransitionHistory: false,
  },
  securitySchemes: undefined,
  security: undefined,
  defaultInputModes: ["text"],
  defaultOutputModes: ["text"],
  skills: [
    {
      id: "defi-research",
      name: "DeFi research",
      description: "Analyzes DeFi protocols, token dynamics, and risk signals",
      tags: ["defi", "research", "onchain", "crypto"],
      examples: [
        "Compare the TVL quality and incentive risk of two lending protocols",
        "Summarize key smart contract and liquidity risks for this token",
      ],
      inputModes: ["text"],
      outputModes: ["text"],
    },
  ],
  supportsAuthenticatedExtendedCard: false,
};

async function main() {
  const taskStore: TaskStore = new InMemoryTaskStore();
  const agentExecutor: AgentExecutor = new DefiResearchAgentExecutor();
  const requestHandler = new DefaultRequestHandler(
    luminaAgentCard,
    taskStore,
    agentExecutor,
  );

  const appBuilder = new A2AExpressApp(requestHandler);
  // Type assertion needed due to Express type compatibility between project and SDK versions
  const expressApp = appBuilder.setupRoutes(express() as any);

  const PORT =
    process.env.LUMINA_AGENT_PORT ||
    process.env.CONTENT_EDITOR_AGENT_PORT ||
    10003;
  expressApp.listen(PORT, () => {
    console.log(
      `[LuminaAgent] Server using new framework started on http://localhost:${PORT}`,
    );
    console.log(
      `[LuminaAgent] Agent Card: http://localhost:${PORT}/.well-known/agent-card.json`,
    );
    console.log("[LuminaAgent] Press Ctrl+C to stop the server");
  });
}

main().catch(console.error);
