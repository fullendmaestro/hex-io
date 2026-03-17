import { Client } from "@langchain/langgraph-sdk";

export function createClient(apiUrl: string, apiKey: string | undefined, jwt?: string) {
  const config: any = { apiUrl };
  if (jwt) {
    config.defaultHeaders = { Authorization: `Bearer ${jwt}` };
  } else if (apiKey) {
    config.apiKey = apiKey;
  }
  return new Client(config);
}
