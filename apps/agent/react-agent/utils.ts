import { initChatModel } from "langchain/chat_models/universal";
import { ChatOllama } from "@langchain/ollama";

/**
 * Load chat model (Azure OpenAI or Ollama based on .env configuration).
 * @param modelName - The deployment name or model name.
 * @returns A chat model instance.
 */
export async function loadChatModel(modelName?: string) {
  if (process.env.LLM_PROVIDER === "ollama") {
    const baseUrl = process.env.OLLAMA_BASE_URL;
    if (!baseUrl) {
      throw new Error("OLLAMA_BASE_URL is required when AI_PROVIDER=ollama");
    }
    const model = process.env.OLLAMA_MODEL || "llama3.1";


    return new ChatOllama({
      baseUrl,
      model,
      headers: {
        Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
      },
    });
  }

  return await initChatModel(
    modelName || process.env.AZURE_OPENAI_MODEL_NAME!,
    {
      modelProvider: "azure_openai",
      azureOpenAIApiDeploymentName:
        modelName || process.env.AZURE_OPENAI_MODEL_NAME!,
      azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT!,
      azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY!,
      azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION!,
    }
  );
}
