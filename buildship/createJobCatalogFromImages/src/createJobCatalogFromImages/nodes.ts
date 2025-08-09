export const nodes = [
  {
    "description": "The Starter Script, as the name suggests, provides a blank node for adding custom logic to your workflow. \n\nClick the “code” button to configure the node. The Node Editor will open up. \n\n**Node Logic**  \nDefine the custom behavior of the node. This logic is typically written in JavaScript/TypeScript. \n\n**Inputs**  \nDefine the inputs for the node. Later in the workflow, you can pass in the values for these inputs. \n\n**Output**  \nSpecify the output format of the node (String, number, boolean, Array, Object, File) \n\n**Metadata**  \nInfo about the node (Name, ID, description, icon) \n\nLearn more about the Starter Script: [Docs](https://docs.buildship.com/core-nodes/script)",
    "inputs": {
      "sections": {},
      "type": "object",
      "required": [],
      "structure": [
        {
          "parentId": null,
          "index": "0",
          "depth": "0",
          "id": "apiUrl"
        },
        {
          "depth": "0",
          "id": "apiKey",
          "index": "1",
          "parentId": null
        },
        {
          "depth": "0",
          "parentId": null,
          "index": "2",
          "id": "authToken"
        },
        {
          "parentId": null,
          "index": "3",
          "id": "imageUrls",
          "depth": "0"
        }
      ],
      "properties": {
        "imageUrls": {
          "title": "imageUrls",
          "buildship": {
            "index": "3",
            "sensitive": false,
            "defaultExpressionType": "text"
          },
          "type": "object",
          "properties": {}
        },
        "authToken": {
          "type": "string",
          "title": "authToken",
          "buildship": {
            "index": "2",
            "defaultExpressionType": "text",
            "sensitive": false
          }
        },
        "apiUrl": {
          "buildship": {
            "defaultExpressionType": "text",
            "index": "0",
            "sensitive": false
          },
          "title": "apiUrl",
          "type": "string"
        },
        "apiKey": {
          "title": "apiKey",
          "buildship": {
            "sensitive": false,
            "index": "1",
            "defaultExpressionType": "text"
          },
          "type": "string"
        }
      }
    },
    "script": "import { createClient } from \"@supabase/supabase-js\";\n\nexport default async function callRpcWithUserToken(\n  { apiUrl, apiKey, authToken, imageUrls }: NodeInputs,\n  { logging }: NodeScriptOptions\n): Promise<NodeOutput> {\n\n  if (!apiUrl || !apiKey || !authToken || !imageUrls) {\n    throw new Error(\"Missing one or more required inputs: apiUrl, apiKey, authToken, imageUrls.\");\n  }\n\n  // Initialize the Supabase client with the public anon key.\n  const supabase = createClient(apiUrl, apiKey);\n\n  // ✅ THE FIX: Use the modern `setSession` method instead of the deprecated `setAuth`.\n  // This takes the raw token and prepares the client to act on the user's behalf.\n  // We provide a dummy refresh token as it's required but not used for a single call.\n  const { error: sessionError } = await supabase.auth.setSession({\n    access_token: authToken,\n    refresh_token: authToken, // Passing the access token again is a common pattern here.\n  });\n\n  if (sessionError) {\n    logging.error(\"Failed to set user session:\", sessionError);\n    throw new Error(`Session Error: ${sessionError.message}`);\n  }\n\n  logging.log(\"User session set successfully. Calling 'create_cataloging_job' RPC...\");\n\n  // Call the RPC function. The client will now automatically use the token we just set.\n  const { data, error } = await supabase.rpc('create_cataloging_job', {\n    image_urls_payload: imageUrls\n  });\n\n  if (error) {\n    logging.error(\"RPC call failed:\", error);\n    throw new Error(`RPC Error: ${error.message}`);\n  }\n\n  logging.log(\"RPC call successful. New Job ID:\", data);\n\n  // The RPC function directly returns the new job ID.\n  return {\n    jobId: data,\n  };\n}",
    "label": "RPC - Create Cataloging Job",
    "output": {
      "buildship": {},
      "type": "string",
      "title": "jobId"
    },
    "meta": {
      "description": "The Starter Script, as the name suggests, provides a blank node for adding custom logic to your workflow. \n\nClick the “code” button to configure the node. The Node Editor will open up. \n\n**Node Logic**  \nDefine the custom behavior of the node. This logic is typically written in JavaScript/TypeScript. \n\n**Inputs**  \nDefine the inputs for the node. Later in the workflow, you can pass in the values for these inputs. \n\n**Output**  \nSpecify the output format of the node (String, number, boolean, Array, Object, File) \n\n**Metadata**  \nInfo about the node (Name, ID, description, icon) \n\nLearn more about the Starter Script: [Docs](https://docs.buildship.com/core-nodes/script)",
      "id": "02e280a4-720a-4d46-9555-7168e37d930f",
      "name": "Starter Script"
    },
    "onFail": {
      "continue": false,
      "behavior": "customFlow",
      "nodes": [
        {
          "properties": {},
          "type": "output",
          "label": "Output",
          "description": "The Output Node returns values from the flow and handles HTTP response codes.  \nThe default configuration is to return the previous node output. But you can specify any custom output to return variables from other nodes or JavaScript expressions. \n\nLearn more about the Output node: [Docs](https://docs.buildship.com/core-nodes/return)",
          "id": "7692989a-76aa-4db2-8bd8-939532ec9ec5",
          "required": []
        }
      ]
    },
    "id": "02e280a4-720a-4d46-9555-7168e37d930f",
    "type": "script"
  },
  {
    "output": {
      "description": "The output from the executed flow",
      "buildship": {},
      "title": "Output"
    },
    "label": "Execute BuildShip Workflow",
    "type": "call-workflow",
    "description": "Execute a BuildShip workflow from another workflow within your current workspace. [Docs](https://docs.buildship.com/core-nodes/execute-workflow)",
    "id": "ad747a32-f7d9-499f-9131-f13ef428f99a",
    "workflowId": "PfIaYgyc6ed7ujfUlboJ",
    "inputs": {
      "type": "object",
      "properties": {},
      "required": []
    }
  },
  {
    "type": "output",
    "id": "0f6cd667-647e-4aad-9df0-630fda15f7cf",
    "label": "Output",
    "description": "The Output Node returns values from the flow and handles HTTP response codes.  \nThe default configuration is to return the previous node output. But you can specify any custom output to return variables from other nodes or JavaScript expressions. \n\nLearn more about the Output node: [Docs](https://docs.buildship.com/core-nodes/return)",
    "properties": {},
    "required": []
  },
  {
    "meta": {
      "name": "Download",
      "icon": {
        "svg": "<svg viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><g id=\"SVGRepo_bgCarrier\" stroke-width=\"0\"></g><g id=\"SVGRepo_tracerCarrier\" stroke-linecap=\"round\" stroke-linejoin=\"round\"></g><g id=\"SVGRepo_iconCarrier\"> <path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M8 10C8 7.79086 9.79086 6 12 6C14.2091 6 16 7.79086 16 10V11H17C18.933 11 20.5 12.567 20.5 14.5C20.5 16.433 18.933 18 17 18H16.9C16.3477 18 15.9 18.4477 15.9 19C15.9 19.5523 16.3477 20 16.9 20H17C20.0376 20 22.5 17.5376 22.5 14.5C22.5 11.7793 20.5245 9.51997 17.9296 9.07824C17.4862 6.20213 15.0003 4 12 4C8.99974 4 6.51381 6.20213 6.07036 9.07824C3.47551 9.51997 1.5 11.7793 1.5 14.5C1.5 17.5376 3.96243 20 7 20H7.1C7.65228 20 8.1 19.5523 8.1 19C8.1 18.4477 7.65228 18 7.1 18H7C5.067 18 3.5 16.433 3.5 14.5C3.5 12.567 5.067 11 7 11H8V10ZM13 11C13 10.4477 12.5523 10 12 10C11.4477 10 11 10.4477 11 11V16.5858L9.70711 15.2929C9.31658 14.9024 8.68342 14.9024 8.29289 15.2929C7.90237 15.6834 7.90237 16.3166 8.29289 16.7071L11.2929 19.7071C11.6834 20.0976 12.3166 20.0976 12.7071 19.7071L15.7071 16.7071C16.0976 16.3166 16.0976 15.6834 15.7071 15.2929C15.3166 14.9024 14.6834 14.9024 14.2929 15.2929L13 16.5858V11Z\" fill=\"#000000\"></path> </g></svg>",
        "type": "SVG"
      },
      "id": "download-url",
      "description": "Downloads a file from an external URL"
    },
    "script": "import fetch from 'node-fetch';\nimport fs from 'fs';\nimport path from 'path';\nimport mime from 'mime-types';\nimport {\n    pipeline\n} from 'stream';\nimport {\n    promisify\n} from 'util';\nimport {\n    Storage\n} from '@google-cloud/storage';\n\nconst streamPipeline = promisify(pipeline);\n\nasync function folderExists(bucket, folderPath) {\n    const [exists] = await bucket.file(folderPath + '/').exists();\n    return exists;\n}\n\nasync function createFolders(bucket, folders) {\n    let currentPath = '';\n    for (const folder of folders) {\n        currentPath = path.join(currentPath, folder);\n        const exists = await folderExists(bucket, currentPath);\n        if (!exists) {\n            const file = bucket.file(currentPath + '/');\n            try {\n                await file.save('');\n                console.log(`Folder \"${currentPath}\" created successfully.`);\n            } catch (error) {\n                console.error(`Error creating folder \"${currentPath}\":`, error);\n                throw error;\n            }\n        }\n    }\n}\n\nexport default async function download({\n    url\n}: NodeInputs, { getBuildShipFile }: NodeScriptOptions): NodeOutput {\n    try {\n        const response = await fetch(url);\n        if (!response.ok) {\n            throw new Error(`Failed to fetch ${url}: ${response.statusText}`);\n        }\n\n        const contentType = response.headers.get(\"content-type\");\n        const ext = mime.extension(contentType);\n\n        const storage = new Storage();\n        const bucket = storage.bucket(process.env.BUCKET);\n        const downloadsDir = 'downloads';\n\n        await createFolders(bucket, [downloadsDir]);\n\n        const uniqueName = `file-${Date.now()}.${ext}`;\n        const outputPath = path.join(downloadsDir, uniqueName);\n\n        const file = bucket.file(outputPath);\n        await streamPipeline(response.body, file.createWriteStream());\n\n        const downloadedFile =  getBuildShipFile({\n            type: 'local-file',\n            file: process.env.BUCKET_FOLDER_PATH + '/' + outputPath\n        });\n      return downloadedFile;\n    } catch (error) {\n        throw new Error(`Download failed: ${error}`);\n    }\n}",
    "type": "script",
    "output": {
      "title": "File",
      "buildship": {
        "isFile": true,
        "index": "0"
      },
      "type": "object"
    },
    "_libRef": {
      "integrity": "v3:7b296adeaa9bf89c39b75dc994fac505",
      "libType": "public",
      "version": "7.0.0",
      "libNodeRefId": "@buildship/download-url",
      "isDirty": false,
      "src": "https://storage.googleapis.com/buildship-app-us-central1/publicLib/nodesV2/@buildship/download-url/7.0.0/build.cjs",
      "buildHash": "51d1689583190341403b36e9cf7e89a4ab27af41911fa6e112407c6fd5e1abf2"
    },
    "dependencies": {
      "@google-cloud/storage": "5.20.5",
      "mime-types": "2.1.35",
      "util": "0.12.5",
      "path": "0.12.7",
      "node-fetch": "2.7.0",
      "fs": "0.0.2",
      "stream": "0.0.2"
    },
    "inputs": {
      "type": "object",
      "properties": {
        "url": {
          "properties": {},
          "buildship": {
            "sensitive": false,
            "index": "0",
            "defaultExpressionType": "text"
          },
          "description": "URL of file to download",
          "pattern": "",
          "type": "string",
          "default": "https://i.guim.co.uk/img/media/39d44cc85f8d772f78bef7b3ee124cb38e25016c/0_0_4629_3177/master/4629.jpg?width=465&dpr=1&s=none&crop=none",
          "title": "URL"
        }
      },
      "required": []
    },
    "integrations": [],
    "id": "00497686-c786-42d2-90af-7c8c57b55aa3",
    "label": "Download Image"
  },
  {
    "meta": {
      "name": "Multimodal",
      "id": "gemini-multimodal",
      "icon": {
        "type": "URL",
        "url": "https://firebasestorage.googleapis.com/v0/b/website-a1s39m.appspot.com/o/buildship-app-logos%2Fgemini.svg?alt=media&token=b81e9afb-b4a9-4136-a2ce-bca08c2a97e8"
      },
      "description": "A keyless node to use Google's Gemini AI to generate text from text-only or text-and-image input. [Full documentation](https://cloud.google.com/vertex-ai/docs/generative-ai/start/quickstarts/quickstart-multimodal)."
    },
    "type": "script",
    "script": "import OpenAI from \"openai\";\nimport { fileTypeFromBuffer } from \"file-type\";\nimport { Storage } from \"@google-cloud/storage\";\n\nexport default async function googleGenerativeAI(\n  { model, prompt, imagePath, kbIntegrationKey }: NodeInputs,\n  { logging, auth, node, workflow }: NodeScriptOptions\n): NodeOutput {\n  const apiKey = await auth.getKey();\n\n  try {\n    // convert file to buffer to get mime type\n    const fileBuffer = await imagePath.convertTo(\"file-buffer\")();\n    const fileMimeType = await fileTypeFromBuffer(fileBuffer.file)\n\n    // convert file input to base64\n    const base64FileInstance = await imagePath.convertTo(\"base64\")();\n\n    const client =\n      kbIntegrationKey?.split(\";;\")[1] === \"credits\"\n        ? new OpenAI({\n            baseURL: \"https://proxy.buildship.run/llm/gemini\",\n            apiKey: await getAccessToken(),\n          })\n        : new OpenAI({\n            baseURL: \"https://generativelanguage.googleapis.com/v1beta/openai\",\n            apiKey,\n          });\n\n    const response = await client.chat.completions.create(\n      {\n        model: model,\n        messages: [\n          {\n            role: \"user\",\n            content: [\n              { type: \"text\", text: prompt },\n              {\n                type: \"image_url\",\n                image_url: {\n                  url: `data:${fileMimeType.mime};base64,${base64FileInstance.file}`,\n                },\n              },\n            ],\n          },\n        ],\n      },\n      {\n        ...(kbIntegrationKey?.split(\";;\")[1] === \"credits\"\n          ? {\n              headers: {\n                \"x-buildship-workflow-id\": workflow?.id,\n                \"x-buildship-node-id\": node?.id,\n              },\n            }\n          : {}),\n      }\n    );\n\n    return response.choices[0].message.content;\n  } catch (error) {\n    logging.log(\"Error:\", error.message);\n    throw error;\n  }\n}\n\nconst getAccessToken = async () => {\n  const response = await fetch(\n    \"http://metadata/computeMetadata/v1/instance/service-accounts/default/token\",\n    { headers: { \"Metadata-Flavor\": \"Google\" } }\n  );\n  if (!response.ok) {\n    throw new Error(`Failed to obtain access token: ${response.statusText}`);\n  }\n  const data = await response.json();\n  return data.access_token;\n};",
    "dependencies": {
      "file-type": "20.4.1",
      "openai": "4.93.0",
      "@google-cloud/storage": "7.7.0"
    },
    "label": "FirstPass",
    "_groupInfo": {
      "uid": "gemini",
      "description": "Google's Gemini AI Nodes and Models.",
      "acceptsKey": true,
      "iconUrl": "https://firebasestorage.googleapis.com/v0/b/website-a1s39m.appspot.com/o/buildship-app-logos%2Fgemini.svg?alt=media&token=b81e9afb-b4a9-4136-a2ce-bca08c2a97e8",
      "id": "gemini",
      "category": "AI Models",
      "name": "Gemini",
      "longDescription": "BuildShip offers integrated nodes to utilize Google's Gemini AI, seamlessly connecting Google's advanced AI models with your own projects. Leverage Gemini for predictive analytics, natural language processing, and machine learning tasks, enabling a range of powerful AI-driven functionalities within your workflows.",
      "keyDescription": "The API Key for the Generative Language Model [here](https://makersuite.google.com/app/apikey)"
    },
    "output": {
      "buildship": {},
      "title": "Generated Text",
      "type": "string",
      "description": "The text generated by Google's Generative AI (Gemini)"
    },
    "id": "1cb1cdea-220e-4386-8b9c-1de0d331110d",
    "_libRef": {
      "libType": "public",
      "integrity": "v3:537dc94da0f15713852da28a829545c9",
      "buildHash": "0a04fb4adbca6e8277c45a0f81689dfc27b9b4ad6938aa2720ed211cd0632271",
      "src": "https://storage.googleapis.com/buildship-app-us-central1/publicLib/nodesV2/@buildship/gemini-multimodal/7.0.1/build.cjs",
      "version": "7.0.1",
      "isDirty": true,
      "libNodeRefId": "@buildship/gemini-multimodal"
    },
    "integrations": [],
    "inputs": {
      "sections": {
        "section_dd2b7bed_08d9_48b4_8dd0_4c9781c05a5f": {
          "title": "Additional setting",
          "buildship": {
            "collapsed": true,
            "collapseByDefault": true,
            "index": "2"
          },
          "type": "section"
        }
      },
      "required": [
        "apiKey",
        "prompt",
        "model"
      ],
      "properties": {
        "prompt": {
          "buildship": {
            "index": "0",
            "sensitive": false
          },
          "default": "Can you describe the composition of the picture?",
          "properties": {},
          "title": "Prompt",
          "description": "The prompt for the generative AI. Eg: Describe the provided image.",
          "pattern": "",
          "type": "string"
        },
        "imagePath": {
          "buildship": {
            "sensitive": false,
            "defaultExpressionType": "text",
            "index": "1",
            "isFile": true
          },
          "properties": {},
          "type": "object",
          "description": "Upload and insert the image using BuildShip's in-built storage.",
          "title": "Image",
          "default": [],
          "pattern": ""
        },
        "model": {
          "default": "gemini-2.5-pro-exp-03-25",
          "enum": [
            "gemini-2.5-pro-exp-03-25",
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-1.5-pro"
          ],
          "description": "The model to use for Gemini AI. Use multimodal node for image input and vision pro model.",
          "type": "string",
          "properties": {},
          "title": "Model",
          "buildship": {
            "index": 2.2,
            "sensitive": false,
            "options": [
              {
                "value": "gemini-2.5-pro-exp-03-25",
                "label": "gemini-2.5-pro-exp-03-25"
              },
              {
                "value": "gemini-2.0-flash",
                "label": "gemini-2.0-flash"
              },
              {
                "label": "gemini-2.0-flash-lite",
                "value": "gemini-2.0-flash-lite"
              },
              {
                "label": "gemini-1.5-pro",
                "value": "gemini-1.5-pro"
              }
            ],
            "defaultExpressionType": "text"
          }
        }
      },
      "structure": [
        {
          "index": "0",
          "id": "prompt",
          "parentId": null,
          "depth": "0"
        },
        {
          "parentId": null,
          "index": "1",
          "depth": "0",
          "id": "imagePath"
        },
        {
          "index": "2",
          "parentId": null,
          "children": [
            {
              "depth": "1",
              "index": "0",
              "parentId": "section_dd2b7bed_08d9_48b4_8dd0_4c9781c05a5f",
              "id": "model"
            }
          ],
          "id": "section_dd2b7bed_08d9_48b4_8dd0_4c9781c05a5f",
          "depth": "0"
        }
      ],
      "type": "object"
    },
    "buildshipKey": true
  },
  {
    "inputs": {
      "properties": {
        "prompt": {
          "pattern": "",
          "title": "Prompt",
          "buildship": {
            "sensitive": false,
            "index": "0"
          },
          "properties": {},
          "type": "string",
          "description": "The prompt for the generative AI. Eg: Describe the provided image.",
          "default": "Can you describe the composition of the picture?"
        },
        "model": {
          "enum": [
            "gemini-2.5-pro-exp-03-25",
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-1.5-pro"
          ],
          "properties": {},
          "default": "gemini-2.5-pro-exp-03-25",
          "title": "Model",
          "description": "The model to use for Gemini AI. Use multimodal node for image input and vision pro model.",
          "type": "string",
          "buildship": {
            "sensitive": false,
            "options": [
              {
                "value": "gemini-2.5-pro-exp-03-25",
                "label": "gemini-2.5-pro-exp-03-25"
              },
              {
                "label": "gemini-2.0-flash",
                "value": "gemini-2.0-flash"
              },
              {
                "value": "gemini-2.0-flash-lite",
                "label": "gemini-2.0-flash-lite"
              },
              {
                "label": "gemini-1.5-pro",
                "value": "gemini-1.5-pro"
              }
            ],
            "defaultExpressionType": "text",
            "index": 2.2
          }
        },
        "imagePath": {
          "title": "Image",
          "properties": {},
          "pattern": "",
          "description": "Upload and insert the image using BuildShip's in-built storage.",
          "buildship": {
            "isFile": true,
            "index": "1",
            "sensitive": false,
            "defaultExpressionType": "text"
          },
          "default": [],
          "type": "object"
        }
      },
      "type": "object",
      "structure": [
        {
          "depth": "0",
          "index": "0",
          "parentId": null,
          "id": "prompt"
        },
        {
          "parentId": null,
          "depth": "0",
          "index": "1",
          "id": "imagePath"
        },
        {
          "index": "2",
          "parentId": null,
          "children": [
            {
              "index": "0",
              "id": "model",
              "parentId": "section_dd2b7bed_08d9_48b4_8dd0_4c9781c05a5f",
              "depth": "1"
            }
          ],
          "id": "section_dd2b7bed_08d9_48b4_8dd0_4c9781c05a5f",
          "depth": "0"
        }
      ],
      "required": [
        "apiKey",
        "prompt",
        "model"
      ],
      "sections": {
        "section_dd2b7bed_08d9_48b4_8dd0_4c9781c05a5f": {
          "type": "section",
          "title": "Additional setting",
          "buildship": {
            "index": "2",
            "collapseByDefault": true,
            "collapsed": true
          }
        }
      }
    },
    "dependencies": {
      "@google-cloud/storage": "7.7.0",
      "file-type": "20.4.1",
      "openai": "4.93.0"
    },
    "script": "import OpenAI from \"openai\";\nimport { fileTypeFromBuffer } from \"file-type\";\nimport { Storage } from \"@google-cloud/storage\";\n\nexport default async function googleGenerativeAI(\n  { model, prompt, imagePath, kbIntegrationKey }: NodeInputs,\n  { logging, auth, node, workflow }: NodeScriptOptions\n): NodeOutput {\n  const apiKey = await auth.getKey();\n\n  try {\n    // convert file to buffer to get mime type\n    const fileBuffer = await imagePath.convertTo(\"file-buffer\")();\n    const fileMimeType = await fileTypeFromBuffer(fileBuffer.file)\n\n    // convert file input to base64\n    const base64FileInstance = await imagePath.convertTo(\"base64\")();\n\n    const client =\n      kbIntegrationKey?.split(\";;\")[1] === \"credits\"\n        ? new OpenAI({\n            baseURL: \"https://proxy.buildship.run/llm/gemini\",\n            apiKey: await getAccessToken(),\n          })\n        : new OpenAI({\n            baseURL: \"https://generativelanguage.googleapis.com/v1beta/openai\",\n            apiKey,\n          });\n\n    const response = await client.chat.completions.create(\n      {\n        model: model,\n        messages: [\n          {\n            role: \"user\",\n            content: [\n              { type: \"text\", text: prompt },\n              {\n                type: \"image_url\",\n                image_url: {\n                  url: `data:${fileMimeType.mime};base64,${base64FileInstance.file}`,\n                },\n              },\n            ],\n          },\n        ],\n      },\n      {\n        ...(kbIntegrationKey?.split(\";;\")[1] === \"credits\"\n          ? {\n              headers: {\n                \"x-buildship-workflow-id\": workflow?.id,\n                \"x-buildship-node-id\": node?.id,\n              },\n            }\n          : {}),\n      }\n    );\n\n    return response.choices[0].message.content;\n  } catch (error) {\n    logging.log(\"Error:\", error.message);\n    throw error;\n  }\n}\n\nconst getAccessToken = async () => {\n  const response = await fetch(\n    \"http://metadata/computeMetadata/v1/instance/service-accounts/default/token\",\n    { headers: { \"Metadata-Flavor\": \"Google\" } }\n  );\n  if (!response.ok) {\n    throw new Error(`Failed to obtain access token: ${response.statusText}`);\n  }\n  const data = await response.json();\n  return data.access_token;\n};",
    "buildshipKey": true,
    "integrations": [],
    "output": {
      "type": "string",
      "buildship": {},
      "title": "Check Work Output",
      "description": "The text generated by Google's Generative AI (Gemini)"
    },
    "id": "b932ef10-4f87-4108-932b-0e3c84705174",
    "type": "script",
    "_groupInfo": {
      "category": "AI Models",
      "keyDescription": "The API Key for the Generative Language Model [here](https://makersuite.google.com/app/apikey)",
      "description": "Google's Gemini AI Nodes and Models.",
      "uid": "gemini",
      "acceptsKey": true,
      "iconUrl": "https://firebasestorage.googleapis.com/v0/b/website-a1s39m.appspot.com/o/buildship-app-logos%2Fgemini.svg?alt=media&token=b81e9afb-b4a9-4136-a2ce-bca08c2a97e8",
      "id": "gemini",
      "name": "Gemini",
      "longDescription": "BuildShip offers integrated nodes to utilize Google's Gemini AI, seamlessly connecting Google's advanced AI models with your own projects. Leverage Gemini for predictive analytics, natural language processing, and machine learning tasks, enabling a range of powerful AI-driven functionalities within your workflows."
    },
    "label": "SecondPass",
    "_libRef": {
      "isDirty": true,
      "buildHash": "0a04fb4adbca6e8277c45a0f81689dfc27b9b4ad6938aa2720ed211cd0632271",
      "libNodeRefId": "@buildship/gemini-multimodal",
      "version": "7.0.1",
      "integrity": "v3:537dc94da0f15713852da28a829545c9",
      "libType": "public",
      "src": "https://storage.googleapis.com/buildship-app-us-central1/publicLib/nodesV2/@buildship/gemini-multimodal/7.0.1/build.cjs"
    },
    "name": "Multimodal",
    "meta": {
      "name": "Multimodal",
      "description": "A keyless node to use Google's Gemini AI to generate text from text-only or text-and-image input. [Full documentation](https://cloud.google.com/vertex-ai/docs/generative-ai/start/quickstarts/quickstart-multimodal).",
      "icon": {
        "url": "https://firebasestorage.googleapis.com/v0/b/website-a1s39m.appspot.com/o/buildship-app-logos%2Fgemini.svg?alt=media&token=b81e9afb-b4a9-4136-a2ce-bca08c2a97e8",
        "type": "URL"
      },
      "id": "gemini-multimodal"
    }
  },
  {
    "condition": true,
    "then": [
      {
        "type": "script",
        "inputs": {
          "properties": {
            "name": {
              "properties": {},
              "buildship": {
                "defaultExpressionType": "text",
                "index": "0",
                "sensitive": false
              },
              "title": "Model Response",
              "type": "string"
            }
          },
          "sections": {},
          "type": "object",
          "structure": [
            {
              "id": "name",
              "index": "0",
              "parentId": null,
              "depth": "0"
            }
          ],
          "required": []
        },
        "id": "857d1268-06b4-4211-9ccc-b6329103447b",
        "meta": {
          "description": "The Starter Script, as the name suggests, provides a blank node for adding custom logic to your workflow. \n\nClick the “code” button to configure the node. The Node Editor will open up. \n\n**Node Logic**  \nDefine the custom behavior of the node. This logic is typically written in JavaScript/TypeScript. \n\n**Inputs**  \nDefine the inputs for the node. Later in the workflow, you can pass in the values for these inputs. \n\n**Output**  \nSpecify the output format of the node (String, number, boolean, Array, Object, File) \n\n**Metadata**  \nInfo about the node (Name, ID, description, icon) \n\nLearn more about the Starter Script: [Docs](https://docs.buildship.com/core-nodes/script)",
          "id": "dfa4487e-64ce-4a51-a972-ba263c6a5f1b",
          "name": "Starter Script"
        },
        "script": "// Define input and output types for the node\ninterface NodeInputs {\n  name: string; // Input parameter: the string containing markdown-formatted JSON\n}\n\n// The output will be the parsed JSON object.\n// In Buildship, you'd set the output type to \"Object\" or \"JSON\".\n// Using 'any' here for simplicity, but a more specific type could be used\n// if the JSON structure is known and consistent.\ntype NodeOutput = any;\n\n// Minimal type definition for NodeScriptOptions based on the template\ninterface NodeScriptOptions {\n  logging: {\n    log: (...args: any[]) => void;\n    error: (...args: any[]) => void;\n    warn: (...args: any[]) => void;\n  };\n  env: any; // Placeholder for environment variable management utility\n  getBuildShipFile: any; // Placeholder for file handling utility\n}\n\nexport default async function (\n  { name }: NodeInputs, // 'name' is the input string with markdown JSON\n  {\n    logging, // Utility for logging during execution\n    // env, // Not used in this specific function\n    // getBuildShipFile, // Not used in this specific function\n  }: NodeScriptOptions,\n): Promise<NodeOutput> { // An async function returns a Promise wrapping the NodeOutput\n\n  const markdownJsonString = name;\n\n  /* Log execution values */\n  logging.log(\"Input Markdown JSON String:\", markdownJsonString);\n\n  if (!markdownJsonString || typeof markdownJsonString !== 'string' || !markdownJsonString.trim()) {\n    const errorMessage = \"Input string is empty or invalid.\";\n    logging.error(errorMessage);\n    throw new Error(errorMessage);\n  }\n\n  try {\n    // Regex to find JSON within ```json ... ``` or ``` ... ```\n    // It handles optional language specifier (like 'json') and potential leading/trailing newlines within the block.\n    const regex = /```(?:json)?\\s*([\\s\\S]*?)\\s*```/;\n    const match = markdownJsonString.match(regex);\n\n    let jsonString;\n\n    if (match && match[1]) {\n      jsonString = match[1].trim(); // Get the captured group (the JSON content) and trim whitespace\n      logging.log(\"Extracted JSON string:\", jsonString);\n    } else {\n      // If no markdown code block is found, assume the input might be plain JSON already,\n      // or it's an error. We'll try to parse it directly as a fallback,\n      // but this might be too lenient depending on requirements.\n      // For stricter parsing, throw an error here if no ```json block is found.\n      logging.warn(\"No Markdown JSON code block found. Attempting to parse input directly as JSON.\");\n      jsonString = markdownJsonString.trim();\n    }\n\n    if (!jsonString) {\n        const noJsonContentError = \"Could not extract any JSON content from the input string.\";\n        logging.error(noJsonContentError);\n        throw new Error(noJsonContentError);\n    }\n\n    // Parse the extracted string into a JavaScript object\n    const parsedJson = JSON.parse(jsonString);\n    logging.log(\"Successfully parsed JSON object.\");\n\n    // Return the parsed JSON object\n    // Ensure your Buildship node output is configured to be of type \"Object\" or \"JSON\"\n    return parsedJson;\n\n  } catch (error: any) {\n    let errorMessage = \"Error processing the JSON string: \";\n    if (error instanceof SyntaxError) {\n      errorMessage += \"Invalid JSON format. \" + error.message;\n    } else {\n      errorMessage += error.message;\n    }\n    logging.error(errorMessage, error.stack);\n    throw new Error(errorMessage); // Re-throw to fail the node execution\n  }\n}\n",
        "description": "The Starter Script, as the name suggests, provides a blank node for adding custom logic to your workflow. \n\nClick the “code” button to configure the node. The Node Editor will open up. \n\n**Node Logic**  \nDefine the custom behavior of the node. This logic is typically written in JavaScript/TypeScript. \n\n**Inputs**  \nDefine the inputs for the node. Later in the workflow, you can pass in the values for these inputs. \n\n**Output**  \nSpecify the output format of the node (String, number, boolean, Array, Object, File) \n\n**Metadata**  \nInfo about the node (Name, ID, description, icon) \n\nLearn more about the Starter Script: [Docs](https://docs.buildship.com/core-nodes/script)",
        "output": {
          "properties": {
            "object": {
              "title": "object",
              "buildship": {
                "index": "0"
              },
              "properties": {
                "books": {
                  "type": "array",
                  "title": "books",
                  "properties": {
                    "object": {
                      "type": "object",
                      "properties": {
                        "subtitle": {
                          "type": "string",
                          "title": "subtitle",
                          "buildship": {
                            "index": "1"
                          }
                        },
                        "title": {
                          "type": "string",
                          "buildship": {
                            "index": "0"
                          },
                          "title": "title"
                        },
                        "order": {
                          "title": "order",
                          "type": "number",
                          "buildship": {
                            "index": "4"
                          }
                        },
                        "publisher": {
                          "type": "string",
                          "buildship": {
                            "index": "3"
                          },
                          "title": "publisher"
                        },
                        "author": {
                          "buildship": {
                            "index": "2"
                          },
                          "type": "string",
                          "title": "author"
                        }
                      },
                      "title": "object",
                      "buildship": {
                        "index": "0"
                      }
                    }
                  },
                  "buildship": {
                    "index": "2"
                  }
                },
                "total_books": {
                  "title": "total_books",
                  "buildship": {
                    "index": "1"
                  },
                  "type": "number"
                },
                "shelf": {
                  "buildship": {
                    "index": "0"
                  },
                  "type": "number",
                  "title": "shelf"
                }
              },
              "type": "object"
            }
          },
          "type": "array",
          "buildship": {
            "index": "0"
          }
        },
        "label": "SecondPass - Remove Markdown"
      },
      {
        "description": "The Output Node returns values from the flow and handles HTTP response codes.  \nThe default configuration is to return the previous node output. But you can specify any custom output to return variables from other nodes or JavaScript expressions. \n\nLearn more about the Output node: [Docs](https://docs.buildship.com/core-nodes/return)",
        "type": "output",
        "id": "28ffbf3a-44ee-4863-9a8f-fab2e614636a",
        "required": [],
        "label": "Output",
        "properties": {}
      }
    ],
    "description": "Execute different sets of actions based on a specific condition. \n\nLearn more about the Branch node: [Docs](https://docs.buildship.com/core-nodes/if-else)",
    "id": "1ab5fc1c-6ff7-4d3e-b794-c09435043e3d",
    "label": "Branch",
    "else": [
      {
        "type": "script",
        "name": "Starter Script",
        "meta": {
          "description": "The Starter Script, as the name suggests, provides a blank node for adding custom logic to your workflow. \n\nClick the “code” button to configure the node. The Node Editor will open up. \n\n**Node Logic**  \nDefine the custom behavior of the node. This logic is typically written in JavaScript/TypeScript. \n\n**Inputs**  \nDefine the inputs for the node. Later in the workflow, you can pass in the values for these inputs. \n\n**Output**  \nSpecify the output format of the node (String, number, boolean, Array, Object, File) \n\n**Metadata**  \nInfo about the node (Name, ID, description, icon) \n\nLearn more about the Starter Script: [Docs](https://docs.buildship.com/core-nodes/script)",
          "name": "Starter Script",
          "id": "dfa4487e-64ce-4a51-a972-ba263c6a5f1b"
        },
        "id": "bc0ec077-0fa0-498e-a0f4-bc0107e57ac7",
        "label": "FirstPass - Remove Markdown",
        "output": {
          "buildship": {
            "index": "0"
          },
          "type": "string"
        },
        "description": "The Starter Script, as the name suggests, provides a blank node for adding custom logic to your workflow. \n\nClick the “code” button to configure the node. The Node Editor will open up. \n\n**Node Logic**  \nDefine the custom behavior of the node. This logic is typically written in JavaScript/TypeScript. \n\n**Inputs**  \nDefine the inputs for the node. Later in the workflow, you can pass in the values for these inputs. \n\n**Output**  \nSpecify the output format of the node (String, number, boolean, Array, Object, File) \n\n**Metadata**  \nInfo about the node (Name, ID, description, icon) \n\nLearn more about the Starter Script: [Docs](https://docs.buildship.com/core-nodes/script)",
        "script": "// ... (interfaces remain the same, but NodeInputs might be conceptually NodeInputs { name: string[] })\n\nexport default async function (\n  { name }: { name: string[] }, // Explicitly type 'name' as string[] if that's the new expectation\n  {\n    logging,\n  }: NodeScriptOptions,\n): Promise<NodeOutput | NodeOutput[]> { // Output might be single or array depending on design\n\n  /* Log execution values */\n  logging.log(\"Input (expected as array):\", name);\n\n  if (!Array.isArray(name) || name.length === 0 || typeof name[0] !== 'string' || !name[0].trim()) {\n    const errorMessage = \"Input must be a non-empty array with a non-empty string as its first element.\";\n    logging.error(errorMessage);\n    throw new Error(errorMessage);\n  }\n\n  const markdownJsonString = name[0]; // Process the first element\n  logging.log(\"Processing string from array:\", markdownJsonString);\n\n  // ... rest of the script (try-catch block with regex and JSON.parse) remains the same,\n  // operating on 'markdownJsonString'\n\n  try {\n    // (The existing regex and JSON.parse logic)\n    const regex = /```(?:json)?\\s*([\\s\\S]*?)\\s*```/;\n    const match = markdownJsonString.match(regex);\n    // ... etc.\n    // ...\n    // return parsedJson; // This would return a single parsed JSON object\n  } catch (error: any) {\n    // ... (error handling)\n  }\n}",
        "inputs": {
          "sections": {},
          "type": "object",
          "properties": {
            "name": {
              "buildship": {
                "sensitive": false,
                "index": "0",
                "defaultExpressionType": "text"
              },
              "type": "string",
              "title": "Model Response",
              "properties": {}
            }
          },
          "structure": [
            {
              "depth": "0",
              "id": "name",
              "index": "0",
              "parentId": null
            }
          ],
          "required": []
        }
      },
      {
        "properties": {},
        "label": "Output",
        "id": "86706a27-c97c-462b-9664-691f3f8ae543",
        "required": [],
        "type": "output",
        "description": "The Output Node returns values from the flow and handles HTTP response codes.  \nThe default configuration is to return the previous node output. But you can specify any custom output to return variables from other nodes or JavaScript expressions. \n\nLearn more about the Output node: [Docs](https://docs.buildship.com/core-nodes/return)"
      }
    ],
    "type": "branch"
  },
  {
    "type": "script",
    "inputs": {
      "properties": {
        "name": {
          "properties": {},
          "buildship": {
            "defaultExpressionType": "text",
            "index": "0",
            "sensitive": false
          },
          "title": "Model Response",
          "type": "string"
        }
      },
      "sections": {},
      "type": "object",
      "structure": [
        {
          "id": "name",
          "index": "0",
          "parentId": null,
          "depth": "0"
        }
      ],
      "required": []
    },
    "id": "857d1268-06b4-4211-9ccc-b6329103447b",
    "meta": {
      "description": "The Starter Script, as the name suggests, provides a blank node for adding custom logic to your workflow. \n\nClick the “code” button to configure the node. The Node Editor will open up. \n\n**Node Logic**  \nDefine the custom behavior of the node. This logic is typically written in JavaScript/TypeScript. \n\n**Inputs**  \nDefine the inputs for the node. Later in the workflow, you can pass in the values for these inputs. \n\n**Output**  \nSpecify the output format of the node (String, number, boolean, Array, Object, File) \n\n**Metadata**  \nInfo about the node (Name, ID, description, icon) \n\nLearn more about the Starter Script: [Docs](https://docs.buildship.com/core-nodes/script)",
      "id": "dfa4487e-64ce-4a51-a972-ba263c6a5f1b",
      "name": "Starter Script"
    },
    "script": "// Define input and output types for the node\ninterface NodeInputs {\n  name: string; // Input parameter: the string containing markdown-formatted JSON\n}\n\n// The output will be the parsed JSON object.\n// In Buildship, you'd set the output type to \"Object\" or \"JSON\".\n// Using 'any' here for simplicity, but a more specific type could be used\n// if the JSON structure is known and consistent.\ntype NodeOutput = any;\n\n// Minimal type definition for NodeScriptOptions based on the template\ninterface NodeScriptOptions {\n  logging: {\n    log: (...args: any[]) => void;\n    error: (...args: any[]) => void;\n    warn: (...args: any[]) => void;\n  };\n  env: any; // Placeholder for environment variable management utility\n  getBuildShipFile: any; // Placeholder for file handling utility\n}\n\nexport default async function (\n  { name }: NodeInputs, // 'name' is the input string with markdown JSON\n  {\n    logging, // Utility for logging during execution\n    // env, // Not used in this specific function\n    // getBuildShipFile, // Not used in this specific function\n  }: NodeScriptOptions,\n): Promise<NodeOutput> { // An async function returns a Promise wrapping the NodeOutput\n\n  const markdownJsonString = name;\n\n  /* Log execution values */\n  logging.log(\"Input Markdown JSON String:\", markdownJsonString);\n\n  if (!markdownJsonString || typeof markdownJsonString !== 'string' || !markdownJsonString.trim()) {\n    const errorMessage = \"Input string is empty or invalid.\";\n    logging.error(errorMessage);\n    throw new Error(errorMessage);\n  }\n\n  try {\n    // Regex to find JSON within ```json ... ``` or ``` ... ```\n    // It handles optional language specifier (like 'json') and potential leading/trailing newlines within the block.\n    const regex = /```(?:json)?\\s*([\\s\\S]*?)\\s*```/;\n    const match = markdownJsonString.match(regex);\n\n    let jsonString;\n\n    if (match && match[1]) {\n      jsonString = match[1].trim(); // Get the captured group (the JSON content) and trim whitespace\n      logging.log(\"Extracted JSON string:\", jsonString);\n    } else {\n      // If no markdown code block is found, assume the input might be plain JSON already,\n      // or it's an error. We'll try to parse it directly as a fallback,\n      // but this might be too lenient depending on requirements.\n      // For stricter parsing, throw an error here if no ```json block is found.\n      logging.warn(\"No Markdown JSON code block found. Attempting to parse input directly as JSON.\");\n      jsonString = markdownJsonString.trim();\n    }\n\n    if (!jsonString) {\n        const noJsonContentError = \"Could not extract any JSON content from the input string.\";\n        logging.error(noJsonContentError);\n        throw new Error(noJsonContentError);\n    }\n\n    // Parse the extracted string into a JavaScript object\n    const parsedJson = JSON.parse(jsonString);\n    logging.log(\"Successfully parsed JSON object.\");\n\n    // Return the parsed JSON object\n    // Ensure your Buildship node output is configured to be of type \"Object\" or \"JSON\"\n    return parsedJson;\n\n  } catch (error: any) {\n    let errorMessage = \"Error processing the JSON string: \";\n    if (error instanceof SyntaxError) {\n      errorMessage += \"Invalid JSON format. \" + error.message;\n    } else {\n      errorMessage += error.message;\n    }\n    logging.error(errorMessage, error.stack);\n    throw new Error(errorMessage); // Re-throw to fail the node execution\n  }\n}\n",
    "description": "The Starter Script, as the name suggests, provides a blank node for adding custom logic to your workflow. \n\nClick the “code” button to configure the node. The Node Editor will open up. \n\n**Node Logic**  \nDefine the custom behavior of the node. This logic is typically written in JavaScript/TypeScript. \n\n**Inputs**  \nDefine the inputs for the node. Later in the workflow, you can pass in the values for these inputs. \n\n**Output**  \nSpecify the output format of the node (String, number, boolean, Array, Object, File) \n\n**Metadata**  \nInfo about the node (Name, ID, description, icon) \n\nLearn more about the Starter Script: [Docs](https://docs.buildship.com/core-nodes/script)",
    "output": {
      "properties": {
        "object": {
          "title": "object",
          "buildship": {
            "index": "0"
          },
          "properties": {
            "books": {
              "type": "array",
              "title": "books",
              "properties": {
                "object": {
                  "type": "object",
                  "properties": {
                    "subtitle": {
                      "type": "string",
                      "title": "subtitle",
                      "buildship": {
                        "index": "1"
                      }
                    },
                    "title": {
                      "type": "string",
                      "buildship": {
                        "index": "0"
                      },
                      "title": "title"
                    },
                    "order": {
                      "title": "order",
                      "type": "number",
                      "buildship": {
                        "index": "4"
                      }
                    },
                    "publisher": {
                      "type": "string",
                      "buildship": {
                        "index": "3"
                      },
                      "title": "publisher"
                    },
                    "author": {
                      "buildship": {
                        "index": "2"
                      },
                      "type": "string",
                      "title": "author"
                    }
                  },
                  "title": "object",
                  "buildship": {
                    "index": "0"
                  }
                }
              },
              "buildship": {
                "index": "2"
              }
            },
            "total_books": {
              "title": "total_books",
              "buildship": {
                "index": "1"
              },
              "type": "number"
            },
            "shelf": {
              "buildship": {
                "index": "0"
              },
              "type": "number",
              "title": "shelf"
            }
          },
          "type": "object"
        }
      },
      "type": "array",
      "buildship": {
        "index": "0"
      }
    },
    "label": "SecondPass - Remove Markdown"
  },
  {
    "description": "The Output Node returns values from the flow and handles HTTP response codes.  \nThe default configuration is to return the previous node output. But you can specify any custom output to return variables from other nodes or JavaScript expressions. \n\nLearn more about the Output node: [Docs](https://docs.buildship.com/core-nodes/return)",
    "type": "output",
    "id": "28ffbf3a-44ee-4863-9a8f-fab2e614636a",
    "required": [],
    "label": "Output",
    "properties": {}
  },
  {
    "type": "script",
    "name": "Starter Script",
    "meta": {
      "description": "The Starter Script, as the name suggests, provides a blank node for adding custom logic to your workflow. \n\nClick the “code” button to configure the node. The Node Editor will open up. \n\n**Node Logic**  \nDefine the custom behavior of the node. This logic is typically written in JavaScript/TypeScript. \n\n**Inputs**  \nDefine the inputs for the node. Later in the workflow, you can pass in the values for these inputs. \n\n**Output**  \nSpecify the output format of the node (String, number, boolean, Array, Object, File) \n\n**Metadata**  \nInfo about the node (Name, ID, description, icon) \n\nLearn more about the Starter Script: [Docs](https://docs.buildship.com/core-nodes/script)",
      "name": "Starter Script",
      "id": "dfa4487e-64ce-4a51-a972-ba263c6a5f1b"
    },
    "id": "bc0ec077-0fa0-498e-a0f4-bc0107e57ac7",
    "label": "FirstPass - Remove Markdown",
    "output": {
      "buildship": {
        "index": "0"
      },
      "type": "string"
    },
    "description": "The Starter Script, as the name suggests, provides a blank node for adding custom logic to your workflow. \n\nClick the “code” button to configure the node. The Node Editor will open up. \n\n**Node Logic**  \nDefine the custom behavior of the node. This logic is typically written in JavaScript/TypeScript. \n\n**Inputs**  \nDefine the inputs for the node. Later in the workflow, you can pass in the values for these inputs. \n\n**Output**  \nSpecify the output format of the node (String, number, boolean, Array, Object, File) \n\n**Metadata**  \nInfo about the node (Name, ID, description, icon) \n\nLearn more about the Starter Script: [Docs](https://docs.buildship.com/core-nodes/script)",
    "script": "// ... (interfaces remain the same, but NodeInputs might be conceptually NodeInputs { name: string[] })\n\nexport default async function (\n  { name }: { name: string[] }, // Explicitly type 'name' as string[] if that's the new expectation\n  {\n    logging,\n  }: NodeScriptOptions,\n): Promise<NodeOutput | NodeOutput[]> { // Output might be single or array depending on design\n\n  /* Log execution values */\n  logging.log(\"Input (expected as array):\", name);\n\n  if (!Array.isArray(name) || name.length === 0 || typeof name[0] !== 'string' || !name[0].trim()) {\n    const errorMessage = \"Input must be a non-empty array with a non-empty string as its first element.\";\n    logging.error(errorMessage);\n    throw new Error(errorMessage);\n  }\n\n  const markdownJsonString = name[0]; // Process the first element\n  logging.log(\"Processing string from array:\", markdownJsonString);\n\n  // ... rest of the script (try-catch block with regex and JSON.parse) remains the same,\n  // operating on 'markdownJsonString'\n\n  try {\n    // (The existing regex and JSON.parse logic)\n    const regex = /```(?:json)?\\s*([\\s\\S]*?)\\s*```/;\n    const match = markdownJsonString.match(regex);\n    // ... etc.\n    // ...\n    // return parsedJson; // This would return a single parsed JSON object\n  } catch (error: any) {\n    // ... (error handling)\n  }\n}",
    "inputs": {
      "sections": {},
      "type": "object",
      "properties": {
        "name": {
          "buildship": {
            "sensitive": false,
            "index": "0",
            "defaultExpressionType": "text"
          },
          "type": "string",
          "title": "Model Response",
          "properties": {}
        }
      },
      "structure": [
        {
          "depth": "0",
          "id": "name",
          "index": "0",
          "parentId": null
        }
      ],
      "required": []
    }
  },
  {
    "properties": {},
    "label": "Output",
    "id": "86706a27-c97c-462b-9664-691f3f8ae543",
    "required": [],
    "type": "output",
    "description": "The Output Node returns values from the flow and handles HTTP response codes.  \nThe default configuration is to return the previous node output. But you can specify any custom output to return variables from other nodes or JavaScript expressions. \n\nLearn more about the Output node: [Docs](https://docs.buildship.com/core-nodes/return)"
  }
]