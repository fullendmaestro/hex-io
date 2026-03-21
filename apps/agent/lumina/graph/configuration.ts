import { RunnableConfig } from "@langchain/core/runnables";
import { Annotation } from "@langchain/langgraph";
import { SYSTEM_PROMPT_TEMPLATE } from "./prompts.js";

export const ConfigurationSchema = Annotation.Root({
  systemPromptTemplate: Annotation<string>,
  model: Annotation<string>,
});

export function ensureConfiguration(
  config: RunnableConfig,
): typeof ConfigurationSchema.State {
  const configurable = config.configurable ?? {};

  return {
    systemPromptTemplate:
      configurable.systemPromptTemplate ?? SYSTEM_PROMPT_TEMPLATE,
    model:
      configurable.model ??
      process.env.OPENAI_MODEL ??
      process.env.AZURE_OPENAI_MODEL_NAME ??
      "gpt-4o-mini",
  };
}
