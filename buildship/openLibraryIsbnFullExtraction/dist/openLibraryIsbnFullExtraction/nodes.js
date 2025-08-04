export const nodes = [
    {
        "then": [
            {
                "type": "script",
                "output": {
                    "properties": {
                        "data": {
                            "description": "The data object from the API response",
                            "type": "object",
                            "title": "Data",
                            "buildship": {
                                "index": "1"
                            }
                        },
                        "status": {
                            "title": "Status",
                            "buildship": {
                                "index": "0"
                            },
                            "type": "number",
                            "description": "The HTTP status of the API response"
                        }
                    },
                    "buildship": {},
                    "type": "object"
                },
                "integrity": "v3:dfd2c1a8dc0bc82e8962b5017d3bb0c1",
                "id": "f9679497-fc56-48f8-93df-55fd7f877cc4",
                "inputs": {
                    "type": "object",
                    "properties": {
                        "contentType": {
                            "buildship": {
                                "options": [
                                    {
                                        "label": "application/json",
                                        "value": "application/json"
                                    },
                                    {
                                        "value": "application/x-www-form-urlencoded",
                                        "label": "application/x-www-form-urlencoded"
                                    },
                                    {
                                        "label": "multipart/form-data",
                                        "value": "multipart/form-data"
                                    },
                                    {
                                        "value": "text/plain",
                                        "label": "text/plain"
                                    }
                                ],
                                "index": "5"
                            },
                            "title": "Content Type",
                            "enum": [
                                "application/json",
                                "application/x-www-form-urlencoded",
                                "multipart/form-data",
                                "text/plain"
                            ],
                            "type": "string",
                            "description": "The content type of the API call"
                        },
                        "shouldAwait": {
                            "description": "Whether to wait for the request to complete or not",
                            "buildship": {
                                "index": "6",
                                "sensitive": false
                            },
                            "pattern": "",
                            "title": "Await?",
                            "type": "boolean"
                        },
                        "method": {
                            "enum": [
                                "GET",
                                "POST",
                                "PUT",
                                "DELETE",
                                "PATCH"
                            ],
                            "pattern": "",
                            "title": "HTTP Method",
                            "description": "The HTTP method to use for the API call",
                            "type": "string",
                            "default": "",
                            "buildship": {
                                "sensitive": false,
                                "options": [
                                    {
                                        "label": "GET",
                                        "value": "GET"
                                    },
                                    {
                                        "value": "POST",
                                        "label": "POST"
                                    },
                                    {
                                        "label": "PUT",
                                        "value": "PUT"
                                    },
                                    {
                                        "value": "DELETE",
                                        "label": "DELETE"
                                    },
                                    {
                                        "value": "PATCH",
                                        "label": "PATCH"
                                    }
                                ],
                                "index": "0"
                            }
                        },
                        "authorization": {
                            "type": "string",
                            "buildship": {
                                "index": "2",
                                "sensitive": false
                            },
                            "title": "Authorization",
                            "pattern": "",
                            "description": "The authorization header for the API call, if required (e.g., Bearer or Basic token)"
                        },
                        "body": {
                            "description": "The body to send with the API call",
                            "title": "Body",
                            "type": "object",
                            "buildship": {
                                "index": "4"
                            }
                        },
                        "queryParams": {
                            "pattern": "",
                            "buildship": {
                                "index": "3",
                                "sensitive": false
                            },
                            "type": "object",
                            "description": "The query parameters for the API call.\n\nSAMPLE INPUT:\n```\n{ \n  \"query1\": \"value1\",\n  \"query2\": \"value2\"\n}\n```",
                            "title": "Query Parameters",
                            "default": {},
                            "properties": {}
                        },
                        "url": {
                            "title": "URL",
                            "type": "string",
                            "description": "The URL of the API endpoint",
                            "buildship": {
                                "index": "1"
                            }
                        }
                    },
                    "required": [
                        "url",
                        "shouldAwait",
                        "method"
                    ]
                },
                "integrations": [],
                "src": "https://storage.googleapis.com/buildship-app-us-central1/publicLib/nodesV2/@buildship/api-call/null/build.cjs",
                "dependencies": {
                    "node-fetch": "3.3.2"
                },
                "groupInfo": null,
                "version": "null",
                "script": "import fetch from \"node-fetch\";\nexport default async function apiCall({\n    url,\n    method,\n    contentType,\n    authorization,\n    body,\n    shouldAwait,\n    queryParams\n}: NodeInputs, {\n    logging\n}: NodeScriptOptions) : NodeOutput  {\n    const headers = {\n        \"Content-Type\": contentType\n    };\n    if (authorization) headers[\"Authorization\"] = authorization;\n\n    let queryParamsString = '';\n    if (queryParams) {\n        queryParamsString = '?' + new URLSearchParams(queryParams).toString();\n    }\n\n    const fetchOptions = {\n        method,\n        headers\n    };\n\n    if (method !== 'GET') {\n        fetchOptions.body = JSON.stringify(body);\n    }\n\n    const fetchPromise = fetch(url + queryParamsString, fetchOptions);\n\n    if (!shouldAwait) {\n        return {\n            data: null\n        };\n    }\n\n    const response = await fetchPromise;\n    const data = await response.json();\n    return {\n        status: response.status,\n        data\n    };\n}",
                "meta": {
                    "description": "Make an API call using fetch with provided url, method, contentType, authorization, and body",
                    "name": "API Call Node",
                    "id": "api-call",
                    "icon": {
                        "type": "SVG",
                        "svg": "<path d=\"m14 12l-2 2l-2-2l2-2l2 2zm-2-6l2.12 2.12l2.5-2.5L12 1L7.38 5.62l2.5 2.5L12 6zm-6 6l2.12-2.12l-2.5-2.5L1 12l4.62 4.62l2.5-2.5L6 12zm12 0l-2.12 2.12l2.5 2.5L23 12l-4.62-4.62l-2.5 2.5L18 12zm-6 6l-2.12-2.12l-2.5 2.5L12 23l4.62-4.62l-2.5-2.5L12 18z\"></path>"
                    }
                },
                "label": "API - Books",
                "_libRef": {
                    "libType": "public",
                    "src": "https://storage.googleapis.com/buildship-app-us-central1/publicLib/nodesV2/@buildship/api-call/5.0.0/build.cjs",
                    "isDirty": false,
                    "version": "5.0.0",
                    "buildHash": "21b519df8810ddc5d7d290fc68cbb60ce449201673c524b86cc30b4f591135ed",
                    "integrity": "v3:dfd2c1a8dc0bc82e8962b5017d3bb0c1",
                    "libNodeRefId": "@buildship/api-call"
                },
                "generateDocs": {
                    "completedAt": {
                        "_seconds": "1716413349",
                        "_nanoseconds": "711000000"
                    },
                    "ranBy": "bhavya@rowy.io.rowy"
                }
            },
            {
                "_libRef": {
                    "buildHash": "53bdd69af060032a795f94e098e7f5b2d14ff7c3461acc27a1046ca7dfffa54d",
                    "libType": "public",
                    "integrity": "v3:800f7d58192f023fea875e6850fd901b",
                    "version": "1.2.3",
                    "isDirty": false,
                    "src": "https://storage.googleapis.com/buildship-app-us-central1/publicLib/nodesV2/@buildship/log-to-console/1.2.3/build.cjs",
                    "libNodeRefId": "@buildship/log-to-console"
                },
                "inputs": {
                    "type": "object",
                    "required": [
                        "message"
                    ],
                    "properties": {
                        "message": {
                            "default": "log",
                            "buildship": {
                                "index": "0",
                                "sensitive": false
                            },
                            "description": "The message to log to the console",
                            "properties": {},
                            "title": "Message"
                        }
                    }
                },
                "type": "script",
                "id": "55bcdbf0-dfd9-4847-a818-76962b4a9bac",
                "script": "export default function logMessageToConsole({ message }: NodeInputs, { logging }: NodeScriptOptions) : NodeOutput  {\n  logging.log(message);\n}\n",
                "meta": {
                    "id": "log-to-console",
                    "name": "Log Message to Console",
                    "icon": {
                        "svg": "<path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 15c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1-8h-2V7h2v2z\"></path>",
                        "type": "SVG"
                    },
                    "description": "Logs a message to the console"
                },
                "dependencies": {},
                "output": {
                    "title": "Output",
                    "buildship": {},
                    "properties": {},
                    "type": "object"
                },
                "integrations": [],
                "label": "Log Message to Console"
            },
            {
                "id": "b56b2ec6-91db-45dd-8e17-68c712ace040",
                "label": "Branch",
                "condition": true,
                "else": [
                    {
                        "properties": {},
                        "required": [],
                        "id": "7850a5e2-ff83-4859-afb4-8eff0592865e",
                        "label": "Output",
                        "type": "output",
                        "description": "The Output Node returns values from the flow and handles HTTP response codes.  \nThe default configuration is to return the previous node output. But you can specify any custom output to return variables from other nodes or JavaScript expressions. \n\nLearn more about the Output node: [Docs](https://docs.buildship.com/core-nodes/return)"
                    }
                ],
                "type": "branch",
                "then": [
                    {
                        "integrity": "v3:dfd2c1a8dc0bc82e8962b5017d3bb0c1",
                        "meta": {
                            "description": "Make an API call using fetch with provided url, method, contentType, authorization, and body",
                            "id": "api-call",
                            "icon": {
                                "svg": "<path d=\"m14 12l-2 2l-2-2l2-2l2 2zm-2-6l2.12 2.12l2.5-2.5L12 1L7.38 5.62l2.5 2.5L12 6zm-6 6l2.12-2.12l-2.5-2.5L1 12l4.62 4.62l2.5-2.5L6 12zm12 0l-2.12 2.12l2.5 2.5L23 12l-4.62-4.62l-2.5 2.5L18 12zm-6 6l-2.12-2.12l-2.5 2.5L12 23l4.62-4.62l-2.5-2.5L12 18z\"></path>",
                                "type": "SVG"
                            },
                            "name": "API Call Node"
                        },
                        "onFail": null,
                        "integrations": [],
                        "label": "API - Works",
                        "groupInfo": null,
                        "id": "de9e2852-0b6f-42cd-b757-c12cc592c540",
                        "_libRef": {
                            "src": "https://storage.googleapis.com/buildship-app-us-central1/publicLib/nodesV2/@buildship/api-call/5.0.0/build.cjs",
                            "isDirty": false,
                            "libType": "public",
                            "libNodeRefId": "@buildship/api-call",
                            "integrity": "v3:dfd2c1a8dc0bc82e8962b5017d3bb0c1",
                            "buildHash": "21b519df8810ddc5d7d290fc68cbb60ce449201673c524b86cc30b4f591135ed",
                            "version": "5.0.0"
                        },
                        "script": "import fetch from \"node-fetch\";\nexport default async function apiCall({\n    url,\n    method,\n    contentType,\n    authorization,\n    body,\n    shouldAwait,\n    queryParams\n}: NodeInputs, {\n    logging\n}: NodeScriptOptions) : NodeOutput  {\n    const headers = {\n        \"Content-Type\": contentType\n    };\n    if (authorization) headers[\"Authorization\"] = authorization;\n\n    let queryParamsString = '';\n    if (queryParams) {\n        queryParamsString = '?' + new URLSearchParams(queryParams).toString();\n    }\n\n    const fetchOptions = {\n        method,\n        headers\n    };\n\n    if (method !== 'GET') {\n        fetchOptions.body = JSON.stringify(body);\n    }\n\n    const fetchPromise = fetch(url + queryParamsString, fetchOptions);\n\n    if (!shouldAwait) {\n        return {\n            data: null\n        };\n    }\n\n    const response = await fetchPromise;\n    const data = await response.json();\n    return {\n        status: response.status,\n        data\n    };\n}",
                        "generateDocs": {
                            "ranBy": "bhavya@rowy.io.rowy",
                            "completedAt": {
                                "_nanoseconds": "711000000",
                                "_seconds": "1716413349"
                            }
                        },
                        "inputs": {
                            "properties": {
                                "shouldAwait": {
                                    "pattern": "",
                                    "title": "Await?",
                                    "type": "boolean",
                                    "description": "Whether to wait for the request to complete or not",
                                    "buildship": {
                                        "index": "6",
                                        "sensitive": false
                                    }
                                },
                                "queryParams": {
                                    "buildship": {
                                        "index": "3",
                                        "sensitive": false
                                    },
                                    "properties": {},
                                    "description": "The query parameters for the API call.\n\nSAMPLE INPUT:\n```\n{ \n  \"query1\": \"value1\",\n  \"query2\": \"value2\"\n}\n```",
                                    "default": {},
                                    "type": "object",
                                    "pattern": "",
                                    "title": "Query Parameters"
                                },
                                "url": {
                                    "type": "string",
                                    "buildship": {
                                        "index": "1"
                                    },
                                    "description": "The URL of the API endpoint",
                                    "title": "URL"
                                },
                                "method": {
                                    "buildship": {
                                        "options": [
                                            {
                                                "value": "GET",
                                                "label": "GET"
                                            },
                                            {
                                                "label": "POST",
                                                "value": "POST"
                                            },
                                            {
                                                "value": "PUT",
                                                "label": "PUT"
                                            },
                                            {
                                                "label": "DELETE",
                                                "value": "DELETE"
                                            },
                                            {
                                                "label": "PATCH",
                                                "value": "PATCH"
                                            }
                                        ],
                                        "sensitive": false,
                                        "index": "0"
                                    },
                                    "type": "string",
                                    "default": "",
                                    "enum": [
                                        "GET",
                                        "POST",
                                        "PUT",
                                        "DELETE",
                                        "PATCH"
                                    ],
                                    "pattern": "",
                                    "title": "HTTP Method",
                                    "description": "The HTTP method to use for the API call"
                                },
                                "body": {
                                    "description": "The body to send with the API call",
                                    "buildship": {
                                        "index": "4"
                                    },
                                    "title": "Body",
                                    "type": "object"
                                },
                                "contentType": {
                                    "description": "The content type of the API call",
                                    "type": "string",
                                    "buildship": {
                                        "options": [
                                            {
                                                "label": "application/json",
                                                "value": "application/json"
                                            },
                                            {
                                                "label": "application/x-www-form-urlencoded",
                                                "value": "application/x-www-form-urlencoded"
                                            },
                                            {
                                                "label": "multipart/form-data",
                                                "value": "multipart/form-data"
                                            },
                                            {
                                                "value": "text/plain",
                                                "label": "text/plain"
                                            }
                                        ],
                                        "index": "5"
                                    },
                                    "enum": [
                                        "application/json",
                                        "application/x-www-form-urlencoded",
                                        "multipart/form-data",
                                        "text/plain"
                                    ],
                                    "title": "Content Type"
                                },
                                "authorization": {
                                    "pattern": "",
                                    "buildship": {
                                        "index": "2",
                                        "sensitive": false
                                    },
                                    "title": "Authorization",
                                    "description": "The authorization header for the API call, if required (e.g., Bearer or Basic token)",
                                    "type": "string"
                                }
                            },
                            "required": [
                                "url",
                                "shouldAwait",
                                "method"
                            ],
                            "type": "object"
                        },
                        "dependencies": {
                            "node-fetch": "3.3.2"
                        },
                        "version": "null",
                        "src": "https://storage.googleapis.com/buildship-app-us-central1/publicLib/nodesV2/@buildship/api-call/null/build.cjs",
                        "output": {
                            "buildship": {},
                            "properties": {
                                "data": {
                                    "title": "Data",
                                    "type": "object",
                                    "buildship": {
                                        "index": "1"
                                    },
                                    "description": "The data object from the API response"
                                },
                                "status": {
                                    "title": "Status",
                                    "type": "number",
                                    "buildship": {
                                        "index": "0"
                                    },
                                    "description": "The HTTP status of the API response"
                                }
                            },
                            "type": "object"
                        },
                        "type": "script"
                    },
                    {
                        "else": [
                            {
                                "description": "The Output Node returns values from the flow and handles HTTP response codes.  \nThe default configuration is to return the previous node output. But you can specify any custom output to return variables from other nodes or JavaScript expressions. \n\nLearn more about the Output node: [Docs](https://docs.buildship.com/core-nodes/return)",
                                "properties": {},
                                "type": "output",
                                "id": "5562f10f-183d-4910-8874-b81fef0e766d",
                                "required": [],
                                "label": "Output"
                            }
                        ],
                        "condition": true,
                        "type": "branch",
                        "label": "Branch",
                        "id": "6072d0c9-6672-4c03-b36c-81a7a69f316f",
                        "description": "Execute different sets of actions based on a specific condition. \n\nLearn more about the Branch node: [Docs](https://docs.buildship.com/core-nodes/if-else)",
                        "then": [
                            {
                                "nodes": [
                                    {
                                        "meta": {
                                            "icon": {
                                                "type": "SVG",
                                                "svg": "<path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 15c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1-8h-2V7h2v2z\"></path>"
                                            },
                                            "id": "log-to-console",
                                            "name": "Log Message to Console",
                                            "description": "Logs a message to the console"
                                        },
                                        "type": "script",
                                        "_libRef": {
                                            "isDirty": false,
                                            "libType": "public",
                                            "version": "1.2.3",
                                            "integrity": "v3:800f7d58192f023fea875e6850fd901b",
                                            "src": "https://storage.googleapis.com/buildship-app-us-central1/publicLib/nodesV2/@buildship/log-to-console/1.2.3/build.cjs",
                                            "buildHash": "53bdd69af060032a795f94e098e7f5b2d14ff7c3461acc27a1046ca7dfffa54d",
                                            "libNodeRefId": "@buildship/log-to-console"
                                        },
                                        "integrations": [],
                                        "inputs": {
                                            "required": [
                                                "message"
                                            ],
                                            "type": "object",
                                            "properties": {
                                                "message": {
                                                    "buildship": {
                                                        "sensitive": false,
                                                        "index": "0"
                                                    },
                                                    "default": "log",
                                                    "description": "The message to log to the console",
                                                    "properties": {},
                                                    "title": "Message"
                                                }
                                            }
                                        },
                                        "script": "export default function logMessageToConsole({ message }: NodeInputs, { logging }: NodeScriptOptions) : NodeOutput  {\n  logging.log(message);\n}\n",
                                        "label": "Log Message to Console",
                                        "id": "c5dbe9b1-c4a4-4192-87b6-fa7b83bda766",
                                        "output": {
                                            "title": "Output",
                                            "properties": {},
                                            "type": "object",
                                            "buildship": {}
                                        },
                                        "dependencies": {}
                                    },
                                    {
                                        "dependencies": {
                                            "node-fetch": "3.3.2"
                                        },
                                        "version": "null",
                                        "_libRef": {
                                            "buildHash": "21b519df8810ddc5d7d290fc68cbb60ce449201673c524b86cc30b4f591135ed",
                                            "libType": "public",
                                            "integrity": "v3:dfd2c1a8dc0bc82e8962b5017d3bb0c1",
                                            "libNodeRefId": "@buildship/api-call",
                                            "isDirty": false,
                                            "src": "https://storage.googleapis.com/buildship-app-us-central1/publicLib/nodesV2/@buildship/api-call/5.0.0/build.cjs",
                                            "version": "5.0.0"
                                        },
                                        "src": "https://storage.googleapis.com/buildship-app-us-central1/publicLib/nodesV2/@buildship/api-call/null/build.cjs",
                                        "script": "import fetch from \"node-fetch\";\nexport default async function apiCall({\n    url,\n    method,\n    contentType,\n    authorization,\n    body,\n    shouldAwait,\n    queryParams\n}: NodeInputs, {\n    logging\n}: NodeScriptOptions) : NodeOutput  {\n    const headers = {\n        \"Content-Type\": contentType\n    };\n    if (authorization) headers[\"Authorization\"] = authorization;\n\n    let queryParamsString = '';\n    if (queryParams) {\n        queryParamsString = '?' + new URLSearchParams(queryParams).toString();\n    }\n\n    const fetchOptions = {\n        method,\n        headers\n    };\n\n    if (method !== 'GET') {\n        fetchOptions.body = JSON.stringify(body);\n    }\n\n    const fetchPromise = fetch(url + queryParamsString, fetchOptions);\n\n    if (!shouldAwait) {\n        return {\n            data: null\n        };\n    }\n\n    const response = await fetchPromise;\n    const data = await response.json();\n    return {\n        status: response.status,\n        data\n    };\n}",
                                        "inputs": {
                                            "type": "object",
                                            "properties": {
                                                "queryParams": {
                                                    "properties": {},
                                                    "description": "The query parameters for the API call.\n\nSAMPLE INPUT:\n```\n{ \n  \"query1\": \"value1\",\n  \"query2\": \"value2\"\n}\n```",
                                                    "buildship": {
                                                        "index": "3",
                                                        "sensitive": false
                                                    },
                                                    "title": "Query Parameters",
                                                    "default": {},
                                                    "pattern": "",
                                                    "type": "object"
                                                },
                                                "body": {
                                                    "title": "Body",
                                                    "description": "The body to send with the API call",
                                                    "buildship": {
                                                        "index": "4"
                                                    },
                                                    "type": "object"
                                                },
                                                "shouldAwait": {
                                                    "buildship": {
                                                        "index": "6",
                                                        "sensitive": false
                                                    },
                                                    "pattern": "",
                                                    "description": "Whether to wait for the request to complete or not",
                                                    "type": "boolean",
                                                    "title": "Await?"
                                                },
                                                "url": {
                                                    "title": "URL",
                                                    "description": "The URL of the API endpoint",
                                                    "type": "string",
                                                    "buildship": {
                                                        "index": "1"
                                                    }
                                                },
                                                "method": {
                                                    "default": "",
                                                    "description": "The HTTP method to use for the API call",
                                                    "title": "HTTP Method",
                                                    "pattern": "",
                                                    "buildship": {
                                                        "index": "0",
                                                        "options": [
                                                            {
                                                                "label": "GET",
                                                                "value": "GET"
                                                            },
                                                            {
                                                                "value": "POST",
                                                                "label": "POST"
                                                            },
                                                            {
                                                                "label": "PUT",
                                                                "value": "PUT"
                                                            },
                                                            {
                                                                "label": "DELETE",
                                                                "value": "DELETE"
                                                            },
                                                            {
                                                                "label": "PATCH",
                                                                "value": "PATCH"
                                                            }
                                                        ],
                                                        "sensitive": false
                                                    },
                                                    "enum": [
                                                        "GET",
                                                        "POST",
                                                        "PUT",
                                                        "DELETE",
                                                        "PATCH"
                                                    ],
                                                    "type": "string"
                                                },
                                                "contentType": {
                                                    "enum": [
                                                        "application/json",
                                                        "application/x-www-form-urlencoded",
                                                        "multipart/form-data",
                                                        "text/plain"
                                                    ],
                                                    "type": "string",
                                                    "description": "The content type of the API call",
                                                    "title": "Content Type",
                                                    "buildship": {
                                                        "options": [
                                                            {
                                                                "label": "application/json",
                                                                "value": "application/json"
                                                            },
                                                            {
                                                                "value": "application/x-www-form-urlencoded",
                                                                "label": "application/x-www-form-urlencoded"
                                                            },
                                                            {
                                                                "value": "multipart/form-data",
                                                                "label": "multipart/form-data"
                                                            },
                                                            {
                                                                "value": "text/plain",
                                                                "label": "text/plain"
                                                            }
                                                        ],
                                                        "index": "5"
                                                    }
                                                },
                                                "authorization": {
                                                    "buildship": {
                                                        "index": "2",
                                                        "sensitive": false
                                                    },
                                                    "title": "Authorization",
                                                    "pattern": "",
                                                    "type": "string",
                                                    "description": "The authorization header for the API call, if required (e.g., Bearer or Basic token)"
                                                }
                                            },
                                            "required": [
                                                "url",
                                                "shouldAwait",
                                                "method"
                                            ]
                                        },
                                        "generateDocs": {
                                            "ranBy": "bhavya@rowy.io.rowy",
                                            "completedAt": {
                                                "_nanoseconds": "711000000",
                                                "_seconds": "1716413349"
                                            }
                                        },
                                        "type": "script",
                                        "integrity": "v3:dfd2c1a8dc0bc82e8962b5017d3bb0c1",
                                        "output": {
                                            "buildship": {},
                                            "type": "object",
                                            "properties": {
                                                "data": {
                                                    "type": "object",
                                                    "description": "The data object from the API response",
                                                    "buildship": {
                                                        "index": "1"
                                                    },
                                                    "title": "Data"
                                                },
                                                "status": {
                                                    "title": "Status",
                                                    "type": "number",
                                                    "description": "The HTTP status of the API response",
                                                    "buildship": {
                                                        "index": "0"
                                                    }
                                                }
                                            }
                                        },
                                        "meta": {
                                            "id": "api-call",
                                            "icon": {
                                                "type": "SVG",
                                                "svg": "<path d=\"m14 12l-2 2l-2-2l2-2l2 2zm-2-6l2.12 2.12l2.5-2.5L12 1L7.38 5.62l2.5 2.5L12 6zm-6 6l2.12-2.12l-2.5-2.5L1 12l4.62 4.62l2.5-2.5L6 12zm12 0l-2.12 2.12l2.5 2.5L23 12l-4.62-4.62l-2.5 2.5L18 12zm-6 6l-2.12-2.12l-2.5 2.5L12 23l4.62-4.62l-2.5-2.5L12 18z\"></path>"
                                            },
                                            "description": "Make an API call using fetch with provided url, method, contentType, authorization, and body",
                                            "name": "API Call Node"
                                        },
                                        "integrations": [],
                                        "groupInfo": null,
                                        "id": "3fb2b37a-ce1c-4df7-98a5-62931002e386",
                                        "label": "API - Author"
                                    },
                                    {
                                        "type": "branch",
                                        "id": "42240245-fd63-4015-845c-e2f45ea780eb",
                                        "condition": true,
                                        "else": [
                                            {
                                                "label": "Output",
                                                "id": "34bf8cbb-56dd-4757-ab0b-268e832bebc8",
                                                "required": [],
                                                "properties": {},
                                                "type": "output",
                                                "description": "The Output Node returns values from the flow and handles HTTP response codes.  \nThe default configuration is to return the previous node output. But you can specify any custom output to return variables from other nodes or JavaScript expressions. \n\nLearn more about the Output node: [Docs](https://docs.buildship.com/core-nodes/return)"
                                            }
                                        ],
                                        "label": "Branch",
                                        "description": "Execute different sets of actions based on a specific condition. \n\nLearn more about the Branch node: [Docs](https://docs.buildship.com/core-nodes/if-else)",
                                        "then": [
                                            {
                                                "inputs": {
                                                    "required": [
                                                        "name",
                                                        "value"
                                                    ],
                                                    "properties": {
                                                        "value": {
                                                            "type": "array",
                                                            "title": "Value",
                                                            "buildship": {
                                                                "sensitive": false,
                                                                "defaultExpressionType": "text",
                                                                "index": "1"
                                                            },
                                                            "description": "The value to set the variable to"
                                                        },
                                                        "name": {
                                                            "enum": [],
                                                            "title": "Name",
                                                            "description": "The name of the variable",
                                                            "buildship": {
                                                                "index": "0"
                                                            },
                                                            "type": "string"
                                                        }
                                                    },
                                                    "type": "object"
                                                },
                                                "label": "Set Variable",
                                                "type": "set-variable",
                                                "description": "Local variables allow you to store and modify values throughout a workflow. Unlike request variables, local variables are defined within the workflow and can be modified at different steps. \n\nHow to use:  \n1. In the name selector, click “Add variable” to create a new variable in your workflow.  \n2. Use the “Set Variable” node in different steps of your flow and change the value.  \n3. Reference the variable in nodes, logic or conditions. \n\nLocal variables make workflows more flexible, helping you manage dynamic data more efficiently.",
                                                "id": "c1a96e2f-ef0d-45b2-99df-7a85eb19b50a"
                                            }
                                        ]
                                    }
                                ],
                                "label": "Loop",
                                "type": "loop",
                                "id": "55120dbe-08e9-47f0-ac7e-a82875bd9077",
                                "description": "The Loop node processes each element in the input data sequentially, applying specified actions. Ideal for step-by-step transformations and ordered execution. \n\nLearn more about the Loop node: [Docs](https://docs.buildship.com/core-nodes/loop)"
                            }
                        ]
                    }
                ],
                "description": "Execute different sets of actions based on a specific condition. \n\nLearn more about the Branch node: [Docs](https://docs.buildship.com/core-nodes/if-else)"
            },
            {
                "type": "output",
                "properties": {},
                "description": "The Output Node returns values from the flow and handles HTTP response codes.  \nThe default configuration is to return the previous node output. But you can specify any custom output to return variables from other nodes or JavaScript expressions. \n\nLearn more about the Output node: [Docs](https://docs.buildship.com/core-nodes/return)",
                "required": [],
                "id": "b4f202cc-b063-4662-ad7f-dfc93be8ea20",
                "label": "Output"
            }
        ],
        "type": "branch",
        "id": "7abd7825-465b-4dbe-b6e5-7fa92d4bb75d",
        "label": "Branch on Input Validation",
        "else": [
            {
                "plan": {
                    "inputs": [
                        {
                            "id": "validation_error",
                            "type": "string",
                            "description": "From validate-inputs",
                            "name": "Validation Error"
                        }
                    ],
                    "output": [
                        {
                            "type": "object",
                            "description": "{success:false, error:...}",
                            "id": "result",
                            "name": "Result"
                        }
                    ],
                    "description": "Returns input validation error.",
                    "name": "Output Validation Error"
                },
                "id": "5d41f515-d132-40a2-941c-b6f4ced76cde",
                "script": "export default async function validationError({\n    validation_error\n}: NodeInputs, {\n    logging\n}: NodeScriptOptions) {\n    // Log the validation error\n    logging.log(`Validation error: ${validation_error}`);\n\n    // Return an object with success:false and the error message\n    return {\n        success: false,\n        error: validation_error\n    };\n}",
                "type": "script",
                "description": "Returns input validation error.",
                "label": "Output Validation Error",
                "meta": {
                    "id": "a7605ba1-4f4a-4f9d-8c9c-713d08172e0c",
                    "name": "Output Validation Error",
                    "icon": {
                        "url": null,
                        "type": "URL"
                    },
                    "description": "Returns input validation error."
                },
                "output": {
                    "description": "This object represents the output of a validation error node, providing the success status and the error message.",
                    "buildship": {
                        "index": "0"
                    },
                    "type": "object",
                    "properties": {
                        "error": {
                            "type": "string",
                            "buildship": {
                                "index": "1"
                            },
                            "title": "Error",
                            "description": "The error message describing the validation error encountered."
                        },
                        "success": {
                            "type": "boolean",
                            "description": "Indicates whether the operation was successful. For validation errors, this will be false.",
                            "buildship": {
                                "index": "0"
                            },
                            "title": "Success"
                        }
                    },
                    "title": "Validation Error Output"
                },
                "inputs": {
                    "properties": {
                        "validation_error": {
                            "buildship": {
                                "index": "0",
                                "userPromptHint": "Enter the validation error message to return."
                            },
                            "description": "The validation error message to return.",
                            "title": "Validation Error",
                            "type": "string"
                        }
                    },
                    "type": "object",
                    "required": [
                        "validation_error"
                    ]
                }
            }
        ],
        "description": "Proceed if no validation error, else return error.",
        "condition": true
    },
    {
        "type": "script",
        "output": {
            "properties": {
                "data": {
                    "description": "The data object from the API response",
                    "type": "object",
                    "title": "Data",
                    "buildship": {
                        "index": "1"
                    }
                },
                "status": {
                    "title": "Status",
                    "buildship": {
                        "index": "0"
                    },
                    "type": "number",
                    "description": "The HTTP status of the API response"
                }
            },
            "buildship": {},
            "type": "object"
        },
        "integrity": "v3:dfd2c1a8dc0bc82e8962b5017d3bb0c1",
        "id": "f9679497-fc56-48f8-93df-55fd7f877cc4",
        "inputs": {
            "type": "object",
            "properties": {
                "contentType": {
                    "buildship": {
                        "options": [
                            {
                                "label": "application/json",
                                "value": "application/json"
                            },
                            {
                                "value": "application/x-www-form-urlencoded",
                                "label": "application/x-www-form-urlencoded"
                            },
                            {
                                "label": "multipart/form-data",
                                "value": "multipart/form-data"
                            },
                            {
                                "value": "text/plain",
                                "label": "text/plain"
                            }
                        ],
                        "index": "5"
                    },
                    "title": "Content Type",
                    "enum": [
                        "application/json",
                        "application/x-www-form-urlencoded",
                        "multipart/form-data",
                        "text/plain"
                    ],
                    "type": "string",
                    "description": "The content type of the API call"
                },
                "shouldAwait": {
                    "description": "Whether to wait for the request to complete or not",
                    "buildship": {
                        "index": "6",
                        "sensitive": false
                    },
                    "pattern": "",
                    "title": "Await?",
                    "type": "boolean"
                },
                "method": {
                    "enum": [
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE",
                        "PATCH"
                    ],
                    "pattern": "",
                    "title": "HTTP Method",
                    "description": "The HTTP method to use for the API call",
                    "type": "string",
                    "default": "",
                    "buildship": {
                        "sensitive": false,
                        "options": [
                            {
                                "label": "GET",
                                "value": "GET"
                            },
                            {
                                "value": "POST",
                                "label": "POST"
                            },
                            {
                                "label": "PUT",
                                "value": "PUT"
                            },
                            {
                                "value": "DELETE",
                                "label": "DELETE"
                            },
                            {
                                "value": "PATCH",
                                "label": "PATCH"
                            }
                        ],
                        "index": "0"
                    }
                },
                "authorization": {
                    "type": "string",
                    "buildship": {
                        "index": "2",
                        "sensitive": false
                    },
                    "title": "Authorization",
                    "pattern": "",
                    "description": "The authorization header for the API call, if required (e.g., Bearer or Basic token)"
                },
                "body": {
                    "description": "The body to send with the API call",
                    "title": "Body",
                    "type": "object",
                    "buildship": {
                        "index": "4"
                    }
                },
                "queryParams": {
                    "pattern": "",
                    "buildship": {
                        "index": "3",
                        "sensitive": false
                    },
                    "type": "object",
                    "description": "The query parameters for the API call.\n\nSAMPLE INPUT:\n```\n{ \n  \"query1\": \"value1\",\n  \"query2\": \"value2\"\n}\n```",
                    "title": "Query Parameters",
                    "default": {},
                    "properties": {}
                },
                "url": {
                    "title": "URL",
                    "type": "string",
                    "description": "The URL of the API endpoint",
                    "buildship": {
                        "index": "1"
                    }
                }
            },
            "required": [
                "url",
                "shouldAwait",
                "method"
            ]
        },
        "integrations": [],
        "src": "https://storage.googleapis.com/buildship-app-us-central1/publicLib/nodesV2/@buildship/api-call/null/build.cjs",
        "dependencies": {
            "node-fetch": "3.3.2"
        },
        "groupInfo": null,
        "version": "null",
        "script": "import fetch from \"node-fetch\";\nexport default async function apiCall({\n    url,\n    method,\n    contentType,\n    authorization,\n    body,\n    shouldAwait,\n    queryParams\n}: NodeInputs, {\n    logging\n}: NodeScriptOptions) : NodeOutput  {\n    const headers = {\n        \"Content-Type\": contentType\n    };\n    if (authorization) headers[\"Authorization\"] = authorization;\n\n    let queryParamsString = '';\n    if (queryParams) {\n        queryParamsString = '?' + new URLSearchParams(queryParams).toString();\n    }\n\n    const fetchOptions = {\n        method,\n        headers\n    };\n\n    if (method !== 'GET') {\n        fetchOptions.body = JSON.stringify(body);\n    }\n\n    const fetchPromise = fetch(url + queryParamsString, fetchOptions);\n\n    if (!shouldAwait) {\n        return {\n            data: null\n        };\n    }\n\n    const response = await fetchPromise;\n    const data = await response.json();\n    return {\n        status: response.status,\n        data\n    };\n}",
        "meta": {
            "description": "Make an API call using fetch with provided url, method, contentType, authorization, and body",
            "name": "API Call Node",
            "id": "api-call",
            "icon": {
                "type": "SVG",
                "svg": "<path d=\"m14 12l-2 2l-2-2l2-2l2 2zm-2-6l2.12 2.12l2.5-2.5L12 1L7.38 5.62l2.5 2.5L12 6zm-6 6l2.12-2.12l-2.5-2.5L1 12l4.62 4.62l2.5-2.5L6 12zm12 0l-2.12 2.12l2.5 2.5L23 12l-4.62-4.62l-2.5 2.5L18 12zm-6 6l-2.12-2.12l-2.5 2.5L12 23l4.62-4.62l-2.5-2.5L12 18z\"></path>"
            }
        },
        "label": "API - Books",
        "_libRef": {
            "libType": "public",
            "src": "https://storage.googleapis.com/buildship-app-us-central1/publicLib/nodesV2/@buildship/api-call/5.0.0/build.cjs",
            "isDirty": false,
            "version": "5.0.0",
            "buildHash": "21b519df8810ddc5d7d290fc68cbb60ce449201673c524b86cc30b4f591135ed",
            "integrity": "v3:dfd2c1a8dc0bc82e8962b5017d3bb0c1",
            "libNodeRefId": "@buildship/api-call"
        },
        "generateDocs": {
            "completedAt": {
                "_seconds": "1716413349",
                "_nanoseconds": "711000000"
            },
            "ranBy": "bhavya@rowy.io.rowy"
        }
    },
    {
        "_libRef": {
            "buildHash": "53bdd69af060032a795f94e098e7f5b2d14ff7c3461acc27a1046ca7dfffa54d",
            "libType": "public",
            "integrity": "v3:800f7d58192f023fea875e6850fd901b",
            "version": "1.2.3",
            "isDirty": false,
            "src": "https://storage.googleapis.com/buildship-app-us-central1/publicLib/nodesV2/@buildship/log-to-console/1.2.3/build.cjs",
            "libNodeRefId": "@buildship/log-to-console"
        },
        "inputs": {
            "type": "object",
            "required": [
                "message"
            ],
            "properties": {
                "message": {
                    "default": "log",
                    "buildship": {
                        "index": "0",
                        "sensitive": false
                    },
                    "description": "The message to log to the console",
                    "properties": {},
                    "title": "Message"
                }
            }
        },
        "type": "script",
        "id": "55bcdbf0-dfd9-4847-a818-76962b4a9bac",
        "script": "export default function logMessageToConsole({ message }: NodeInputs, { logging }: NodeScriptOptions) : NodeOutput  {\n  logging.log(message);\n}\n",
        "meta": {
            "id": "log-to-console",
            "name": "Log Message to Console",
            "icon": {
                "svg": "<path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 15c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1-8h-2V7h2v2z\"></path>",
                "type": "SVG"
            },
            "description": "Logs a message to the console"
        },
        "dependencies": {},
        "output": {
            "title": "Output",
            "buildship": {},
            "properties": {},
            "type": "object"
        },
        "integrations": [],
        "label": "Log Message to Console"
    },
    {
        "id": "b56b2ec6-91db-45dd-8e17-68c712ace040",
        "label": "Branch",
        "condition": true,
        "else": [
            {
                "properties": {},
                "required": [],
                "id": "7850a5e2-ff83-4859-afb4-8eff0592865e",
                "label": "Output",
                "type": "output",
                "description": "The Output Node returns values from the flow and handles HTTP response codes.  \nThe default configuration is to return the previous node output. But you can specify any custom output to return variables from other nodes or JavaScript expressions. \n\nLearn more about the Output node: [Docs](https://docs.buildship.com/core-nodes/return)"
            }
        ],
        "type": "branch",
        "then": [
            {
                "integrity": "v3:dfd2c1a8dc0bc82e8962b5017d3bb0c1",
                "meta": {
                    "description": "Make an API call using fetch with provided url, method, contentType, authorization, and body",
                    "id": "api-call",
                    "icon": {
                        "svg": "<path d=\"m14 12l-2 2l-2-2l2-2l2 2zm-2-6l2.12 2.12l2.5-2.5L12 1L7.38 5.62l2.5 2.5L12 6zm-6 6l2.12-2.12l-2.5-2.5L1 12l4.62 4.62l2.5-2.5L6 12zm12 0l-2.12 2.12l2.5 2.5L23 12l-4.62-4.62l-2.5 2.5L18 12zm-6 6l-2.12-2.12l-2.5 2.5L12 23l4.62-4.62l-2.5-2.5L12 18z\"></path>",
                        "type": "SVG"
                    },
                    "name": "API Call Node"
                },
                "onFail": null,
                "integrations": [],
                "label": "API - Works",
                "groupInfo": null,
                "id": "de9e2852-0b6f-42cd-b757-c12cc592c540",
                "_libRef": {
                    "src": "https://storage.googleapis.com/buildship-app-us-central1/publicLib/nodesV2/@buildship/api-call/5.0.0/build.cjs",
                    "isDirty": false,
                    "libType": "public",
                    "libNodeRefId": "@buildship/api-call",
                    "integrity": "v3:dfd2c1a8dc0bc82e8962b5017d3bb0c1",
                    "buildHash": "21b519df8810ddc5d7d290fc68cbb60ce449201673c524b86cc30b4f591135ed",
                    "version": "5.0.0"
                },
                "script": "import fetch from \"node-fetch\";\nexport default async function apiCall({\n    url,\n    method,\n    contentType,\n    authorization,\n    body,\n    shouldAwait,\n    queryParams\n}: NodeInputs, {\n    logging\n}: NodeScriptOptions) : NodeOutput  {\n    const headers = {\n        \"Content-Type\": contentType\n    };\n    if (authorization) headers[\"Authorization\"] = authorization;\n\n    let queryParamsString = '';\n    if (queryParams) {\n        queryParamsString = '?' + new URLSearchParams(queryParams).toString();\n    }\n\n    const fetchOptions = {\n        method,\n        headers\n    };\n\n    if (method !== 'GET') {\n        fetchOptions.body = JSON.stringify(body);\n    }\n\n    const fetchPromise = fetch(url + queryParamsString, fetchOptions);\n\n    if (!shouldAwait) {\n        return {\n            data: null\n        };\n    }\n\n    const response = await fetchPromise;\n    const data = await response.json();\n    return {\n        status: response.status,\n        data\n    };\n}",
                "generateDocs": {
                    "ranBy": "bhavya@rowy.io.rowy",
                    "completedAt": {
                        "_nanoseconds": "711000000",
                        "_seconds": "1716413349"
                    }
                },
                "inputs": {
                    "properties": {
                        "shouldAwait": {
                            "pattern": "",
                            "title": "Await?",
                            "type": "boolean",
                            "description": "Whether to wait for the request to complete or not",
                            "buildship": {
                                "index": "6",
                                "sensitive": false
                            }
                        },
                        "queryParams": {
                            "buildship": {
                                "index": "3",
                                "sensitive": false
                            },
                            "properties": {},
                            "description": "The query parameters for the API call.\n\nSAMPLE INPUT:\n```\n{ \n  \"query1\": \"value1\",\n  \"query2\": \"value2\"\n}\n```",
                            "default": {},
                            "type": "object",
                            "pattern": "",
                            "title": "Query Parameters"
                        },
                        "url": {
                            "type": "string",
                            "buildship": {
                                "index": "1"
                            },
                            "description": "The URL of the API endpoint",
                            "title": "URL"
                        },
                        "method": {
                            "buildship": {
                                "options": [
                                    {
                                        "value": "GET",
                                        "label": "GET"
                                    },
                                    {
                                        "label": "POST",
                                        "value": "POST"
                                    },
                                    {
                                        "value": "PUT",
                                        "label": "PUT"
                                    },
                                    {
                                        "label": "DELETE",
                                        "value": "DELETE"
                                    },
                                    {
                                        "label": "PATCH",
                                        "value": "PATCH"
                                    }
                                ],
                                "sensitive": false,
                                "index": "0"
                            },
                            "type": "string",
                            "default": "",
                            "enum": [
                                "GET",
                                "POST",
                                "PUT",
                                "DELETE",
                                "PATCH"
                            ],
                            "pattern": "",
                            "title": "HTTP Method",
                            "description": "The HTTP method to use for the API call"
                        },
                        "body": {
                            "description": "The body to send with the API call",
                            "buildship": {
                                "index": "4"
                            },
                            "title": "Body",
                            "type": "object"
                        },
                        "contentType": {
                            "description": "The content type of the API call",
                            "type": "string",
                            "buildship": {
                                "options": [
                                    {
                                        "label": "application/json",
                                        "value": "application/json"
                                    },
                                    {
                                        "label": "application/x-www-form-urlencoded",
                                        "value": "application/x-www-form-urlencoded"
                                    },
                                    {
                                        "label": "multipart/form-data",
                                        "value": "multipart/form-data"
                                    },
                                    {
                                        "value": "text/plain",
                                        "label": "text/plain"
                                    }
                                ],
                                "index": "5"
                            },
                            "enum": [
                                "application/json",
                                "application/x-www-form-urlencoded",
                                "multipart/form-data",
                                "text/plain"
                            ],
                            "title": "Content Type"
                        },
                        "authorization": {
                            "pattern": "",
                            "buildship": {
                                "index": "2",
                                "sensitive": false
                            },
                            "title": "Authorization",
                            "description": "The authorization header for the API call, if required (e.g., Bearer or Basic token)",
                            "type": "string"
                        }
                    },
                    "required": [
                        "url",
                        "shouldAwait",
                        "method"
                    ],
                    "type": "object"
                },
                "dependencies": {
                    "node-fetch": "3.3.2"
                },
                "version": "null",
                "src": "https://storage.googleapis.com/buildship-app-us-central1/publicLib/nodesV2/@buildship/api-call/null/build.cjs",
                "output": {
                    "buildship": {},
                    "properties": {
                        "data": {
                            "title": "Data",
                            "type": "object",
                            "buildship": {
                                "index": "1"
                            },
                            "description": "The data object from the API response"
                        },
                        "status": {
                            "title": "Status",
                            "type": "number",
                            "buildship": {
                                "index": "0"
                            },
                            "description": "The HTTP status of the API response"
                        }
                    },
                    "type": "object"
                },
                "type": "script"
            },
            {
                "else": [
                    {
                        "description": "The Output Node returns values from the flow and handles HTTP response codes.  \nThe default configuration is to return the previous node output. But you can specify any custom output to return variables from other nodes or JavaScript expressions. \n\nLearn more about the Output node: [Docs](https://docs.buildship.com/core-nodes/return)",
                        "properties": {},
                        "type": "output",
                        "id": "5562f10f-183d-4910-8874-b81fef0e766d",
                        "required": [],
                        "label": "Output"
                    }
                ],
                "condition": true,
                "type": "branch",
                "label": "Branch",
                "id": "6072d0c9-6672-4c03-b36c-81a7a69f316f",
                "description": "Execute different sets of actions based on a specific condition. \n\nLearn more about the Branch node: [Docs](https://docs.buildship.com/core-nodes/if-else)",
                "then": [
                    {
                        "nodes": [
                            {
                                "meta": {
                                    "icon": {
                                        "type": "SVG",
                                        "svg": "<path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 15c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1-8h-2V7h2v2z\"></path>"
                                    },
                                    "id": "log-to-console",
                                    "name": "Log Message to Console",
                                    "description": "Logs a message to the console"
                                },
                                "type": "script",
                                "_libRef": {
                                    "isDirty": false,
                                    "libType": "public",
                                    "version": "1.2.3",
                                    "integrity": "v3:800f7d58192f023fea875e6850fd901b",
                                    "src": "https://storage.googleapis.com/buildship-app-us-central1/publicLib/nodesV2/@buildship/log-to-console/1.2.3/build.cjs",
                                    "buildHash": "53bdd69af060032a795f94e098e7f5b2d14ff7c3461acc27a1046ca7dfffa54d",
                                    "libNodeRefId": "@buildship/log-to-console"
                                },
                                "integrations": [],
                                "inputs": {
                                    "required": [
                                        "message"
                                    ],
                                    "type": "object",
                                    "properties": {
                                        "message": {
                                            "buildship": {
                                                "sensitive": false,
                                                "index": "0"
                                            },
                                            "default": "log",
                                            "description": "The message to log to the console",
                                            "properties": {},
                                            "title": "Message"
                                        }
                                    }
                                },
                                "script": "export default function logMessageToConsole({ message }: NodeInputs, { logging }: NodeScriptOptions) : NodeOutput  {\n  logging.log(message);\n}\n",
                                "label": "Log Message to Console",
                                "id": "c5dbe9b1-c4a4-4192-87b6-fa7b83bda766",
                                "output": {
                                    "title": "Output",
                                    "properties": {},
                                    "type": "object",
                                    "buildship": {}
                                },
                                "dependencies": {}
                            },
                            {
                                "dependencies": {
                                    "node-fetch": "3.3.2"
                                },
                                "version": "null",
                                "_libRef": {
                                    "buildHash": "21b519df8810ddc5d7d290fc68cbb60ce449201673c524b86cc30b4f591135ed",
                                    "libType": "public",
                                    "integrity": "v3:dfd2c1a8dc0bc82e8962b5017d3bb0c1",
                                    "libNodeRefId": "@buildship/api-call",
                                    "isDirty": false,
                                    "src": "https://storage.googleapis.com/buildship-app-us-central1/publicLib/nodesV2/@buildship/api-call/5.0.0/build.cjs",
                                    "version": "5.0.0"
                                },
                                "src": "https://storage.googleapis.com/buildship-app-us-central1/publicLib/nodesV2/@buildship/api-call/null/build.cjs",
                                "script": "import fetch from \"node-fetch\";\nexport default async function apiCall({\n    url,\n    method,\n    contentType,\n    authorization,\n    body,\n    shouldAwait,\n    queryParams\n}: NodeInputs, {\n    logging\n}: NodeScriptOptions) : NodeOutput  {\n    const headers = {\n        \"Content-Type\": contentType\n    };\n    if (authorization) headers[\"Authorization\"] = authorization;\n\n    let queryParamsString = '';\n    if (queryParams) {\n        queryParamsString = '?' + new URLSearchParams(queryParams).toString();\n    }\n\n    const fetchOptions = {\n        method,\n        headers\n    };\n\n    if (method !== 'GET') {\n        fetchOptions.body = JSON.stringify(body);\n    }\n\n    const fetchPromise = fetch(url + queryParamsString, fetchOptions);\n\n    if (!shouldAwait) {\n        return {\n            data: null\n        };\n    }\n\n    const response = await fetchPromise;\n    const data = await response.json();\n    return {\n        status: response.status,\n        data\n    };\n}",
                                "inputs": {
                                    "type": "object",
                                    "properties": {
                                        "queryParams": {
                                            "properties": {},
                                            "description": "The query parameters for the API call.\n\nSAMPLE INPUT:\n```\n{ \n  \"query1\": \"value1\",\n  \"query2\": \"value2\"\n}\n```",
                                            "buildship": {
                                                "index": "3",
                                                "sensitive": false
                                            },
                                            "title": "Query Parameters",
                                            "default": {},
                                            "pattern": "",
                                            "type": "object"
                                        },
                                        "body": {
                                            "title": "Body",
                                            "description": "The body to send with the API call",
                                            "buildship": {
                                                "index": "4"
                                            },
                                            "type": "object"
                                        },
                                        "shouldAwait": {
                                            "buildship": {
                                                "index": "6",
                                                "sensitive": false
                                            },
                                            "pattern": "",
                                            "description": "Whether to wait for the request to complete or not",
                                            "type": "boolean",
                                            "title": "Await?"
                                        },
                                        "url": {
                                            "title": "URL",
                                            "description": "The URL of the API endpoint",
                                            "type": "string",
                                            "buildship": {
                                                "index": "1"
                                            }
                                        },
                                        "method": {
                                            "default": "",
                                            "description": "The HTTP method to use for the API call",
                                            "title": "HTTP Method",
                                            "pattern": "",
                                            "buildship": {
                                                "index": "0",
                                                "options": [
                                                    {
                                                        "label": "GET",
                                                        "value": "GET"
                                                    },
                                                    {
                                                        "value": "POST",
                                                        "label": "POST"
                                                    },
                                                    {
                                                        "label": "PUT",
                                                        "value": "PUT"
                                                    },
                                                    {
                                                        "label": "DELETE",
                                                        "value": "DELETE"
                                                    },
                                                    {
                                                        "label": "PATCH",
                                                        "value": "PATCH"
                                                    }
                                                ],
                                                "sensitive": false
                                            },
                                            "enum": [
                                                "GET",
                                                "POST",
                                                "PUT",
                                                "DELETE",
                                                "PATCH"
                                            ],
                                            "type": "string"
                                        },
                                        "contentType": {
                                            "enum": [
                                                "application/json",
                                                "application/x-www-form-urlencoded",
                                                "multipart/form-data",
                                                "text/plain"
                                            ],
                                            "type": "string",
                                            "description": "The content type of the API call",
                                            "title": "Content Type",
                                            "buildship": {
                                                "options": [
                                                    {
                                                        "label": "application/json",
                                                        "value": "application/json"
                                                    },
                                                    {
                                                        "value": "application/x-www-form-urlencoded",
                                                        "label": "application/x-www-form-urlencoded"
                                                    },
                                                    {
                                                        "value": "multipart/form-data",
                                                        "label": "multipart/form-data"
                                                    },
                                                    {
                                                        "value": "text/plain",
                                                        "label": "text/plain"
                                                    }
                                                ],
                                                "index": "5"
                                            }
                                        },
                                        "authorization": {
                                            "buildship": {
                                                "index": "2",
                                                "sensitive": false
                                            },
                                            "title": "Authorization",
                                            "pattern": "",
                                            "type": "string",
                                            "description": "The authorization header for the API call, if required (e.g., Bearer or Basic token)"
                                        }
                                    },
                                    "required": [
                                        "url",
                                        "shouldAwait",
                                        "method"
                                    ]
                                },
                                "generateDocs": {
                                    "ranBy": "bhavya@rowy.io.rowy",
                                    "completedAt": {
                                        "_nanoseconds": "711000000",
                                        "_seconds": "1716413349"
                                    }
                                },
                                "type": "script",
                                "integrity": "v3:dfd2c1a8dc0bc82e8962b5017d3bb0c1",
                                "output": {
                                    "buildship": {},
                                    "type": "object",
                                    "properties": {
                                        "data": {
                                            "type": "object",
                                            "description": "The data object from the API response",
                                            "buildship": {
                                                "index": "1"
                                            },
                                            "title": "Data"
                                        },
                                        "status": {
                                            "title": "Status",
                                            "type": "number",
                                            "description": "The HTTP status of the API response",
                                            "buildship": {
                                                "index": "0"
                                            }
                                        }
                                    }
                                },
                                "meta": {
                                    "id": "api-call",
                                    "icon": {
                                        "type": "SVG",
                                        "svg": "<path d=\"m14 12l-2 2l-2-2l2-2l2 2zm-2-6l2.12 2.12l2.5-2.5L12 1L7.38 5.62l2.5 2.5L12 6zm-6 6l2.12-2.12l-2.5-2.5L1 12l4.62 4.62l2.5-2.5L6 12zm12 0l-2.12 2.12l2.5 2.5L23 12l-4.62-4.62l-2.5 2.5L18 12zm-6 6l-2.12-2.12l-2.5 2.5L12 23l4.62-4.62l-2.5-2.5L12 18z\"></path>"
                                    },
                                    "description": "Make an API call using fetch with provided url, method, contentType, authorization, and body",
                                    "name": "API Call Node"
                                },
                                "integrations": [],
                                "groupInfo": null,
                                "id": "3fb2b37a-ce1c-4df7-98a5-62931002e386",
                                "label": "API - Author"
                            },
                            {
                                "type": "branch",
                                "id": "42240245-fd63-4015-845c-e2f45ea780eb",
                                "condition": true,
                                "else": [
                                    {
                                        "label": "Output",
                                        "id": "34bf8cbb-56dd-4757-ab0b-268e832bebc8",
                                        "required": [],
                                        "properties": {},
                                        "type": "output",
                                        "description": "The Output Node returns values from the flow and handles HTTP response codes.  \nThe default configuration is to return the previous node output. But you can specify any custom output to return variables from other nodes or JavaScript expressions. \n\nLearn more about the Output node: [Docs](https://docs.buildship.com/core-nodes/return)"
                                    }
                                ],
                                "label": "Branch",
                                "description": "Execute different sets of actions based on a specific condition. \n\nLearn more about the Branch node: [Docs](https://docs.buildship.com/core-nodes/if-else)",
                                "then": [
                                    {
                                        "inputs": {
                                            "required": [
                                                "name",
                                                "value"
                                            ],
                                            "properties": {
                                                "value": {
                                                    "type": "array",
                                                    "title": "Value",
                                                    "buildship": {
                                                        "sensitive": false,
                                                        "defaultExpressionType": "text",
                                                        "index": "1"
                                                    },
                                                    "description": "The value to set the variable to"
                                                },
                                                "name": {
                                                    "enum": [],
                                                    "title": "Name",
                                                    "description": "The name of the variable",
                                                    "buildship": {
                                                        "index": "0"
                                                    },
                                                    "type": "string"
                                                }
                                            },
                                            "type": "object"
                                        },
                                        "label": "Set Variable",
                                        "type": "set-variable",
                                        "description": "Local variables allow you to store and modify values throughout a workflow. Unlike request variables, local variables are defined within the workflow and can be modified at different steps. \n\nHow to use:  \n1. In the name selector, click “Add variable” to create a new variable in your workflow.  \n2. Use the “Set Variable” node in different steps of your flow and change the value.  \n3. Reference the variable in nodes, logic or conditions. \n\nLocal variables make workflows more flexible, helping you manage dynamic data more efficiently.",
                                        "id": "c1a96e2f-ef0d-45b2-99df-7a85eb19b50a"
                                    }
                                ]
                            }
                        ],
                        "label": "Loop",
                        "type": "loop",
                        "id": "55120dbe-08e9-47f0-ac7e-a82875bd9077",
                        "description": "The Loop node processes each element in the input data sequentially, applying specified actions. Ideal for step-by-step transformations and ordered execution. \n\nLearn more about the Loop node: [Docs](https://docs.buildship.com/core-nodes/loop)"
                    }
                ]
            }
        ],
        "description": "Execute different sets of actions based on a specific condition. \n\nLearn more about the Branch node: [Docs](https://docs.buildship.com/core-nodes/if-else)"
    },
    {
        "integrity": "v3:dfd2c1a8dc0bc82e8962b5017d3bb0c1",
        "meta": {
            "description": "Make an API call using fetch with provided url, method, contentType, authorization, and body",
            "id": "api-call",
            "icon": {
                "svg": "<path d=\"m14 12l-2 2l-2-2l2-2l2 2zm-2-6l2.12 2.12l2.5-2.5L12 1L7.38 5.62l2.5 2.5L12 6zm-6 6l2.12-2.12l-2.5-2.5L1 12l4.62 4.62l2.5-2.5L6 12zm12 0l-2.12 2.12l2.5 2.5L23 12l-4.62-4.62l-2.5 2.5L18 12zm-6 6l-2.12-2.12l-2.5 2.5L12 23l4.62-4.62l-2.5-2.5L12 18z\"></path>",
                "type": "SVG"
            },
            "name": "API Call Node"
        },
        "onFail": null,
        "integrations": [],
        "label": "API - Works",
        "groupInfo": null,
        "id": "de9e2852-0b6f-42cd-b757-c12cc592c540",
        "_libRef": {
            "src": "https://storage.googleapis.com/buildship-app-us-central1/publicLib/nodesV2/@buildship/api-call/5.0.0/build.cjs",
            "isDirty": false,
            "libType": "public",
            "libNodeRefId": "@buildship/api-call",
            "integrity": "v3:dfd2c1a8dc0bc82e8962b5017d3bb0c1",
            "buildHash": "21b519df8810ddc5d7d290fc68cbb60ce449201673c524b86cc30b4f591135ed",
            "version": "5.0.0"
        },
        "script": "import fetch from \"node-fetch\";\nexport default async function apiCall({\n    url,\n    method,\n    contentType,\n    authorization,\n    body,\n    shouldAwait,\n    queryParams\n}: NodeInputs, {\n    logging\n}: NodeScriptOptions) : NodeOutput  {\n    const headers = {\n        \"Content-Type\": contentType\n    };\n    if (authorization) headers[\"Authorization\"] = authorization;\n\n    let queryParamsString = '';\n    if (queryParams) {\n        queryParamsString = '?' + new URLSearchParams(queryParams).toString();\n    }\n\n    const fetchOptions = {\n        method,\n        headers\n    };\n\n    if (method !== 'GET') {\n        fetchOptions.body = JSON.stringify(body);\n    }\n\n    const fetchPromise = fetch(url + queryParamsString, fetchOptions);\n\n    if (!shouldAwait) {\n        return {\n            data: null\n        };\n    }\n\n    const response = await fetchPromise;\n    const data = await response.json();\n    return {\n        status: response.status,\n        data\n    };\n}",
        "generateDocs": {
            "ranBy": "bhavya@rowy.io.rowy",
            "completedAt": {
                "_nanoseconds": "711000000",
                "_seconds": "1716413349"
            }
        },
        "inputs": {
            "properties": {
                "shouldAwait": {
                    "pattern": "",
                    "title": "Await?",
                    "type": "boolean",
                    "description": "Whether to wait for the request to complete or not",
                    "buildship": {
                        "index": "6",
                        "sensitive": false
                    }
                },
                "queryParams": {
                    "buildship": {
                        "index": "3",
                        "sensitive": false
                    },
                    "properties": {},
                    "description": "The query parameters for the API call.\n\nSAMPLE INPUT:\n```\n{ \n  \"query1\": \"value1\",\n  \"query2\": \"value2\"\n}\n```",
                    "default": {},
                    "type": "object",
                    "pattern": "",
                    "title": "Query Parameters"
                },
                "url": {
                    "type": "string",
                    "buildship": {
                        "index": "1"
                    },
                    "description": "The URL of the API endpoint",
                    "title": "URL"
                },
                "method": {
                    "buildship": {
                        "options": [
                            {
                                "value": "GET",
                                "label": "GET"
                            },
                            {
                                "label": "POST",
                                "value": "POST"
                            },
                            {
                                "value": "PUT",
                                "label": "PUT"
                            },
                            {
                                "label": "DELETE",
                                "value": "DELETE"
                            },
                            {
                                "label": "PATCH",
                                "value": "PATCH"
                            }
                        ],
                        "sensitive": false,
                        "index": "0"
                    },
                    "type": "string",
                    "default": "",
                    "enum": [
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE",
                        "PATCH"
                    ],
                    "pattern": "",
                    "title": "HTTP Method",
                    "description": "The HTTP method to use for the API call"
                },
                "body": {
                    "description": "The body to send with the API call",
                    "buildship": {
                        "index": "4"
                    },
                    "title": "Body",
                    "type": "object"
                },
                "contentType": {
                    "description": "The content type of the API call",
                    "type": "string",
                    "buildship": {
                        "options": [
                            {
                                "label": "application/json",
                                "value": "application/json"
                            },
                            {
                                "label": "application/x-www-form-urlencoded",
                                "value": "application/x-www-form-urlencoded"
                            },
                            {
                                "label": "multipart/form-data",
                                "value": "multipart/form-data"
                            },
                            {
                                "value": "text/plain",
                                "label": "text/plain"
                            }
                        ],
                        "index": "5"
                    },
                    "enum": [
                        "application/json",
                        "application/x-www-form-urlencoded",
                        "multipart/form-data",
                        "text/plain"
                    ],
                    "title": "Content Type"
                },
                "authorization": {
                    "pattern": "",
                    "buildship": {
                        "index": "2",
                        "sensitive": false
                    },
                    "title": "Authorization",
                    "description": "The authorization header for the API call, if required (e.g., Bearer or Basic token)",
                    "type": "string"
                }
            },
            "required": [
                "url",
                "shouldAwait",
                "method"
            ],
            "type": "object"
        },
        "dependencies": {
            "node-fetch": "3.3.2"
        },
        "version": "null",
        "src": "https://storage.googleapis.com/buildship-app-us-central1/publicLib/nodesV2/@buildship/api-call/null/build.cjs",
        "output": {
            "buildship": {},
            "properties": {
                "data": {
                    "title": "Data",
                    "type": "object",
                    "buildship": {
                        "index": "1"
                    },
                    "description": "The data object from the API response"
                },
                "status": {
                    "title": "Status",
                    "type": "number",
                    "buildship": {
                        "index": "0"
                    },
                    "description": "The HTTP status of the API response"
                }
            },
            "type": "object"
        },
        "type": "script"
    },
    {
        "else": [
            {
                "description": "The Output Node returns values from the flow and handles HTTP response codes.  \nThe default configuration is to return the previous node output. But you can specify any custom output to return variables from other nodes or JavaScript expressions. \n\nLearn more about the Output node: [Docs](https://docs.buildship.com/core-nodes/return)",
                "properties": {},
                "type": "output",
                "id": "5562f10f-183d-4910-8874-b81fef0e766d",
                "required": [],
                "label": "Output"
            }
        ],
        "condition": true,
        "type": "branch",
        "label": "Branch",
        "id": "6072d0c9-6672-4c03-b36c-81a7a69f316f",
        "description": "Execute different sets of actions based on a specific condition. \n\nLearn more about the Branch node: [Docs](https://docs.buildship.com/core-nodes/if-else)",
        "then": [
            {
                "nodes": [
                    {
                        "meta": {
                            "icon": {
                                "type": "SVG",
                                "svg": "<path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 15c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1-8h-2V7h2v2z\"></path>"
                            },
                            "id": "log-to-console",
                            "name": "Log Message to Console",
                            "description": "Logs a message to the console"
                        },
                        "type": "script",
                        "_libRef": {
                            "isDirty": false,
                            "libType": "public",
                            "version": "1.2.3",
                            "integrity": "v3:800f7d58192f023fea875e6850fd901b",
                            "src": "https://storage.googleapis.com/buildship-app-us-central1/publicLib/nodesV2/@buildship/log-to-console/1.2.3/build.cjs",
                            "buildHash": "53bdd69af060032a795f94e098e7f5b2d14ff7c3461acc27a1046ca7dfffa54d",
                            "libNodeRefId": "@buildship/log-to-console"
                        },
                        "integrations": [],
                        "inputs": {
                            "required": [
                                "message"
                            ],
                            "type": "object",
                            "properties": {
                                "message": {
                                    "buildship": {
                                        "sensitive": false,
                                        "index": "0"
                                    },
                                    "default": "log",
                                    "description": "The message to log to the console",
                                    "properties": {},
                                    "title": "Message"
                                }
                            }
                        },
                        "script": "export default function logMessageToConsole({ message }: NodeInputs, { logging }: NodeScriptOptions) : NodeOutput  {\n  logging.log(message);\n}\n",
                        "label": "Log Message to Console",
                        "id": "c5dbe9b1-c4a4-4192-87b6-fa7b83bda766",
                        "output": {
                            "title": "Output",
                            "properties": {},
                            "type": "object",
                            "buildship": {}
                        },
                        "dependencies": {}
                    },
                    {
                        "dependencies": {
                            "node-fetch": "3.3.2"
                        },
                        "version": "null",
                        "_libRef": {
                            "buildHash": "21b519df8810ddc5d7d290fc68cbb60ce449201673c524b86cc30b4f591135ed",
                            "libType": "public",
                            "integrity": "v3:dfd2c1a8dc0bc82e8962b5017d3bb0c1",
                            "libNodeRefId": "@buildship/api-call",
                            "isDirty": false,
                            "src": "https://storage.googleapis.com/buildship-app-us-central1/publicLib/nodesV2/@buildship/api-call/5.0.0/build.cjs",
                            "version": "5.0.0"
                        },
                        "src": "https://storage.googleapis.com/buildship-app-us-central1/publicLib/nodesV2/@buildship/api-call/null/build.cjs",
                        "script": "import fetch from \"node-fetch\";\nexport default async function apiCall({\n    url,\n    method,\n    contentType,\n    authorization,\n    body,\n    shouldAwait,\n    queryParams\n}: NodeInputs, {\n    logging\n}: NodeScriptOptions) : NodeOutput  {\n    const headers = {\n        \"Content-Type\": contentType\n    };\n    if (authorization) headers[\"Authorization\"] = authorization;\n\n    let queryParamsString = '';\n    if (queryParams) {\n        queryParamsString = '?' + new URLSearchParams(queryParams).toString();\n    }\n\n    const fetchOptions = {\n        method,\n        headers\n    };\n\n    if (method !== 'GET') {\n        fetchOptions.body = JSON.stringify(body);\n    }\n\n    const fetchPromise = fetch(url + queryParamsString, fetchOptions);\n\n    if (!shouldAwait) {\n        return {\n            data: null\n        };\n    }\n\n    const response = await fetchPromise;\n    const data = await response.json();\n    return {\n        status: response.status,\n        data\n    };\n}",
                        "inputs": {
                            "type": "object",
                            "properties": {
                                "queryParams": {
                                    "properties": {},
                                    "description": "The query parameters for the API call.\n\nSAMPLE INPUT:\n```\n{ \n  \"query1\": \"value1\",\n  \"query2\": \"value2\"\n}\n```",
                                    "buildship": {
                                        "index": "3",
                                        "sensitive": false
                                    },
                                    "title": "Query Parameters",
                                    "default": {},
                                    "pattern": "",
                                    "type": "object"
                                },
                                "body": {
                                    "title": "Body",
                                    "description": "The body to send with the API call",
                                    "buildship": {
                                        "index": "4"
                                    },
                                    "type": "object"
                                },
                                "shouldAwait": {
                                    "buildship": {
                                        "index": "6",
                                        "sensitive": false
                                    },
                                    "pattern": "",
                                    "description": "Whether to wait for the request to complete or not",
                                    "type": "boolean",
                                    "title": "Await?"
                                },
                                "url": {
                                    "title": "URL",
                                    "description": "The URL of the API endpoint",
                                    "type": "string",
                                    "buildship": {
                                        "index": "1"
                                    }
                                },
                                "method": {
                                    "default": "",
                                    "description": "The HTTP method to use for the API call",
                                    "title": "HTTP Method",
                                    "pattern": "",
                                    "buildship": {
                                        "index": "0",
                                        "options": [
                                            {
                                                "label": "GET",
                                                "value": "GET"
                                            },
                                            {
                                                "value": "POST",
                                                "label": "POST"
                                            },
                                            {
                                                "label": "PUT",
                                                "value": "PUT"
                                            },
                                            {
                                                "label": "DELETE",
                                                "value": "DELETE"
                                            },
                                            {
                                                "label": "PATCH",
                                                "value": "PATCH"
                                            }
                                        ],
                                        "sensitive": false
                                    },
                                    "enum": [
                                        "GET",
                                        "POST",
                                        "PUT",
                                        "DELETE",
                                        "PATCH"
                                    ],
                                    "type": "string"
                                },
                                "contentType": {
                                    "enum": [
                                        "application/json",
                                        "application/x-www-form-urlencoded",
                                        "multipart/form-data",
                                        "text/plain"
                                    ],
                                    "type": "string",
                                    "description": "The content type of the API call",
                                    "title": "Content Type",
                                    "buildship": {
                                        "options": [
                                            {
                                                "label": "application/json",
                                                "value": "application/json"
                                            },
                                            {
                                                "value": "application/x-www-form-urlencoded",
                                                "label": "application/x-www-form-urlencoded"
                                            },
                                            {
                                                "value": "multipart/form-data",
                                                "label": "multipart/form-data"
                                            },
                                            {
                                                "value": "text/plain",
                                                "label": "text/plain"
                                            }
                                        ],
                                        "index": "5"
                                    }
                                },
                                "authorization": {
                                    "buildship": {
                                        "index": "2",
                                        "sensitive": false
                                    },
                                    "title": "Authorization",
                                    "pattern": "",
                                    "type": "string",
                                    "description": "The authorization header for the API call, if required (e.g., Bearer or Basic token)"
                                }
                            },
                            "required": [
                                "url",
                                "shouldAwait",
                                "method"
                            ]
                        },
                        "generateDocs": {
                            "ranBy": "bhavya@rowy.io.rowy",
                            "completedAt": {
                                "_nanoseconds": "711000000",
                                "_seconds": "1716413349"
                            }
                        },
                        "type": "script",
                        "integrity": "v3:dfd2c1a8dc0bc82e8962b5017d3bb0c1",
                        "output": {
                            "buildship": {},
                            "type": "object",
                            "properties": {
                                "data": {
                                    "type": "object",
                                    "description": "The data object from the API response",
                                    "buildship": {
                                        "index": "1"
                                    },
                                    "title": "Data"
                                },
                                "status": {
                                    "title": "Status",
                                    "type": "number",
                                    "description": "The HTTP status of the API response",
                                    "buildship": {
                                        "index": "0"
                                    }
                                }
                            }
                        },
                        "meta": {
                            "id": "api-call",
                            "icon": {
                                "type": "SVG",
                                "svg": "<path d=\"m14 12l-2 2l-2-2l2-2l2 2zm-2-6l2.12 2.12l2.5-2.5L12 1L7.38 5.62l2.5 2.5L12 6zm-6 6l2.12-2.12l-2.5-2.5L1 12l4.62 4.62l2.5-2.5L6 12zm12 0l-2.12 2.12l2.5 2.5L23 12l-4.62-4.62l-2.5 2.5L18 12zm-6 6l-2.12-2.12l-2.5 2.5L12 23l4.62-4.62l-2.5-2.5L12 18z\"></path>"
                            },
                            "description": "Make an API call using fetch with provided url, method, contentType, authorization, and body",
                            "name": "API Call Node"
                        },
                        "integrations": [],
                        "groupInfo": null,
                        "id": "3fb2b37a-ce1c-4df7-98a5-62931002e386",
                        "label": "API - Author"
                    },
                    {
                        "type": "branch",
                        "id": "42240245-fd63-4015-845c-e2f45ea780eb",
                        "condition": true,
                        "else": [
                            {
                                "label": "Output",
                                "id": "34bf8cbb-56dd-4757-ab0b-268e832bebc8",
                                "required": [],
                                "properties": {},
                                "type": "output",
                                "description": "The Output Node returns values from the flow and handles HTTP response codes.  \nThe default configuration is to return the previous node output. But you can specify any custom output to return variables from other nodes or JavaScript expressions. \n\nLearn more about the Output node: [Docs](https://docs.buildship.com/core-nodes/return)"
                            }
                        ],
                        "label": "Branch",
                        "description": "Execute different sets of actions based on a specific condition. \n\nLearn more about the Branch node: [Docs](https://docs.buildship.com/core-nodes/if-else)",
                        "then": [
                            {
                                "inputs": {
                                    "required": [
                                        "name",
                                        "value"
                                    ],
                                    "properties": {
                                        "value": {
                                            "type": "array",
                                            "title": "Value",
                                            "buildship": {
                                                "sensitive": false,
                                                "defaultExpressionType": "text",
                                                "index": "1"
                                            },
                                            "description": "The value to set the variable to"
                                        },
                                        "name": {
                                            "enum": [],
                                            "title": "Name",
                                            "description": "The name of the variable",
                                            "buildship": {
                                                "index": "0"
                                            },
                                            "type": "string"
                                        }
                                    },
                                    "type": "object"
                                },
                                "label": "Set Variable",
                                "type": "set-variable",
                                "description": "Local variables allow you to store and modify values throughout a workflow. Unlike request variables, local variables are defined within the workflow and can be modified at different steps. \n\nHow to use:  \n1. In the name selector, click “Add variable” to create a new variable in your workflow.  \n2. Use the “Set Variable” node in different steps of your flow and change the value.  \n3. Reference the variable in nodes, logic or conditions. \n\nLocal variables make workflows more flexible, helping you manage dynamic data more efficiently.",
                                "id": "c1a96e2f-ef0d-45b2-99df-7a85eb19b50a"
                            }
                        ]
                    }
                ],
                "label": "Loop",
                "type": "loop",
                "id": "55120dbe-08e9-47f0-ac7e-a82875bd9077",
                "description": "The Loop node processes each element in the input data sequentially, applying specified actions. Ideal for step-by-step transformations and ordered execution. \n\nLearn more about the Loop node: [Docs](https://docs.buildship.com/core-nodes/loop)"
            }
        ]
    },
    {
        "nodes": [
            {
                "meta": {
                    "icon": {
                        "type": "SVG",
                        "svg": "<path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 15c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1-8h-2V7h2v2z\"></path>"
                    },
                    "id": "log-to-console",
                    "name": "Log Message to Console",
                    "description": "Logs a message to the console"
                },
                "type": "script",
                "_libRef": {
                    "isDirty": false,
                    "libType": "public",
                    "version": "1.2.3",
                    "integrity": "v3:800f7d58192f023fea875e6850fd901b",
                    "src": "https://storage.googleapis.com/buildship-app-us-central1/publicLib/nodesV2/@buildship/log-to-console/1.2.3/build.cjs",
                    "buildHash": "53bdd69af060032a795f94e098e7f5b2d14ff7c3461acc27a1046ca7dfffa54d",
                    "libNodeRefId": "@buildship/log-to-console"
                },
                "integrations": [],
                "inputs": {
                    "required": [
                        "message"
                    ],
                    "type": "object",
                    "properties": {
                        "message": {
                            "buildship": {
                                "sensitive": false,
                                "index": "0"
                            },
                            "default": "log",
                            "description": "The message to log to the console",
                            "properties": {},
                            "title": "Message"
                        }
                    }
                },
                "script": "export default function logMessageToConsole({ message }: NodeInputs, { logging }: NodeScriptOptions) : NodeOutput  {\n  logging.log(message);\n}\n",
                "label": "Log Message to Console",
                "id": "c5dbe9b1-c4a4-4192-87b6-fa7b83bda766",
                "output": {
                    "title": "Output",
                    "properties": {},
                    "type": "object",
                    "buildship": {}
                },
                "dependencies": {}
            },
            {
                "dependencies": {
                    "node-fetch": "3.3.2"
                },
                "version": "null",
                "_libRef": {
                    "buildHash": "21b519df8810ddc5d7d290fc68cbb60ce449201673c524b86cc30b4f591135ed",
                    "libType": "public",
                    "integrity": "v3:dfd2c1a8dc0bc82e8962b5017d3bb0c1",
                    "libNodeRefId": "@buildship/api-call",
                    "isDirty": false,
                    "src": "https://storage.googleapis.com/buildship-app-us-central1/publicLib/nodesV2/@buildship/api-call/5.0.0/build.cjs",
                    "version": "5.0.0"
                },
                "src": "https://storage.googleapis.com/buildship-app-us-central1/publicLib/nodesV2/@buildship/api-call/null/build.cjs",
                "script": "import fetch from \"node-fetch\";\nexport default async function apiCall({\n    url,\n    method,\n    contentType,\n    authorization,\n    body,\n    shouldAwait,\n    queryParams\n}: NodeInputs, {\n    logging\n}: NodeScriptOptions) : NodeOutput  {\n    const headers = {\n        \"Content-Type\": contentType\n    };\n    if (authorization) headers[\"Authorization\"] = authorization;\n\n    let queryParamsString = '';\n    if (queryParams) {\n        queryParamsString = '?' + new URLSearchParams(queryParams).toString();\n    }\n\n    const fetchOptions = {\n        method,\n        headers\n    };\n\n    if (method !== 'GET') {\n        fetchOptions.body = JSON.stringify(body);\n    }\n\n    const fetchPromise = fetch(url + queryParamsString, fetchOptions);\n\n    if (!shouldAwait) {\n        return {\n            data: null\n        };\n    }\n\n    const response = await fetchPromise;\n    const data = await response.json();\n    return {\n        status: response.status,\n        data\n    };\n}",
                "inputs": {
                    "type": "object",
                    "properties": {
                        "queryParams": {
                            "properties": {},
                            "description": "The query parameters for the API call.\n\nSAMPLE INPUT:\n```\n{ \n  \"query1\": \"value1\",\n  \"query2\": \"value2\"\n}\n```",
                            "buildship": {
                                "index": "3",
                                "sensitive": false
                            },
                            "title": "Query Parameters",
                            "default": {},
                            "pattern": "",
                            "type": "object"
                        },
                        "body": {
                            "title": "Body",
                            "description": "The body to send with the API call",
                            "buildship": {
                                "index": "4"
                            },
                            "type": "object"
                        },
                        "shouldAwait": {
                            "buildship": {
                                "index": "6",
                                "sensitive": false
                            },
                            "pattern": "",
                            "description": "Whether to wait for the request to complete or not",
                            "type": "boolean",
                            "title": "Await?"
                        },
                        "url": {
                            "title": "URL",
                            "description": "The URL of the API endpoint",
                            "type": "string",
                            "buildship": {
                                "index": "1"
                            }
                        },
                        "method": {
                            "default": "",
                            "description": "The HTTP method to use for the API call",
                            "title": "HTTP Method",
                            "pattern": "",
                            "buildship": {
                                "index": "0",
                                "options": [
                                    {
                                        "label": "GET",
                                        "value": "GET"
                                    },
                                    {
                                        "value": "POST",
                                        "label": "POST"
                                    },
                                    {
                                        "label": "PUT",
                                        "value": "PUT"
                                    },
                                    {
                                        "label": "DELETE",
                                        "value": "DELETE"
                                    },
                                    {
                                        "label": "PATCH",
                                        "value": "PATCH"
                                    }
                                ],
                                "sensitive": false
                            },
                            "enum": [
                                "GET",
                                "POST",
                                "PUT",
                                "DELETE",
                                "PATCH"
                            ],
                            "type": "string"
                        },
                        "contentType": {
                            "enum": [
                                "application/json",
                                "application/x-www-form-urlencoded",
                                "multipart/form-data",
                                "text/plain"
                            ],
                            "type": "string",
                            "description": "The content type of the API call",
                            "title": "Content Type",
                            "buildship": {
                                "options": [
                                    {
                                        "label": "application/json",
                                        "value": "application/json"
                                    },
                                    {
                                        "value": "application/x-www-form-urlencoded",
                                        "label": "application/x-www-form-urlencoded"
                                    },
                                    {
                                        "value": "multipart/form-data",
                                        "label": "multipart/form-data"
                                    },
                                    {
                                        "value": "text/plain",
                                        "label": "text/plain"
                                    }
                                ],
                                "index": "5"
                            }
                        },
                        "authorization": {
                            "buildship": {
                                "index": "2",
                                "sensitive": false
                            },
                            "title": "Authorization",
                            "pattern": "",
                            "type": "string",
                            "description": "The authorization header for the API call, if required (e.g., Bearer or Basic token)"
                        }
                    },
                    "required": [
                        "url",
                        "shouldAwait",
                        "method"
                    ]
                },
                "generateDocs": {
                    "ranBy": "bhavya@rowy.io.rowy",
                    "completedAt": {
                        "_nanoseconds": "711000000",
                        "_seconds": "1716413349"
                    }
                },
                "type": "script",
                "integrity": "v3:dfd2c1a8dc0bc82e8962b5017d3bb0c1",
                "output": {
                    "buildship": {},
                    "type": "object",
                    "properties": {
                        "data": {
                            "type": "object",
                            "description": "The data object from the API response",
                            "buildship": {
                                "index": "1"
                            },
                            "title": "Data"
                        },
                        "status": {
                            "title": "Status",
                            "type": "number",
                            "description": "The HTTP status of the API response",
                            "buildship": {
                                "index": "0"
                            }
                        }
                    }
                },
                "meta": {
                    "id": "api-call",
                    "icon": {
                        "type": "SVG",
                        "svg": "<path d=\"m14 12l-2 2l-2-2l2-2l2 2zm-2-6l2.12 2.12l2.5-2.5L12 1L7.38 5.62l2.5 2.5L12 6zm-6 6l2.12-2.12l-2.5-2.5L1 12l4.62 4.62l2.5-2.5L6 12zm12 0l-2.12 2.12l2.5 2.5L23 12l-4.62-4.62l-2.5 2.5L18 12zm-6 6l-2.12-2.12l-2.5 2.5L12 23l4.62-4.62l-2.5-2.5L12 18z\"></path>"
                    },
                    "description": "Make an API call using fetch with provided url, method, contentType, authorization, and body",
                    "name": "API Call Node"
                },
                "integrations": [],
                "groupInfo": null,
                "id": "3fb2b37a-ce1c-4df7-98a5-62931002e386",
                "label": "API - Author"
            },
            {
                "type": "branch",
                "id": "42240245-fd63-4015-845c-e2f45ea780eb",
                "condition": true,
                "else": [
                    {
                        "label": "Output",
                        "id": "34bf8cbb-56dd-4757-ab0b-268e832bebc8",
                        "required": [],
                        "properties": {},
                        "type": "output",
                        "description": "The Output Node returns values from the flow and handles HTTP response codes.  \nThe default configuration is to return the previous node output. But you can specify any custom output to return variables from other nodes or JavaScript expressions. \n\nLearn more about the Output node: [Docs](https://docs.buildship.com/core-nodes/return)"
                    }
                ],
                "label": "Branch",
                "description": "Execute different sets of actions based on a specific condition. \n\nLearn more about the Branch node: [Docs](https://docs.buildship.com/core-nodes/if-else)",
                "then": [
                    {
                        "inputs": {
                            "required": [
                                "name",
                                "value"
                            ],
                            "properties": {
                                "value": {
                                    "type": "array",
                                    "title": "Value",
                                    "buildship": {
                                        "sensitive": false,
                                        "defaultExpressionType": "text",
                                        "index": "1"
                                    },
                                    "description": "The value to set the variable to"
                                },
                                "name": {
                                    "enum": [],
                                    "title": "Name",
                                    "description": "The name of the variable",
                                    "buildship": {
                                        "index": "0"
                                    },
                                    "type": "string"
                                }
                            },
                            "type": "object"
                        },
                        "label": "Set Variable",
                        "type": "set-variable",
                        "description": "Local variables allow you to store and modify values throughout a workflow. Unlike request variables, local variables are defined within the workflow and can be modified at different steps. \n\nHow to use:  \n1. In the name selector, click “Add variable” to create a new variable in your workflow.  \n2. Use the “Set Variable” node in different steps of your flow and change the value.  \n3. Reference the variable in nodes, logic or conditions. \n\nLocal variables make workflows more flexible, helping you manage dynamic data more efficiently.",
                        "id": "c1a96e2f-ef0d-45b2-99df-7a85eb19b50a"
                    }
                ]
            }
        ],
        "label": "Loop",
        "type": "loop",
        "id": "55120dbe-08e9-47f0-ac7e-a82875bd9077",
        "description": "The Loop node processes each element in the input data sequentially, applying specified actions. Ideal for step-by-step transformations and ordered execution. \n\nLearn more about the Loop node: [Docs](https://docs.buildship.com/core-nodes/loop)"
    },
    {
        "meta": {
            "icon": {
                "type": "SVG",
                "svg": "<path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 15c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1-8h-2V7h2v2z\"></path>"
            },
            "id": "log-to-console",
            "name": "Log Message to Console",
            "description": "Logs a message to the console"
        },
        "type": "script",
        "_libRef": {
            "isDirty": false,
            "libType": "public",
            "version": "1.2.3",
            "integrity": "v3:800f7d58192f023fea875e6850fd901b",
            "src": "https://storage.googleapis.com/buildship-app-us-central1/publicLib/nodesV2/@buildship/log-to-console/1.2.3/build.cjs",
            "buildHash": "53bdd69af060032a795f94e098e7f5b2d14ff7c3461acc27a1046ca7dfffa54d",
            "libNodeRefId": "@buildship/log-to-console"
        },
        "integrations": [],
        "inputs": {
            "required": [
                "message"
            ],
            "type": "object",
            "properties": {
                "message": {
                    "buildship": {
                        "sensitive": false,
                        "index": "0"
                    },
                    "default": "log",
                    "description": "The message to log to the console",
                    "properties": {},
                    "title": "Message"
                }
            }
        },
        "script": "export default function logMessageToConsole({ message }: NodeInputs, { logging }: NodeScriptOptions) : NodeOutput  {\n  logging.log(message);\n}\n",
        "label": "Log Message to Console",
        "id": "c5dbe9b1-c4a4-4192-87b6-fa7b83bda766",
        "output": {
            "title": "Output",
            "properties": {},
            "type": "object",
            "buildship": {}
        },
        "dependencies": {}
    },
    {
        "dependencies": {
            "node-fetch": "3.3.2"
        },
        "version": "null",
        "_libRef": {
            "buildHash": "21b519df8810ddc5d7d290fc68cbb60ce449201673c524b86cc30b4f591135ed",
            "libType": "public",
            "integrity": "v3:dfd2c1a8dc0bc82e8962b5017d3bb0c1",
            "libNodeRefId": "@buildship/api-call",
            "isDirty": false,
            "src": "https://storage.googleapis.com/buildship-app-us-central1/publicLib/nodesV2/@buildship/api-call/5.0.0/build.cjs",
            "version": "5.0.0"
        },
        "src": "https://storage.googleapis.com/buildship-app-us-central1/publicLib/nodesV2/@buildship/api-call/null/build.cjs",
        "script": "import fetch from \"node-fetch\";\nexport default async function apiCall({\n    url,\n    method,\n    contentType,\n    authorization,\n    body,\n    shouldAwait,\n    queryParams\n}: NodeInputs, {\n    logging\n}: NodeScriptOptions) : NodeOutput  {\n    const headers = {\n        \"Content-Type\": contentType\n    };\n    if (authorization) headers[\"Authorization\"] = authorization;\n\n    let queryParamsString = '';\n    if (queryParams) {\n        queryParamsString = '?' + new URLSearchParams(queryParams).toString();\n    }\n\n    const fetchOptions = {\n        method,\n        headers\n    };\n\n    if (method !== 'GET') {\n        fetchOptions.body = JSON.stringify(body);\n    }\n\n    const fetchPromise = fetch(url + queryParamsString, fetchOptions);\n\n    if (!shouldAwait) {\n        return {\n            data: null\n        };\n    }\n\n    const response = await fetchPromise;\n    const data = await response.json();\n    return {\n        status: response.status,\n        data\n    };\n}",
        "inputs": {
            "type": "object",
            "properties": {
                "queryParams": {
                    "properties": {},
                    "description": "The query parameters for the API call.\n\nSAMPLE INPUT:\n```\n{ \n  \"query1\": \"value1\",\n  \"query2\": \"value2\"\n}\n```",
                    "buildship": {
                        "index": "3",
                        "sensitive": false
                    },
                    "title": "Query Parameters",
                    "default": {},
                    "pattern": "",
                    "type": "object"
                },
                "body": {
                    "title": "Body",
                    "description": "The body to send with the API call",
                    "buildship": {
                        "index": "4"
                    },
                    "type": "object"
                },
                "shouldAwait": {
                    "buildship": {
                        "index": "6",
                        "sensitive": false
                    },
                    "pattern": "",
                    "description": "Whether to wait for the request to complete or not",
                    "type": "boolean",
                    "title": "Await?"
                },
                "url": {
                    "title": "URL",
                    "description": "The URL of the API endpoint",
                    "type": "string",
                    "buildship": {
                        "index": "1"
                    }
                },
                "method": {
                    "default": "",
                    "description": "The HTTP method to use for the API call",
                    "title": "HTTP Method",
                    "pattern": "",
                    "buildship": {
                        "index": "0",
                        "options": [
                            {
                                "label": "GET",
                                "value": "GET"
                            },
                            {
                                "value": "POST",
                                "label": "POST"
                            },
                            {
                                "label": "PUT",
                                "value": "PUT"
                            },
                            {
                                "label": "DELETE",
                                "value": "DELETE"
                            },
                            {
                                "label": "PATCH",
                                "value": "PATCH"
                            }
                        ],
                        "sensitive": false
                    },
                    "enum": [
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE",
                        "PATCH"
                    ],
                    "type": "string"
                },
                "contentType": {
                    "enum": [
                        "application/json",
                        "application/x-www-form-urlencoded",
                        "multipart/form-data",
                        "text/plain"
                    ],
                    "type": "string",
                    "description": "The content type of the API call",
                    "title": "Content Type",
                    "buildship": {
                        "options": [
                            {
                                "label": "application/json",
                                "value": "application/json"
                            },
                            {
                                "value": "application/x-www-form-urlencoded",
                                "label": "application/x-www-form-urlencoded"
                            },
                            {
                                "value": "multipart/form-data",
                                "label": "multipart/form-data"
                            },
                            {
                                "value": "text/plain",
                                "label": "text/plain"
                            }
                        ],
                        "index": "5"
                    }
                },
                "authorization": {
                    "buildship": {
                        "index": "2",
                        "sensitive": false
                    },
                    "title": "Authorization",
                    "pattern": "",
                    "type": "string",
                    "description": "The authorization header for the API call, if required (e.g., Bearer or Basic token)"
                }
            },
            "required": [
                "url",
                "shouldAwait",
                "method"
            ]
        },
        "generateDocs": {
            "ranBy": "bhavya@rowy.io.rowy",
            "completedAt": {
                "_nanoseconds": "711000000",
                "_seconds": "1716413349"
            }
        },
        "type": "script",
        "integrity": "v3:dfd2c1a8dc0bc82e8962b5017d3bb0c1",
        "output": {
            "buildship": {},
            "type": "object",
            "properties": {
                "data": {
                    "type": "object",
                    "description": "The data object from the API response",
                    "buildship": {
                        "index": "1"
                    },
                    "title": "Data"
                },
                "status": {
                    "title": "Status",
                    "type": "number",
                    "description": "The HTTP status of the API response",
                    "buildship": {
                        "index": "0"
                    }
                }
            }
        },
        "meta": {
            "id": "api-call",
            "icon": {
                "type": "SVG",
                "svg": "<path d=\"m14 12l-2 2l-2-2l2-2l2 2zm-2-6l2.12 2.12l2.5-2.5L12 1L7.38 5.62l2.5 2.5L12 6zm-6 6l2.12-2.12l-2.5-2.5L1 12l4.62 4.62l2.5-2.5L6 12zm12 0l-2.12 2.12l2.5 2.5L23 12l-4.62-4.62l-2.5 2.5L18 12zm-6 6l-2.12-2.12l-2.5 2.5L12 23l4.62-4.62l-2.5-2.5L12 18z\"></path>"
            },
            "description": "Make an API call using fetch with provided url, method, contentType, authorization, and body",
            "name": "API Call Node"
        },
        "integrations": [],
        "groupInfo": null,
        "id": "3fb2b37a-ce1c-4df7-98a5-62931002e386",
        "label": "API - Author"
    },
    {
        "type": "branch",
        "id": "42240245-fd63-4015-845c-e2f45ea780eb",
        "condition": true,
        "else": [
            {
                "label": "Output",
                "id": "34bf8cbb-56dd-4757-ab0b-268e832bebc8",
                "required": [],
                "properties": {},
                "type": "output",
                "description": "The Output Node returns values from the flow and handles HTTP response codes.  \nThe default configuration is to return the previous node output. But you can specify any custom output to return variables from other nodes or JavaScript expressions. \n\nLearn more about the Output node: [Docs](https://docs.buildship.com/core-nodes/return)"
            }
        ],
        "label": "Branch",
        "description": "Execute different sets of actions based on a specific condition. \n\nLearn more about the Branch node: [Docs](https://docs.buildship.com/core-nodes/if-else)",
        "then": [
            {
                "inputs": {
                    "required": [
                        "name",
                        "value"
                    ],
                    "properties": {
                        "value": {
                            "type": "array",
                            "title": "Value",
                            "buildship": {
                                "sensitive": false,
                                "defaultExpressionType": "text",
                                "index": "1"
                            },
                            "description": "The value to set the variable to"
                        },
                        "name": {
                            "enum": [],
                            "title": "Name",
                            "description": "The name of the variable",
                            "buildship": {
                                "index": "0"
                            },
                            "type": "string"
                        }
                    },
                    "type": "object"
                },
                "label": "Set Variable",
                "type": "set-variable",
                "description": "Local variables allow you to store and modify values throughout a workflow. Unlike request variables, local variables are defined within the workflow and can be modified at different steps. \n\nHow to use:  \n1. In the name selector, click “Add variable” to create a new variable in your workflow.  \n2. Use the “Set Variable” node in different steps of your flow and change the value.  \n3. Reference the variable in nodes, logic or conditions. \n\nLocal variables make workflows more flexible, helping you manage dynamic data more efficiently.",
                "id": "c1a96e2f-ef0d-45b2-99df-7a85eb19b50a"
            }
        ]
    },
    {
        "inputs": {
            "required": [
                "name",
                "value"
            ],
            "properties": {
                "value": {
                    "type": "array",
                    "title": "Value",
                    "buildship": {
                        "sensitive": false,
                        "defaultExpressionType": "text",
                        "index": "1"
                    },
                    "description": "The value to set the variable to"
                },
                "name": {
                    "enum": [],
                    "title": "Name",
                    "description": "The name of the variable",
                    "buildship": {
                        "index": "0"
                    },
                    "type": "string"
                }
            },
            "type": "object"
        },
        "label": "Set Variable",
        "type": "set-variable",
        "description": "Local variables allow you to store and modify values throughout a workflow. Unlike request variables, local variables are defined within the workflow and can be modified at different steps. \n\nHow to use:  \n1. In the name selector, click “Add variable” to create a new variable in your workflow.  \n2. Use the “Set Variable” node in different steps of your flow and change the value.  \n3. Reference the variable in nodes, logic or conditions. \n\nLocal variables make workflows more flexible, helping you manage dynamic data more efficiently.",
        "id": "c1a96e2f-ef0d-45b2-99df-7a85eb19b50a"
    },
    {
        "label": "Output",
        "id": "34bf8cbb-56dd-4757-ab0b-268e832bebc8",
        "required": [],
        "properties": {},
        "type": "output",
        "description": "The Output Node returns values from the flow and handles HTTP response codes.  \nThe default configuration is to return the previous node output. But you can specify any custom output to return variables from other nodes or JavaScript expressions. \n\nLearn more about the Output node: [Docs](https://docs.buildship.com/core-nodes/return)"
    },
    {
        "description": "The Output Node returns values from the flow and handles HTTP response codes.  \nThe default configuration is to return the previous node output. But you can specify any custom output to return variables from other nodes or JavaScript expressions. \n\nLearn more about the Output node: [Docs](https://docs.buildship.com/core-nodes/return)",
        "properties": {},
        "type": "output",
        "id": "5562f10f-183d-4910-8874-b81fef0e766d",
        "required": [],
        "label": "Output"
    },
    {
        "properties": {},
        "required": [],
        "id": "7850a5e2-ff83-4859-afb4-8eff0592865e",
        "label": "Output",
        "type": "output",
        "description": "The Output Node returns values from the flow and handles HTTP response codes.  \nThe default configuration is to return the previous node output. But you can specify any custom output to return variables from other nodes or JavaScript expressions. \n\nLearn more about the Output node: [Docs](https://docs.buildship.com/core-nodes/return)"
    },
    {
        "type": "output",
        "properties": {},
        "description": "The Output Node returns values from the flow and handles HTTP response codes.  \nThe default configuration is to return the previous node output. But you can specify any custom output to return variables from other nodes or JavaScript expressions. \n\nLearn more about the Output node: [Docs](https://docs.buildship.com/core-nodes/return)",
        "required": [],
        "id": "b4f202cc-b063-4662-ad7f-dfc93be8ea20",
        "label": "Output"
    },
    {
        "plan": {
            "inputs": [
                {
                    "id": "validation_error",
                    "type": "string",
                    "description": "From validate-inputs",
                    "name": "Validation Error"
                }
            ],
            "output": [
                {
                    "type": "object",
                    "description": "{success:false, error:...}",
                    "id": "result",
                    "name": "Result"
                }
            ],
            "description": "Returns input validation error.",
            "name": "Output Validation Error"
        },
        "id": "5d41f515-d132-40a2-941c-b6f4ced76cde",
        "script": "export default async function validationError({\n    validation_error\n}: NodeInputs, {\n    logging\n}: NodeScriptOptions) {\n    // Log the validation error\n    logging.log(`Validation error: ${validation_error}`);\n\n    // Return an object with success:false and the error message\n    return {\n        success: false,\n        error: validation_error\n    };\n}",
        "type": "script",
        "description": "Returns input validation error.",
        "label": "Output Validation Error",
        "meta": {
            "id": "a7605ba1-4f4a-4f9d-8c9c-713d08172e0c",
            "name": "Output Validation Error",
            "icon": {
                "url": null,
                "type": "URL"
            },
            "description": "Returns input validation error."
        },
        "output": {
            "description": "This object represents the output of a validation error node, providing the success status and the error message.",
            "buildship": {
                "index": "0"
            },
            "type": "object",
            "properties": {
                "error": {
                    "type": "string",
                    "buildship": {
                        "index": "1"
                    },
                    "title": "Error",
                    "description": "The error message describing the validation error encountered."
                },
                "success": {
                    "type": "boolean",
                    "description": "Indicates whether the operation was successful. For validation errors, this will be false.",
                    "buildship": {
                        "index": "0"
                    },
                    "title": "Success"
                }
            },
            "title": "Validation Error Output"
        },
        "inputs": {
            "properties": {
                "validation_error": {
                    "buildship": {
                        "index": "0",
                        "userPromptHint": "Enter the validation error message to return."
                    },
                    "description": "The validation error message to return.",
                    "title": "Validation Error",
                    "type": "string"
                }
            },
            "type": "object",
            "required": [
                "validation_error"
            ]
        }
    }
];
