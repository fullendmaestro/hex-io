import { AgentCard, Part } from "@a2a-js/sdk";
import { ClientFactory } from "@a2a-js/sdk/client";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

type A2AToolResult = Record<string, unknown>;

function partsToText(parts: Part[] | undefined): string {
  if (!parts?.length) return "";

  return parts
    .map((part) => (part.kind === "text" ? part.text || "" : ""))
    .filter(Boolean)
    .join("\n")
    .trim();
}

function normalizeUrlCandidate(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    // Try assuming http when scheme is omitted (e.g. localhost:10003)
  }

  try {
    return new URL(`http://${value}`).origin;
  } catch {
    return null;
  }
}

function getConfiguredAgentAliasUrl(alias: string): string | null {
  const normalizedAlias = alias.trim().toLowerCase();
  const aliasMap: Record<string, string | undefined> = {
    lumina: process.env.LUMINA_AGENT_URL,
    neuralx: process.env.NEURALX_AGENT_URL,
  };

  const candidate = aliasMap[normalizedAlias];
  if (!candidate) return null;
  return normalizeUrlCandidate(candidate);
}

export class A2AClientToolProvider {
  private readonly discoveredAgents = new Map<string, AgentCard>();
  private readonly clientFactory = new ClientFactory();
  private readonly clientCache = new Map<
    string,
    Promise<Awaited<ReturnType<ClientFactory["createFromUrl"]>>>
  >();

  constructor(private readonly knownAgentUrls: string[] = []) {}

  get tools() {
    return [
      new DynamicStructuredTool({
        name: "a2a_discover_agent",
        description: "Discover an A2A agent and return its agent card by URL.",
        schema: z.object({ url: z.string().min(1) }),
        func: async (input) => {
          const rawUrl = (input as { url: string }).url;
          let resolvedUrl = getConfiguredAgentAliasUrl(rawUrl);

          // If alias does not match, treat input as URL/host:port.
          if (!resolvedUrl) {
            resolvedUrl = normalizeUrlCandidate(rawUrl);
          }

          if (!resolvedUrl) {
            return {
              status: "error",
              url: rawUrl,
              error:
                "Invalid agent URL/alias. Use lumina, neuralx, a full URL like http://localhost:10003, or host:port.",
            };
          }

          return this.discoverAgent(resolvedUrl);
        },
      }),
      new DynamicStructuredTool({
        name: "a2a_list_discovered_agents",
        description: "List all discovered A2A agents.",
        schema: z.object({}),
        func: async () => this.listDiscoveredAgents(),
      }),
      new DynamicStructuredTool({
        name: "a2a_send_message",
        description:
          "Send a message to a target A2A agent and return the response. Accepts full URL, host:port, or alias like lumina/neuralx.",
        schema: z.object({
          message_text: z.string().min(1),
          target_agent_url: z.string().min(1),
        }),
        func: async (input) => {
          const typed = input as {
            message_text: string;
            target_agent_url: string;
          };
          const resolvedTargetUrl = await this.resolveTargetAgentUrl(
            typed.target_agent_url,
          );
          return this.sendMessage(typed.message_text, resolvedTargetUrl);
        },
      }),
    ];
  }

  private async resolveTargetAgentUrl(target: string): Promise<string> {
    const normalizedTarget = target.trim().toLowerCase();
    if (!normalizedTarget) {
      throw new Error("target_agent_url is required.");
    }

    // Resolve configured aliases first (e.g. lumina -> LUMINA_AGENT_URL).
    const aliasResolvedUrl = getConfiguredAgentAliasUrl(target);
    if (aliasResolvedUrl) {
      return aliasResolvedUrl;
    }

    // Fast path for direct URL / host:port inputs.
    const directUrl = normalizeUrlCandidate(target);
    if (directUrl) {
      return directUrl;
    }

    await this.ensureKnownAgentsDiscovered();

    // Match by discovered card name or discovered URL substring.
    for (const [url, card] of this.discoveredAgents.entries()) {
      const cardName = String(
        (card as { name?: string }).name || "",
      ).toLowerCase();
      const discoveredUrl = url.toLowerCase();
      if (
        cardName.includes(normalizedTarget) ||
        discoveredUrl.includes(normalizedTarget)
      ) {
        return url;
      }
    }

    throw new Error(
      `Could not resolve target agent '${target}'. Use a full URL (http://host:port), host:port, or alias like lumina.`,
    );
  }

  private async getOrCreateClient(url: string) {
    if (!this.clientCache.has(url)) {
      this.clientCache.set(url, this.clientFactory.createFromUrl(url));
    }

    return this.clientCache.get(url)!;
  }

  private async fetchAgentCard(url: string): Promise<AgentCard> {
    const cardUrl = `${url.replace(/\/$/, "")}/.well-known/agent-card.json`;
    const response = await fetch(cardUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch agent card from ${cardUrl}: ${response.status}`,
      );
    }

    return (await response.json()) as AgentCard;
  }

  private async ensureKnownAgentsDiscovered() {
    if (!this.knownAgentUrls.length) return;

    await Promise.all(
      this.knownAgentUrls.map(async (url) => {
        if (!this.discoveredAgents.has(url)) {
          await this.discoverAgent(url);
        }
      }),
    );
  }

  async discoverAgent(url: string): Promise<A2AToolResult> {
    try {
      if (this.discoveredAgents.has(url)) {
        const existing = this.discoveredAgents.get(url)!;
        return {
          status: "success",
          url,
          agent_card: existing,
        };
      }

      const card = await this.fetchAgentCard(url);
      this.discoveredAgents.set(url, card);

      return {
        status: "success",
        url,
        agent_card: card,
      };
    } catch (error: unknown) {
      return {
        status: "error",
        url,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async listDiscoveredAgents(): Promise<A2AToolResult> {
    await this.ensureKnownAgentsDiscovered();

    return {
      status: "success",
      total_count: this.discoveredAgents.size,
      agents: [...this.discoveredAgents.values()],
    };
  }

  async sendMessage(
    messageText: string,
    targetAgentUrl: string,
  ): Promise<A2AToolResult> {
    try {
      await this.ensureKnownAgentsDiscovered();

      if (!this.discoveredAgents.has(targetAgentUrl)) {
        await this.discoverAgent(targetAgentUrl);
      }

      const client = await this.getOrCreateClient(targetAgentUrl);

      const response = await client.sendMessage({
        message: {
          kind: "message",
          role: "user",
          messageId: uuidv4(),
          parts: [{ kind: "text", text: messageText }],
        },
      });

      if (response.kind === "message") {
        return {
          status: "success",
          response_text: partsToText(response.parts),
          response,
          target_agent_url: targetAgentUrl,
        };
      }

      return {
        status: "success",
        response,
        target_agent_url: targetAgentUrl,
      };
    } catch (error: unknown) {
      return {
        status: "error",
        target_agent_url: targetAgentUrl,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
