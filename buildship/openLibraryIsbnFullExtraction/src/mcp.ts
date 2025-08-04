
import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { executeTool } from "./buildship/execute-tool.js";
import { z } from "zod";

const server = new McpServer({ name: "openLibraryIsbnFullExtraction", version: "1.0.0" });
server.tool("openLibraryIsbnToSupabaseUpsert", "", { isbn: z.string().describe("The ISBN to fetch (required)") }, async (inputs) => { return await executeTool("openLibraryIsbnFullExtraction", inputs); });


const transport = new StdioServerTransport();
await server.connect(transport);
