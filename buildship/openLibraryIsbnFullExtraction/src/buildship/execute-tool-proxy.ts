import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { getBuildShipFile } from "./files/index.js";
import { BuildShipBase64File } from "./files/buildship-base64-file.js";

export async function executeTool(url: string, args: any): Promise<CallToolResult> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      BUILDSHIP_API_KEY: process.env.BUILDSHIP_API_KEY || "",
    },
    body: JSON.stringify(args),
  });

  if (!response.ok) {
    return {
      content: [
        {
          type: "text",
          text: await response.text(),
        },
      ],
      isError: true,
    };
  }

  if (response.headers.get("content-type")?.includes("json")) {
    const jsonResponse = await response.clone().json();

    if ("type" in jsonResponse && "file" in jsonResponse) {
      // Response is a BuildShipFile
      const mimeType = jsonResponse.mimetype ?? jsonResponse.metadata?.mimetype;

      if (mimeType && mimeType.includes("image")) {
        const buildshipFile = await getBuildShipFile("")(jsonResponse);
        const file = (await buildshipFile.convertTo("base64")()) as BuildShipBase64File;
        return {
          content: [
            {
              type: "image",
              data: file.file,
              mimeType,
            },
          ],
        };
      }

      if (mimeType && mimeType.includes("audio")) {
        const buildshipFile = await getBuildShipFile("")(jsonResponse);
        const file = (await buildshipFile.convertTo("base64")()) as BuildShipBase64File;
        return {
          content: [
            {
              type: "audio",
              data: file.file,
              mimeType,
            },
          ],
        };
      }
    }
  }

  return {
    content: [
      {
        type: "text",
        text: await response.text(),
      },
    ],
    isError: false,
  };
}
