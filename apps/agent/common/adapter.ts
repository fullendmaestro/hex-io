import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { getLastMessageText } from "./message-utils.js";

export type AgentRunResult = {
  isTaskComplete: boolean;
  requireUserInput: boolean;
  content: string;
};

export class LangGraphAgentAdapter {
  constructor(
    private readonly agent: {
      invoke: (input: {
        messages: BaseMessage[];
      }) => Promise<{ messages: BaseMessage[] }>;
    },
  ) {}

  async run(query: string): Promise<AgentRunResult> {
    if (!query?.trim()) {
      return {
        isTaskComplete: false,
        requireUserInput: true,
        content: "Please provide a valid request.",
      };
    }

    const result = await this.agent.invoke({
      messages: [new HumanMessage(query)],
    });

    const content = getLastMessageText(result.messages);

    return {
      isTaskComplete: true,
      requireUserInput: false,
      content: content || "Completed.",
    };
  }

  static readonly SUPPORTED_CONTENT_TYPES = ["text", "text/plain"] as const;
}
