import { v4 as uuidv4 } from "uuid";
import {
  AgentExecutor,
  ExecutionEventBus,
  RequestContext,
} from "@a2a-js/sdk/server";
import { Task, TaskStatusUpdateEvent, TextPart } from "@a2a-js/sdk";
import { LangGraphAgentAdapter } from "./adapter.js";

function toTextPart(text: string): TextPart {
  return { kind: "text", text };
}

function getUserText(context: RequestContext): string {
  const userMessage = context.userMessage;
  const text = (userMessage.parts || [])
    .filter((p): p is TextPart => p.kind === "text")
    .map((p) => p.text)
    .join("\n")
    .trim();

  return text;
}

export class LangGraphAgentExecutor implements AgentExecutor {
  constructor(private readonly adapter: LangGraphAgentAdapter) {}

  async cancelTask(): Promise<void> {
    throw new Error("Cancel operation is not supported.");
  }

  async execute(
    requestContext: RequestContext,
    eventBus: ExecutionEventBus,
  ): Promise<void> {
    const userMessage = requestContext.userMessage;
    const existingTask = requestContext.task;

    const taskId = existingTask?.id || uuidv4();
    const contextId =
      userMessage.contextId || existingTask?.contextId || uuidv4();

    if (!existingTask) {
      const initialTask: Task = {
        kind: "task",
        id: taskId,
        contextId,
        status: {
          state: "submitted",
          timestamp: new Date().toISOString(),
        },
        history: [userMessage],
        metadata: userMessage.metadata,
      };

      eventBus.publish(initialTask);
    }

    const query = getUserText(requestContext);

    eventBus.publish({
      kind: "status-update",
      taskId,
      contextId,
      status: {
        state: "working",
        message: {
          kind: "message",
          role: "agent",
          messageId: uuidv4(),
          parts: [toTextPart("Processing request...")],
          taskId,
          contextId,
        },
        timestamp: new Date().toISOString(),
      },
      final: false,
    } satisfies TaskStatusUpdateEvent);

    try {
      const result = await this.adapter.run(query);
      const state = result.requireUserInput
        ? "input-required"
        : result.isTaskComplete
          ? "completed"
          : "working";

      eventBus.publish({
        kind: "status-update",
        taskId,
        contextId,
        status: {
          state,
          message: {
            kind: "message",
            role: "agent",
            messageId: uuidv4(),
            parts: [toTextPart(result.content)],
            taskId,
            contextId,
          },
          timestamp: new Date().toISOString(),
        },
        final: state !== "working",
      } satisfies TaskStatusUpdateEvent);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      eventBus.publish({
        kind: "status-update",
        taskId,
        contextId,
        status: {
          state: "failed",
          message: {
            kind: "message",
            role: "agent",
            messageId: uuidv4(),
            parts: [toTextPart(`Agent error: ${message}`)],
            taskId,
            contextId,
          },
          timestamp: new Date().toISOString(),
        },
        final: true,
      } satisfies TaskStatusUpdateEvent);
    }
  }
}
