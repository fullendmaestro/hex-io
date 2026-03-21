import { RunnableConfig } from "@langchain/core/runnables";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";

import { ConfigurationSchema, ensureConfiguration } from "./configuration.js";
import { loadChatModel } from "./utils.js";

async function callModel(
  state: typeof MessagesAnnotation.State,
  config: RunnableConfig,
): Promise<typeof MessagesAnnotation.Update> {
  const configuration = ensureConfiguration(config);
  const model = await loadChatModel(configuration.model);

  const response = await model.invoke([
    {
      role: "system",
      content: configuration.systemPromptTemplate,
    },
    ...state.messages,
  ]);

  return { messages: [response] };
}

const workflow = new StateGraph(MessagesAnnotation, ConfigurationSchema)
  .addNode("callModel", callModel as any)
  .addEdge("__start__", "callModel")
  .addEdge("callModel", "__end__");

export const graph = workflow.compile();
