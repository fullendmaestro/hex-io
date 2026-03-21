import { initChatModel } from "langchain/chat_models/universal";
import { ChatOllama } from "@langchain/ollama";

export async function loadChatModel(modelName?: string) {
  if (process.env.LLM_PROVIDER === "ollama") {
    const baseUrl = process.env.OLLAMA_BASE_URL;
    if (!baseUrl) {
      throw new Error("OLLAMA_BASE_URL is required when LLM_PROVIDER=ollama");
    }

    return new ChatOllama({
      baseUrl,
      model: process.env.OLLAMA_MODEL || modelName || "llama3.1",
      headers: process.env.OLLAMA_API_KEY
        ? { Authorization: `Bearer ${process.env.OLLAMA_API_KEY}` }
        : undefined,
    });
  }

  if (process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY) {
    return initChatModel(
      modelName || process.env.AZURE_OPENAI_MODEL_NAME || "gpt-4o-mini",
      {
        modelProvider: "azure_openai",
        azureOpenAIApiDeploymentName:
          modelName || process.env.AZURE_OPENAI_MODEL_NAME || "gpt-4o-mini",
        azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
        azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
        azureOpenAIApiVersion:
          process.env.AZURE_OPENAI_API_VERSION || "2024-06-01",
      },
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "Missing model credentials. Configure OPENAI_API_KEY, or Azure OpenAI env vars, or LLM_PROVIDER=ollama.",
    );
  }

  return initChatModel(modelName || process.env.OPENAI_MODEL || "gpt-4o-mini", {
    modelProvider: "openai",
    apiKey: process.env.OPENAI_API_KEY,
  });
}
