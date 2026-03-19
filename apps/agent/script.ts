// index.js
import { Client, PrivateKey } from "@hashgraph/sdk";
import { HederaLangchainToolkit, AgentMode } from "hedera-agent-kit";
import { zodToJsonSchema } from "zod-to-json-schema";
import fs from "fs/promises";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  // 1. Hedera client setup (Required to initialize the toolkit)
  const client = Client.forTestnet().setOperator(
    process.env.ACCOUNT_ID,
    PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY),
  );

  // 2. Prepare Hedera toolkit in Human-in-the-loop mode
  const hederaAgentToolkit = new HederaLangchainToolkit({
    client,
    configuration: {
      tools: [], // Add specific tools here if needed
      plugins: [], // Add plugins here
      context: {
        mode: AgentMode.HUMAN_IN_THE_LOOP,
      },
    },
  });

  // 3. Fetch tools from the toolkit
  const tools = hederaAgentToolkit.getTools();

  // 4. Generate Markdown documentation for Tools
  console.log("Extracting tool schemas and generating Markdown file...");
  let markdownContent = "# Hedera Agent Kit Tools (Human in the Loop Mode)\n\n";
  markdownContent += `*Generated on: ${new Date().toLocaleString()}*\n\n---\n\n`;

  for (const tool of tools) {
    markdownContent += `## 🛠️ ${tool.name}\n\n`;
    markdownContent += `**Description:** ${tool.description}\n\n`;

    // Extract Input Schema using zod-to-json-schema
    if (tool.schema) {
      const inputSchema = zodToJsonSchema(tool.schema, {
        target: "jsonSchema7",
      });
      markdownContent += `### Input Schema\n\`\`\`json\n${JSON.stringify(inputSchema, null, 2)}\n\`\`\`\n\n`;
    } else {
      markdownContent += `### Input Schema\n*No structured Zod schema provided for this tool.*\n\n`;
    }

    markdownContent += `### Output\nReturns a \`string\` representing the execution result to the agent.\n\n`;
    markdownContent += `---\n\n`;
  }

  // 5. Save to .md file
  const outputPath = "hedera_tools_schema.md";
  await fs.writeFile(outputPath, markdownContent);
  console.log(`✅ Tool schemas successfully saved to ${outputPath}\n`);
}

main().catch(console.error);
