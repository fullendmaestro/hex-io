import { initChatModel } from "langchain/chat_models/universal";

/**
 * Load Azure OpenAI chat model using universal chat model initializer.
 * @param modelName - The deployment name of the Azure OpenAI model.
 * @returns A chat model instance.
 */
export async function loadChatModel(modelName?: string) {
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
