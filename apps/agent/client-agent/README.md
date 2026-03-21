# Client Agent with A2A Multi-Agent Routing

This is a ReAct agent implemented using [LangGraph.js](https://github.com/langchain-ai/langgraphjs) with intelligent routing to remote A2A specialist agents. The client agent can delegate complex queries to specialized remote agents like Lumina (DeFi research specialist) and automatically routes requests to the most appropriate agent.

![Graph view in LangGraph studio UI](./static/studio_ui.png)

## Architecture

The client agent uses a **multi-agent A2A architecture** where:

1. **Client Agent** - Main ReAct agent that handles user queries and coordinates tool execution
2. **Remote A2A Agents** - Specialized agents (Lumina, etc.) that handle domain-specific queries
3. **Smart Routing** - Automatic agent selection based on query type and content

The core logic is defined in:

- `graph.ts` - LangGraph ReAct workflow
- `tools.ts` - Tool integration and A2A delegation
- `agents-config.ts` - Remote agent registry and routing configuration

## Agent Flow

1. User query enters the client agent
2. LLM reasons about the query
3. If specialized knowledge is needed, the `ask_remote_agent_tool` is invoked
4. The system intelligently routes to the best available remote agent based on:
   - Query keywords (protocol → DeFi research, risk → risk assessment, etc.)
   - Agent specializations
   - User's preferred agent (optional)
5. Remote agent's response is incorporated into the final answer

## Supported Remote Agents

### Lumina (DeFi Research Specialist)

- **URL**: `http://localhost:10003` (configurable via `LUMINA_AGENT_URL`)
- **Specializations**: DeFi research, market analysis, risk assessment
- **Best for**: Protocol analysis, tokenomics, yield strategies, liquidity assessment

## Adding New Remote Agents

To add a new remote agent to the network:

### 1. Update [agents-config.ts](./agents-config.ts)

Add your agent to the `REMOTE_AGENTS` registry:

```typescript
export const REMOTE_AGENTS: Record<string, RemoteAgent> = {
  lumina: {
    /* existing config */
  },

  // Add your new agent here:
  my_new_agent: {
    id: "my_new_agent",
    name: "My New Agent",
    url: process.env.MY_NEW_AGENT_URL ?? "http://localhost:10004",
    specializations: ["market_analysis", "portfolio_management"],
    description: "Specialized description of what this agent does",
    enabled: true,
  },
};
```

### 2. Update Specialization Keywords

Add keywords to `SPECIALIZATION_KEYWORDS` so the system can intelligently route queries:

```typescript
export const SPECIALIZATION_KEYWORDS: Record<AgentSpecialization, string[]> = {
  // ... existing specializations ...
  portfolio_management: [
    "portfolio",
    "allocation",
    "rebalance",
    "diversify",
    // Add your agent's keywords
  ],
};
```

### 3. Set Environment Variable

In your `.env` file:

```env
MY_NEW_AGENT_URL=http://your-agent-url:port
```

## Configuration

Create a `.env` file with:

```bash
cp .env.example .env
```

Key variables:

```env
# Remote A2A Agents
LUMINA_AGENT_URL=http://localhost:10003

# Hedera Network
HEDERA_NETWORK=testnet
ACCOUNT_ID=your-account-id

# LLM Configuration
ANTHROPIC_API_KEY=your-key
```

## Getting Started

```yaml
model: anthropic/claude-3-7-sonnet-latest
```

Follow the instructions below to get set up, or pick one of the additional options.

#### Anthropic

To use Anthropic's chat models:

1. Sign up for an [Anthropic API key](https://console.anthropic.com/) if you haven't already.
2. Once you have your API key, add it to your `.env` file:

```
ANTHROPIC_API_KEY=your-api-key
```

#### OpenAI

To use OpenAI's chat models:

1. Sign up for an [OpenAI API key](https://platform.openai.com/signup).
2. Once you have your API key, add it to your `.env` file:

```
OPENAI_API_KEY=your-api-key
```

<!--
End setup instructions
-->

3. Customize whatever you'd like in the code.
4. Open the folder in LangGraph Studio!

## How to customize

1. **Add new tools**: Extend the agent's capabilities by adding new tools in [`./tools.ts`](./tools.ts). These can be any TypeScript functions that perform specific tasks.
2. **Select a different model**: We default to Anthropic's Claude 3.5 Sonnet. You can select a compatible chat model using `provider/model-name` via configuration, then installing the proper [chat model integration package](https://js.langchain.com/docs/integrations/chat/). Example: `openai/gpt-4-turbo-preview`, then run `npm i @langchain/openai`.
3. **Customize the prompt**: We provide a default system prompt in [`./prompts.ts`](./prompts.ts). You can easily update this via configuration in the studio.

You can also quickly extend this template by:

- Modifying the agent's reasoning process in [`./graph.ts`](./graph.ts).
- Adjusting the ReAct loop or adding additional steps to the agent's decision-making process.

## Development

While iterating on your graph, you can edit past state and rerun your app from past states to debug specific nodes. Local changes will be automatically applied via hot reload. Try adding an interrupt before the agent calls tools, updating the default system message in [`./configuration.ts`](./configuration.ts) to take on a persona, or adding additional nodes and edges!

Follow up requests will be appended to the same thread. You can create an entirely new thread, clearing previous history, using the `+` button in the top right.

You can find the latest (under construction) docs on [LangGraph](https://langchain-ai.github.io/langgraphjs/) here, including examples and other references. Using those guides can help you pick the right patterns to adapt here for your use case.

LangGraph Studio also integrates with [LangSmith](https://smith.langchain.com/) for more in-depth tracing and collaboration with teammates.

[^1]: https://js.langchain.com/docs/concepts#tools

<!--
Configuration auto-generated by `langgraph template lock`. DO NOT EDIT MANUALLY.
{
  "config_schemas": {
    "agent": {
      "type": "object",
      "properties": {
        "model": {
          "type": "string",
          "default": "anthropic/claude-3-7-sonnet-latest",
          "description": "The name of the language model to use for the agent's main interactions. Should be in the form: provider/model-name.",
          "environment": [
            {
              "value": "anthropic/claude-1.2",
              "variables": "ANTHROPIC_API_KEY"
            },
            {
              "value": "anthropic/claude-2.0",
              "variables": "ANTHROPIC_API_KEY"
            },
            {
              "value": "anthropic/claude-2.1",
              "variables": "ANTHROPIC_API_KEY"
            },
            {
              "value": "anthropic/claude-3-7-sonnet-latest",
              "variables": "ANTHROPIC_API_KEY"
            },
            {
              "value": "anthropic/claude-3-5-haiku-latest",
              "variables": "ANTHROPIC_API_KEY"
            },
            {
              "value": "anthropic/claude-3-opus-20240229",
              "variables": "ANTHROPIC_API_KEY"
            },
            {
              "value": "anthropic/claude-3-sonnet-20240229",
              "variables": "ANTHROPIC_API_KEY"
            },
            {
              "value": "anthropic/claude-instant-1.2",
              "variables": "ANTHROPIC_API_KEY"
            },
            {
              "value": "openai/gpt-3.5-turbo",
              "variables": "OPENAI_API_KEY"
            },
            {
              "value": "openai/gpt-3.5-turbo-0125",
              "variables": "OPENAI_API_KEY"
            },
            {
              "value": "openai/gpt-3.5-turbo-0301",
              "variables": "OPENAI_API_KEY"
            },
            {
              "value": "openai/gpt-3.5-turbo-0613",
              "variables": "OPENAI_API_KEY"
            },
            {
              "value": "openai/gpt-3.5-turbo-1106",
              "variables": "OPENAI_API_KEY"
            },
            {
              "value": "openai/gpt-3.5-turbo-16k",
              "variables": "OPENAI_API_KEY"
            },
            {
              "value": "openai/gpt-3.5-turbo-16k-0613",
              "variables": "OPENAI_API_KEY"
            },
            {
              "value": "openai/gpt-4",
              "variables": "OPENAI_API_KEY"
            },
            {
              "value": "openai/gpt-4-0125-preview",
              "variables": "OPENAI_API_KEY"
            },
            {
              "value": "openai/gpt-4-0314",
              "variables": "OPENAI_API_KEY"
            },
            {
              "value": "openai/gpt-4-0613",
              "variables": "OPENAI_API_KEY"
            },
            {
              "value": "openai/gpt-4-1106-preview",
              "variables": "OPENAI_API_KEY"
            },
            {
              "value": "openai/gpt-4-32k",
              "variables": "OPENAI_API_KEY"
            },
            {
              "value": "openai/gpt-4-32k-0314",
              "variables": "OPENAI_API_KEY"
            },
            {
              "value": "openai/gpt-4-32k-0613",
              "variables": "OPENAI_API_KEY"
            },
            {
              "value": "openai/gpt-4-turbo",
              "variables": "OPENAI_API_KEY"
            },
            {
              "value": "openai/gpt-4-turbo-preview",
              "variables": "OPENAI_API_KEY"
            },
            {
              "value": "openai/gpt-4-vision-preview",
              "variables": "OPENAI_API_KEY"
            },
            {
              "value": "openai/gpt-4o",
              "variables": "OPENAI_API_KEY"
            },
            {
              "value": "openai/gpt-4o-mini",
              "variables": "OPENAI_API_KEY"
            }
          ]
        }
      },
      "environment": [
        "TAVILY_API_KEY"
      ]
    }
  }
}
-->
