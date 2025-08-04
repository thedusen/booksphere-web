import { randomUUID } from "crypto";
import { getBuildShipFile } from "./files/index.js";
import { executeWorkflow } from "./utils.js";
export async function executeTool(workflowName, args) {
    try {
        const output = await executeWorkflow(workflowName, args);
        if (typeof output === "object" && "type" in output && "file" in output) {
            const buildshipFile = await getBuildShipFile(randomUUID())(output);
            const base64BuildshipFile = (await buildshipFile.convertTo("base64")());
            const mimeType = buildshipFile.metadata?.mimetype;
            if (mimeType && mimeType.includes("image")) {
                return {
                    content: [
                        {
                            type: "image",
                            data: base64BuildshipFile.file,
                            mimeType,
                        },
                    ],
                };
            }
            if (mimeType && mimeType.includes("audio")) {
                return {
                    content: [
                        {
                            type: "audio",
                            data: base64BuildshipFile.file,
                            mimeType,
                        },
                    ],
                };
            }
            // Other types are not supported by Claude or MCP clients
        }
        return {
            content: [
                {
                    type: "text",
                    text: typeof output !== "string" ? JSON.stringify(output, null, 2) : output,
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: error.message,
                },
            ],
            isError: true,
        };
    }
}
