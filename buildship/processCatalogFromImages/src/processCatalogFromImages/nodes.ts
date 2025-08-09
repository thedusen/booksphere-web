export const nodes = [
  {
    "label": " \"Process AI Cataloging",
    "inputs": {
      "type": "object",
      "structure": [
        {
          "id": "jobId",
          "parentId": null,
          "index": "0",
          "depth": "0"
        },
        {
          "parentId": null,
          "index": "1",
          "id": "supabaseUrl",
          "depth": "0"
        },
        {
          "depth": "0",
          "index": "2",
          "id": "supabaseServiceKey",
          "parentId": null
        },
        {
          "depth": "0",
          "index": "3",
          "id": "geminiApiKey",
          "parentId": null
        }
      ],
      "properties": {
        "jobId": {
          "title": "jobId",
          "type": "string",
          "buildship": {
            "defaultExpressionType": "text",
            "index": "0",
            "sensitive": false
          }
        },
        "supabaseUrl": {
          "title": "supabaseUrl",
          "buildship": {
            "sensitive": false,
            "index": "1",
            "defaultExpressionType": "text"
          },
          "type": "string"
        },
        "supabaseServiceKey": {
          "buildship": {
            "defaultExpressionType": "text",
            "index": "2",
            "sensitive": false
          },
          "type": "string",
          "title": "supabaseServiceKey"
        },
        "geminiApiKey": {
          "type": "string",
          "buildship": {
            "sensitive": false,
            "defaultExpressionType": "text",
            "index": "3"
          },
          "title": "geminiApiKey"
        }
      },
      "required": [],
      "sections": {}
    },
    "output": {
      "buildship": {},
      "properties": {
        "success": {
          "type": "boolean",
          "buildship": {
            "index": "0"
          },
          "title": "success"
        },
        "errorMessage": {
          "buildship": {
            "index": "1"
          },
          "title": "errorMessage",
          "type": "string"
        }
      },
      "title": "output",
      "type": "object"
    },
    "id": "71bba3b8-ff76-40fe-9d31-f2ea33ad138e",
    "onFail": {
      "behavior": "terminate",
      "nodes": [
        {
          "meta": {
            "id": "d4e476b1-11a0-4ea3-9bbf-09e1a42576bf",
            "name": "Starter Script",
            "description": "The Starter Script, as the name suggests, provides a blank node for adding custom logic to your workflow. \n\nClick the “code” button to configure the node. The Node Editor will open up. \n\n**Node Logic**  \nDefine the custom behavior of the node. This logic is typically written in JavaScript/TypeScript. \n\n**Inputs**  \nDefine the inputs for the node. Later in the workflow, you can pass in the values for these inputs. \n\n**Output**  \nSpecify the output format of the node (String, number, boolean, Array, Object, File) \n\n**Metadata**  \nInfo about the node (Name, ID, description, icon) \n\nLearn more about the Starter Script: [Docs](https://docs.buildship.com/core-nodes/script)"
          },
          "output": {
            "title": "output",
            "buildship": {},
            "type": "string"
          },
          "label": "Starter Script",
          "id": "d4e476b1-11a0-4ea3-9bbf-09e1a42576bf",
          "inputs": {
            "type": "object",
            "properties": {
              "name": {
                "buildship": {
                  "sensitive": false,
                  "index": "0"
                },
                "title": "name",
                "type": "string"
              }
            },
            "required": []
          },
          "script": "import { createClient } from \"@supabase/supabase-js\";\n\nexport default async function (\n  { jobId, errorMessage, supabaseUrl, supabaseServiceKey }: NodeInputs,\n  { logging }: NodeScriptOptions\n) {\n    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);\n    await supabaseAdmin\n        .from('cataloging_jobs')\n        .update({ status: 'failed', error_message: errorMessage })\n        .eq('job_id', jobId);\n    logging.log(`Set job ${jobId} to 'failed'.`);\n    return;\n}",
          "type": "script",
          "description": "The Starter Script, as the name suggests, provides a blank node for adding custom logic to your workflow. \n\nClick the “code” button to configure the node. The Node Editor will open up. \n\n**Node Logic**  \nDefine the custom behavior of the node. This logic is typically written in JavaScript/TypeScript. \n\n**Inputs**  \nDefine the inputs for the node. Later in the workflow, you can pass in the values for these inputs. \n\n**Output**  \nSpecify the output format of the node (String, number, boolean, Array, Object, File) \n\n**Metadata**  \nInfo about the node (Name, ID, description, icon) \n\nLearn more about the Starter Script: [Docs](https://docs.buildship.com/core-nodes/script)"
        }
      ]
    },
    "meta": {
      "id": "71bba3b8-ff76-40fe-9d31-f2ea33ad138e",
      "description": "The Starter Script, as the name suggests, provides a blank node for adding custom logic to your workflow. \n\nClick the “code” button to configure the node. The Node Editor will open up. \n\n**Node Logic**  \nDefine the custom behavior of the node. This logic is typically written in JavaScript/TypeScript. \n\n**Inputs**  \nDefine the inputs for the node. Later in the workflow, you can pass in the values for these inputs. \n\n**Output**  \nSpecify the output format of the node (String, number, boolean, Array, Object, File) \n\n**Metadata**  \nInfo about the node (Name, ID, description, icon) \n\nLearn more about the Starter Script: [Docs](https://docs.buildship.com/core-nodes/script)",
      "name": "Starter Script"
    },
    "type": "script",
    "script": "import { createClient } from \"@supabase/supabase-js\";\nimport fetch from \"node-fetch\";\n\nexport default async function (\n  { jobId, supabaseUrl, supabaseServiceKey, geminiApiKey }: NodeInputs,\n  { logging }: NodeScriptOptions\n): Promise<NodeOutput> {\n\n  // --- FIX: Robustly extract the UUID string from the input ---\n  // This handles cases where jobId is an object { \"jobId\": \"...\" } or already a plain string.\n  const jobUUID = typeof jobId === 'object' && jobId !== null && jobId.jobId ? jobId.jobId : jobId;\n\n  logging.log(`--- Starting Job Processing (v4 - Final): ${jobUUID} ---`);\n\n  // Initialize the Supabase client with the service_role key to bypass RLS\n  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);\n\n  try {\n    // Check for null or undefined jobId early to prevent errors\n    if (!jobUUID) {\n      throw new Error(\"Job ID is null, undefined, or could not be extracted. Halting execution.\");\n    }\n\n    // --- FIX: Use the corrected jobUUID variable in all queries ---\n    await supabaseAdmin.from('cataloging_jobs').update({ status: 'processing' }).eq('job_id', jobUUID);\n    logging.log(\"Set status to 'processing'.\");\n\n    const { data: jobDetails, error: fetchError } = await supabaseAdmin.from('cataloging_jobs').select('image_urls').eq('job_id', jobUUID).single();\n    if (fetchError) {\n      // Provide a more informative error message that includes the failing UUID.\n      throw new Error(`Failed to fetch details for job ${jobUUID}: ${fetchError.message}`);\n    }\n    logging.log(\"Fetched image URLs successfully.\");\n\n    // This is the prompt template you provided, in XML format.\n    const promptText = `<prompt>\n<system_instruction>\nYour sole task is to act as an expert antiquarian bookseller and master cataloger. You will be provided with URLs for up to three images of a single book: a cover, a title page, and a copyright page. Your mission is to meticulously analyze these images to extract detailed bibliographic information and return it only in the specified raw JSON format.\n</system_instruction>\n\n<bibliographic_authority_hierarchy>\nYou MUST adhere to the following strict hierarchy of sources when extracting data. When information between sources conflicts, the higher-authority source is always correct.\n\n1.  **For Title, Subtitle, and Contributors (Authors, Editors, etc.):**\n    * **Definitive Source:** The **Title Page**. This page is the absolute source of truth for the full title, subtitle, and the names of all contributors.\n    * **Supporting Source:** The Cover. Use the cover only to confirm spellings if the title page is difficult to read. If there is any discrepancy in wording or contributors between the cover and the title page, the title page is ALWAYS correct.\n    * **Capitalization Rule:** Extract capitalization **exactly as it appears on the Title Page**. If the title page itself uses all-caps for stylistic reasons, you must then convert it to standard \"Title Case\" capitalization (e.g., \"A Thousand Plateaus,\" not \"A THOUSAND PLATEAUS\").\n\n2.  **For Edition, Publication Year, and Printing Information:**\n    * **Definitive Source:** The **Copyright Page**. This is the only reliable source for identifying the edition and publication year.\n    * **Specific Fields:**\n        * `publication_year`: Use the latest copyright date (e.g., ©1987).\n        * `edition_statement`: Look for explicit phrases (\"First Edition\") or the number line. Report the lowest digit on the number line to determine the printing.\n\n3.  **For Publisher and Publication Location:**\n    * **Primary Source:** The **Title Page**.\n    * **Secondary Source:** The Copyright Page. If the publisher is not on the title page, use the copyright page.\n\n4.  **For Dust Jacket Presence (`has_dust_jacket`):**\n    * **Definitive Source:** The **Cover Image**. This is a purely visual assessment. Is a paper dust jacket visible on the book? This can only be determined from the main cover photo.\n\n</bibliographic_authority_hierarchy>\n\n<field_instructions>\n-   title: (string) The full main title of the book. Must follow the hierarchy and capitalization rules.\n-   subtitle: (string | null) The subtitle, if present. Must follow the hierarchy and capitalization rules.\n-   authors: (array of objects | null) An array for all contributors. If none are found, return null.\n    -   name: (string) The full name of the person from the Title Page.\n    -   role: (string) The contributor's role (e.g., \"Author,\" \"Illustrator,\" \"Editor,\" \"Translator,\" \"Introduction\"). Default to \"Author\" if no role is specified.\n-   publisher: (string | null) The publisher's name, following the hierarchy rules.\n-   publication_year: (number | null) The year of publication, from the Copyright Page only.\n-   publication_location: (string | null) The city where the publisher is located, following the hierarchy rules.\n-   edition_statement: (string | null) Any explicit statement from the Copyright Page (e.g., \"First Edition\"). If a number line is the only evidence, report it (e.g., \"Number line indicates 2nd printing\").\n-   has_dust_jacket: (boolean) Based only on the cover image, is a dust jacket present? True for hardcovers with a paper wrapper, false otherwise.\n</field_instructions>\n<data_handling_rules>\n-   If information for a field is not present on any image, the value must be null.\n-   If information is present but illegible (blurry, obscured), the value must be the string \"unreadable\".\n-   Crucially, you must completely IGNORE any handwritten text or stickers.\n</data_handling_rules>\n<output_constraints>\nYour entire response MUST be only the raw JSON object conforming to the schema below. Do not output any text, explanations, greetings, or markdown formatting like \\`json\\` before or after the object.\n</output_constraints>\n</prompt>`;\n\n    // Fetch images and convert to base64\n    const imageFetchPromises = Object.values(jobDetails.image_urls).map(async (url) => {\n        const response = await fetch(url);\n        if (!response.ok) throw new Error(`Failed to fetch image from URL: ${url}`);\n        const buffer = await response.arrayBuffer();\n        if (buffer.byteLength === 0) {\n            throw new Error(`Data Integrity Error: Fetched 0-byte file from URL: ${url}.`);\n        }\n        return {\n            inlineData: {\n                mimeType: \"image/jpeg\",\n                data: Buffer.from(new Uint8Array(buffer)).toString(\"base64\")\n            }\n        };\n    });\n    const imageParts = await Promise.all(imageFetchPromises);\n    \n    // Construct the request body using the native Gemini API format\n    const requestBody = {\n        contents: [{\n            role: \"user\",\n            parts: [\n                { text: promptText },\n                { text: `JSON Schema: { \"title\": \"string | null\", \"subtitle\": \"string | null\", \"authors\": [{ \"name\": \"string\", \"role\": \"string\" }], \"publisher\": \"string | null\", \"publication_year\": \"number | null\", \"publication_location\": \"string | null\", \"edition_statement\": \"string | null\", \"has_dust_jacket\": \"boolean | null\" }` },\n                ...imageParts\n            ]\n        }]\n    };\n\n    const model = \"gemini-1.5-pro-latest\"; // Using latest for best performance\n    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;\n\n    logging.log(`Calling Gemini API for job ${jobUUID}`);\n    \n    const geminiResponse = await fetch(geminiApiUrl, {\n        method: 'POST',\n        headers: { 'Content-Type': 'application/json' },\n        body: JSON.stringify(requestBody)\n    });\n\n    if (!geminiResponse.ok) {\n        const errorBody = await geminiResponse.text();\n        throw new Error(`Gemini API call failed: ${geminiResponse.status} ${errorBody}`);\n    }\n    \n    const geminiResult = await geminiResponse.json();\n    \n    if (!geminiResult.candidates || !geminiResult.candidates[0].content.parts[0].text) {\n        logging.error(\"Invalid response structure from Gemini:\", geminiResult);\n        throw new Error(\"AI returned an unexpected response structure.\");\n    }\n\n    const rawText = geminiResult.candidates[0].content.parts[0].text.replace(/```json|```/g, \"\").trim();\n    const extractedData = JSON.parse(rawText);\n    logging.log(\"Parsed AI response:\", JSON.stringify(extractedData, null, 2));\n\n    const firstAuthor = extractedData.authors && extractedData.authors.length > 0 ? extractedData.authors[0].name : null;\n    const { data: matched_edition_ids, error: rpcError } = await supabaseAdmin.rpc('match_book_by_details', {\n        p_title: extractedData.title,\n        p_author_name: firstAuthor,\n        p_publication_year: extractedData.publication_year\n    });\n\n    if (rpcError) {\n        logging.error(\"RPC Error Details:\", JSON.stringify(rpcError, null, 2));\n        throw new Error(`RPC 'match_book_by_details' failed: ${rpcError.message}`);\n    }\n    \n    logging.log(`Matched against database. Found ${matched_edition_ids?.length || 0} matches.`);\n\n    // --- FIX: Use the corrected jobUUID variable ---\n    await supabaseAdmin.from('cataloging_jobs').update({\n        status: 'completed',\n        extracted_data: extractedData,\n        matched_edition_ids: matched_edition_ids || []\n    }).eq('job_id', jobUUID);\n    logging.log(\"--- Job Completed Successfully ---\");\n\n    return {\n      success: true,\n      errorMessage: null\n    };\n\n  } catch (error) {\n    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error, Object.getOwnPropertyNames(error));\n    logging.error(\"--- Job Failed ---\");\n    logging.error(\"Caught Error:\", errorMessage);\n\n    if (jobUUID) {\n        // --- FIX: Use the corrected jobUUID variable ---\n        await supabaseAdmin\n            .from('cataloging_jobs')\n            .update({ status: 'failed', error_message: errorMessage })\n            .eq('job_id', jobUUID);\n    }\n\n    return {\n      success: false,\n      errorMessage: errorMessage\n    };\n  }\n}",
    "description": "The Starter Script, as the name suggests, provides a blank node for adding custom logic to your workflow. \n\nClick the “code” button to configure the node. The Node Editor will open up. \n\n**Node Logic**  \nDefine the custom behavior of the node. This logic is typically written in JavaScript/TypeScript. \n\n**Inputs**  \nDefine the inputs for the node. Later in the workflow, you can pass in the values for these inputs. \n\n**Output**  \nSpecify the output format of the node (String, number, boolean, Array, Object, File) \n\n**Metadata**  \nInfo about the node (Name, ID, description, icon) \n\nLearn more about the Starter Script: [Docs](https://docs.buildship.com/core-nodes/script)",
    "enableScriptInputs": false
  },
  {
    "id": "1c96d9de-a172-4913-8840-4c9f226f55d1",
    "type": "output",
    "label": "Flow Output"
  }
]