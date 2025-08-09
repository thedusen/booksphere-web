export const nodes = [
  {
    "integrations": [],
    "inputs": {
      "type": "object",
      "required": [
        "url",
        "shouldAwait",
        "method"
      ],
      "properties": {
        "authorization": {
          "buildship": {
            "index": "2",
            "sensitive": false
          },
          "pattern": "",
          "description": "The authorization header for the API call, if required (e.g., Bearer or Basic token)",
          "title": "Authorization",
          "type": "string"
        },
        "method": {
          "default": "",
          "buildship": {
            "options": [
              {
                "label": "GET",
                "value": "GET"
              },
              {
                "label": "POST",
                "value": "POST"
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
            "index": "0",
            "sensitive": false
          },
          "pattern": "",
          "description": "The HTTP method to use for the API call",
          "title": "HTTP Method",
          "type": "string",
          "enum": [
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "PATCH"
          ]
        },
        "queryParams": {
          "default": {},
          "buildship": {
            "index": "3",
            "sensitive": false
          },
          "pattern": "",
          "description": "The query parameters for the API call.\n\nSAMPLE INPUT:\n```\n{ \n  \"query1\": \"value1\",\n  \"query2\": \"value2\"\n}\n```",
          "title": "Query Parameters",
          "type": "object",
          "properties": {}
        },
        "shouldAwait": {
          "buildship": {
            "index": "6",
            "sensitive": false
          },
          "pattern": "",
          "description": "Whether to wait for the request to complete or not",
          "title": "Await?",
          "type": "boolean"
        },
        "body": {
          "buildship": {
            "index": "4"
          },
          "description": "The body to send with the API call",
          "title": "Body",
          "type": "object"
        },
        "contentType": {
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
                "label": "text/plain",
                "value": "text/plain"
              }
            ],
            "index": "5"
          },
          "description": "The content type of the API call",
          "title": "Content Type",
          "type": "string",
          "enum": [
            "application/json",
            "application/x-www-form-urlencoded",
            "multipart/form-data",
            "text/plain"
          ]
        },
        "url": {
          "buildship": {
            "index": "1"
          },
          "description": "The URL of the API endpoint",
          "title": "URL",
          "type": "string"
        }
      }
    },
    "type": "script",
    "script": "import fetch from \"node-fetch\";\nexport default async function apiCall({\n    url,\n    method,\n    contentType,\n    authorization,\n    body,\n    shouldAwait,\n    queryParams\n}: NodeInputs, {\n    logging\n}: NodeScriptOptions) : NodeOutput  {\n    const headers = {\n        \"Content-Type\": contentType\n    };\n    if (authorization) headers[\"Authorization\"] = authorization;\n\n    let queryParamsString = '';\n    if (queryParams) {\n        queryParamsString = '?' + new URLSearchParams(queryParams).toString();\n    }\n\n    const fetchOptions = {\n        method,\n        headers\n    };\n\n    if (method !== 'GET') {\n        fetchOptions.body = JSON.stringify(body);\n    }\n\n    const fetchPromise = fetch(url + queryParamsString, fetchOptions);\n\n    if (!shouldAwait) {\n        return {\n            data: null\n        };\n    }\n\n    const response = await fetchPromise;\n    const data = await response.json();\n    return {\n        status: response.status,\n        data\n    };\n}",
    "dependencies": {
      "node-fetch": "3.3.2"
    },
    "output": {
      "buildship": {},
      "type": "object",
      "properties": {
        "data": {
          "buildship": {
            "index": "1"
          },
          "description": "The data object from the API response",
          "title": "Data",
          "type": "object"
        },
        "status": {
          "buildship": {
            "index": "0"
          },
          "description": "The HTTP status of the API response",
          "title": "Status",
          "type": "number"
        }
      }
    },
    "generateDocs": {
      "ranBy": "bhavya@rowy.io.rowy",
      "completedAt": {
        "_nanoseconds": "711000000",
        "_seconds": "1716413349"
      }
    },
    "groupInfo": null,
    "id": "cda271ac-8903-49a1-a633-40d3665891da",
    "_libRef": {
      "integrity": "v3:dfd2c1a8dc0bc82e8962b5017d3bb0c1",
      "isDirty": false,
      "libNodeRefId": "@buildship/api-call",
      "buildHash": "21b519df8810ddc5d7d290fc68cbb60ce449201673c524b86cc30b4f591135ed",
      "src": "https://storage.googleapis.com/buildship-app-us-central1/publicLib/nodesV2/@buildship/api-call/5.0.0/build.cjs",
      "libType": "public",
      "version": "5.0.0"
    },
    "integrity": "v3:dfd2c1a8dc0bc82e8962b5017d3bb0c1",
    "meta": {
      "icon": {
        "svg": "<path d=\"m14 12l-2 2l-2-2l2-2l2 2zm-2-6l2.12 2.12l2.5-2.5L12 1L7.38 5.62l2.5 2.5L12 6zm-6 6l2.12-2.12l-2.5-2.5L1 12l4.62 4.62l2.5-2.5L6 12zm12 0l-2.12 2.12l2.5 2.5L23 12l-4.62-4.62l-2.5 2.5L18 12zm-6 6l-2.12-2.12l-2.5 2.5L12 23l4.62-4.62l-2.5-2.5L12 18z\"></path>",
        "type": "SVG"
      },
      "name": "API Call Node",
      "description": "Make an API call using fetch with provided url, method, contentType, authorization, and body",
      "id": "api-call"
    },
    "src": "https://storage.googleapis.com/buildship-app-us-central1/publicLib/nodesV2/@buildship/api-call/null/build.cjs",
    "version": "null",
    "label": "Call ISBNdb API"
  },
  {
    "then": [
      {
        "type": "set-variable",
        "id": "196eeef1-b03c-4e92-93a8-94c416bb8dd7",
        "label": "Set Variable",
        "description": "Local variables allow you to store and modify values throughout a workflow. Unlike request variables, local variables are defined within the workflow and can be modified at different steps. \n\nHow to use:  \n1. In the name selector, click “Add variable” to create a new variable in your workflow.  \n2. Use the “Set Variable” node in different steps of your flow and change the value.  \n3. Reference the variable in nodes, logic or conditions. \n\nLocal variables make workflows more flexible, helping you manage dynamic data more efficiently.",
        "inputs": {
          "properties": {
            "value": {
              "buildship": {
                "index": "1"
              },
              "type": "string",
              "title": "Value",
              "description": "The value to set the variable to"
            },
            "name": {
              "title": "Name",
              "enum": [],
              "buildship": {
                "index": "0"
              },
              "type": "string",
              "description": "The name of the variable"
            }
          },
          "type": "object",
          "required": [
            "name",
            "value"
          ]
        }
      },
      {
        "type": "script",
        "inputs": {
          "type": "object",
          "properties": {
            "data": {
              "title": "data",
              "description": "The input object that may contain a book property from ISBNdb.",
              "type": "object",
              "buildship": {
                "userPromptHint": "Provide the data object that may include a book property.",
                "index": "0",
                "basePrompt": "Input object possibly containing a book from ISBNdb."
              }
            }
          },
          "required": [
            "data"
          ]
        },
        "plan": {
          "name": "Set externalData from ISBNdb",
          "output": [
            {
              "name": "externalData",
              "id": "externalData",
              "description": "Book data from ISBNdb.",
              "type": "object"
            }
          ],
          "description": "Set externalData field if ISBNdb returned a book object.",
          "inputs": [
            {
              "name": "Data",
              "id": "data",
              "_ai_instruction": "Pass data.book as externalData if present.",
              "type": "object",
              "description": "Data object from ISBNdb."
            }
          ]
        },
        "id": "c2b83f5e-c657-4d9d-9958-e0f16f7e7bfd",
        "description": "Set externalData field if ISBNdb returned a book object.",
        "output": {
          "buildship": {
            "index": "0"
          },
          "title": "Book Data",
          "description": "The output object containing detailed information about a book extracted from ISBNdb.",
          "type": "object",
          "properties": {
            "publisher": {
              "type": "string",
              "description": "The publisher of the book.",
              "buildship": {
                "index": "3"
              },
              "title": "Publisher"
            },
            "language": {
              "description": "The language in which the book is written.",
              "buildship": {
                "index": "6"
              },
              "title": "Language",
              "type": "string"
            },
            "publish_date": {
              "buildship": {
                "index": "4"
              },
              "title": "Publish Date",
              "type": "string",
              "description": "The date when the book was published.",
              "format": "date"
            },
            "author": {
              "description": "The author of the book.",
              "title": "Author",
              "type": "string",
              "buildship": {
                "index": "1"
              }
            },
            "pages": {
              "description": "The number of pages in the book.",
              "title": "Pages",
              "type": "number",
              "buildship": {
                "index": "5"
              }
            },
            "title": {
              "buildship": {
                "index": "0"
              },
              "title": "Title",
              "description": "The title of the book.",
              "type": "string"
            },
            "isbn": {
              "format": "utc-millisec",
              "type": "string",
              "buildship": {
                "index": "2"
              },
              "description": "The International Standard Book Number of the book.",
              "title": "ISBN"
            }
          }
        },
        "label": "Set externalData from ISBNdb",
        "meta": {
          "name": "Set externalData from ISBNdb",
          "description": "Set externalData field if ISBNdb returned a book object.",
          "icon": {
            "url": null,
            "type": "URL"
          },
          "id": "set-externaldata-from-isbndb"
        },
        "script": "export default async function setExternalDataFromISBNdb({\n    data\n}: NodeInputs): Promise < NodeOutput > {\n    // Check if data contains a book object\n    if (data && data.book) {\n        // Return the book object as externalData\n        return data.book;\n    }\n\n    // Return null if no book data is present\n    return null;\n}"
      }
    ],
    "description": "Check if ISBNdb API returned a valid book object (status 200 and data.book present).",
    "id": "d7e8b9c8-3ea1-46ee-b1b6-f0092eaabcf7",
    "label": "Check ISBNdb Data",
    "condition": true,
    "else": [
      {
        "description": "Execute a BuildShip workflow from another workflow within your current workspace. [Docs](https://docs.buildship.com/core-nodes/execute-workflow)",
        "label": "Execute BuildShip Workflow",
        "output": {
          "type": "object",
          "buildship": {},
          "properties": {
            "books": {
              "buildship": {
                "index": "1"
              },
              "title": "Books",
              "type": "string"
            },
            "authors": {
              "type": "array",
              "buildship": {
                "index": "2"
              },
              "title": "Authors"
            },
            "success": {
              "buildship": {
                "index": "3"
              },
              "title": "Success",
              "type": "boolean"
            },
            "works": {
              "buildship": {
                "index": "2"
              },
              "title": "Works",
              "properties": {},
              "type": "string"
            }
          }
        },
        "workflowId": "7CptA6MNkDG2MM2CAxfe",
        "id": "af26fb51-eb3b-4b3a-a23d-fda1cfd22e63",
        "type": "call-workflow",
        "inputs": {
          "properties": {
            "isbn": {
              "type": "string",
              "buildship": {
                "index": "0",
                "isFile": false
              },
              "description": "The ISBN to fetch (required)",
              "title": "ISBN"
            }
          },
          "required": [],
          "type": "object"
        }
      },
      {
        "then": [
          {
            "type": "set-variable",
            "id": "86b4b5c5-0966-4a1a-ba2d-281e2a28937c",
            "label": "Set Variable",
            "description": "Local variables allow you to store and modify values throughout a workflow. Unlike request variables, local variables are defined within the workflow and can be modified at different steps. \n\nHow to use:  \n1. In the name selector, click “Add variable” to create a new variable in your workflow.  \n2. Use the “Set Variable” node in different steps of your flow and change the value.  \n3. Reference the variable in nodes, logic or conditions. \n\nLocal variables make workflows more flexible, helping you manage dynamic data more efficiently.",
            "inputs": {
              "properties": {
                "value": {
                  "buildship": {
                    "index": "1"
                  },
                  "type": "string",
                  "title": "Value",
                  "description": "The value to set the variable to"
                },
                "name": {
                  "title": "Name",
                  "enum": [],
                  "buildship": {
                    "index": "0"
                  },
                  "type": "string",
                  "description": "The name of the variable"
                }
              },
              "type": "object",
              "required": [
                "name",
                "value"
              ]
            }
          },
          {
            "script": "export default async function setExternalData({\n    data\n}: NodeInputs): NodeOutput {\n    // If data exists and is not empty, return it as externalData\n    if (data && Object.keys(data).length > 0) {\n        return {\n            externalData: data\n        };\n    }\n\n    // If no data was provided or it's empty, return null\n    return {\n        externalData: null\n    };\n}",
            "id": "692915b0-ff55-4f6c-bc36-1fa22de5ebf0",
            "output": {
              "properties": {
                "externalData": {
                  "title": "External Data",
                  "description": "An object containing detailed information about a book retrieved from OpenLibrary.",
                  "type": "object",
                  "properties": {
                    "isbn_13": {
                      "description": "A list of ISBN-13 identifiers for the book.",
                      "title": "ISBN-13",
                      "type": "array",
                      "items": {
                        "format": "utc-millisec",
                        "type": "string",
                        "description": "An ISBN-13 identifier."
                      }
                    },
                    "number_of_pages": {
                      "type": "number",
                      "title": "Number of Pages",
                      "description": "The total number of pages in the book."
                    },
                    "key": {
                      "title": "Key",
                      "description": "A unique identifier for the book in the OpenLibrary system.",
                      "type": "string"
                    },
                    "publish_date": {
                      "type": "string",
                      "format": "utc-millisec",
                      "description": "The date when the book was published.",
                      "title": "Publish Date"
                    },
                    "publishers": {
                      "type": "array",
                      "items": {
                        "type": "string",
                        "description": "The name of a publisher."
                      },
                      "title": "Publishers",
                      "description": "A list of publishers who published the book."
                    },
                    "subjects": {
                      "type": "array",
                      "items": {
                        "type": "string",
                        "description": "A subject or category."
                      },
                      "title": "Subjects",
                      "description": "A list of subjects or categories associated with the book."
                    },
                    "isbn_10": {
                      "items": {
                        "type": "string",
                        "description": "An ISBN-10 identifier.",
                        "format": "utc-millisec"
                      },
                      "title": "ISBN-10",
                      "description": "A list of ISBN-10 identifiers for the book.",
                      "type": "array"
                    },
                    "cover": {
                      "title": "Cover",
                      "description": "Information about the book's cover images.",
                      "type": "object",
                      "properties": {
                        "small": {
                          "description": "A URI to a small version of the book cover.",
                          "title": "Small Cover",
                          "type": "string",
                          "format": "uri"
                        },
                        "large": {
                          "format": "uri",
                          "description": "A URI to a large version of the book cover.",
                          "title": "Large Cover",
                          "type": "string"
                        },
                        "medium": {
                          "title": "Medium Cover",
                          "type": "string",
                          "description": "A URI to a medium version of the book cover.",
                          "format": "uri"
                        }
                      }
                    },
                    "title": {
                      "title": "Title",
                      "type": "string",
                      "description": "The title of the book."
                    },
                    "authors": {
                      "description": "A list of authors who wrote the book.",
                      "title": "Authors",
                      "type": "array",
                      "items": {
                        "properties": {
                          "key": {
                            "type": "string",
                            "description": "A unique identifier for the author."
                          },
                          "name": {
                            "type": "string",
                            "description": "The name of the author."
                          }
                        },
                        "type": "object"
                      }
                    }
                  },
                  "buildship": {
                    "index": "0"
                  }
                }
              },
              "type": "object",
              "description": "This schema defines the structure of the output object returned by the node, which processes data from OpenLibrary.",
              "title": "Output Schema"
            },
            "label": "Set externalData from OpenLibrary",
            "inputs": {
              "type": "object",
              "required": [
                "data"
              ],
              "properties": {
                "data": {
                  "title": "data",
                  "description": "The data object returned from OpenLibrary.",
                  "type": "object",
                  "buildship": {
                    "readOnly": false,
                    "userPromptHint": "Provide the data object returned from OpenLibrary.",
                    "index": "0"
                  }
                }
              }
            },
            "meta": {
              "icon": {
                "url": null,
                "type": "URL"
              },
              "description": "Set externalData field if OpenLibrary returned data.",
              "id": "set-externaldata-from-openlibrary",
              "name": "Set externalData from OpenLibrary"
            },
            "plan": {
              "name": "Set externalData from OpenLibrary",
              "inputs": [
                {
                  "id": "data",
                  "_ai_instruction": "Pass data as externalData.",
                  "name": "Data",
                  "description": "Data object from OpenLibrary.",
                  "type": "object"
                }
              ],
              "description": "Set externalData field if OpenLibrary returned data.",
              "output": [
                {
                  "id": "externalData",
                  "name": "externalData",
                  "type": "object",
                  "description": "Book data from OpenLibrary."
                }
              ]
            },
            "description": "Set externalData field if OpenLibrary returned data.",
            "type": "script"
          }
        ],
        "condition": true,
        "label": "Check OpenLibrary Data",
        "id": "b53207f4-997b-4378-be09-4bece1073743",
        "type": "branch",
        "description": "Check if OpenLibrary returned valid book data (status 200 and has title).",
        "else": [
          {
            "type": "set-variable",
            "id": "539b9c5e-886a-42d1-9538-4531461eb39b",
            "label": "Set Variable",
            "description": "Local variables allow you to store and modify values throughout a workflow. Unlike request variables, local variables are defined within the workflow and can be modified at different steps. \n\nHow to use:  \n1. In the name selector, click “Add variable” to create a new variable in your workflow.  \n2. Use the “Set Variable” node in different steps of your flow and change the value.  \n3. Reference the variable in nodes, logic or conditions. \n\nLocal variables make workflows more flexible, helping you manage dynamic data more efficiently.",
            "inputs": {
              "properties": {
                "value": {
                  "buildship": {
                    "index": "1"
                  },
                  "type": "string",
                  "title": "Value",
                  "description": "The value to set the variable to"
                },
                "name": {
                  "title": "Name",
                  "enum": [],
                  "buildship": {
                    "index": "0"
                  },
                  "type": "string",
                  "description": "The name of the variable"
                }
              },
              "type": "object",
              "required": [
                "name",
                "value"
              ]
            }
          },
          {
            "meta": {
              "id": "not-found-output",
              "description": "Return not_found result if both APIs failed.",
              "icon": {
                "url": null,
                "type": "URL"
              },
              "name": "Not Found Output"
            },
            "script": "export default async function notFoundResult({\n    isbn\n}: NodeInputs, {\n    logging\n}: NodeScriptOptions) {\n    // Create a standardized \"not found\" response object\n    const notFoundResponse = {\n        status: \"not_found\",\n        message: `No results found for ISBN: ${isbn}`,\n        isbn: isbn,\n        timestamp: new Date().toISOString()\n    };\n\n    logging.log(`Returning not found result for ISBN: ${isbn}`);\n\n    return notFoundResponse;\n}",
            "description": "Return not_found result if both APIs failed.",
            "type": "script",
            "label": "Not Found Output",
            "plan": {
              "inputs": [
                {
                  "_ai_instruction": "Use input ISBN.",
                  "name": "ISBN",
                  "type": "string",
                  "id": "isbn",
                  "description": "The supplied ISBN."
                }
              ],
              "description": "Return not_found result if both APIs failed.",
              "output": [
                {
                  "description": "Output result for not found.",
                  "id": "jsonResult",
                  "type": "object",
                  "name": "jsonResult"
                }
              ],
              "name": "Not Found Output"
            },
            "output": {
              "type": "object",
              "title": "Not Found Response",
              "buildship": {
                "index": "0"
              },
              "properties": {
                "isbn": {
                  "buildship": {
                    "index": "2"
                  },
                  "title": "ISBN",
                  "type": "string",
                  "description": "The ISBN that was searched for and resulted in no found results."
                },
                "status": {
                  "type": "string",
                  "buildship": {
                    "index": "0"
                  },
                  "description": "The status of the search result, indicating that the item was not found.",
                  "title": "Status"
                },
                "message": {
                  "type": "string",
                  "format": "style",
                  "description": "A message explaining that no results were found for the specified ISBN.",
                  "title": "Message",
                  "buildship": {
                    "index": "1"
                  }
                },
                "timestamp": {
                  "type": "string",
                  "description": "The timestamp indicating when the not found response was generated.",
                  "format": "date-time",
                  "buildship": {
                    "index": "3"
                  },
                  "title": "Timestamp"
                }
              },
              "description": "A standardized response object indicating that no results were found for the given ISBN."
            },
            "inputs": {
              "type": "object",
              "required": [
                "isbn"
              ],
              "properties": {
                "isbn": {
                  "description": "The ISBN to search for.",
                  "buildship": {
                    "readOnly": false,
                    "basePrompt": "ISBN to search for.",
                    "index": "0",
                    "userPromptHint": "Enter the ISBN to search."
                  },
                  "title": "ISBN",
                  "type": "string"
                }
              }
            },
            "id": "8c6fa043-cccd-47c4-8a01-9ec15da7dcae"
          }
        ]
      }
    ],
    "type": "branch"
  },
  {
    "type": "set-variable",
    "id": "196eeef1-b03c-4e92-93a8-94c416bb8dd7",
    "label": "Set Variable",
    "description": "Local variables allow you to store and modify values throughout a workflow. Unlike request variables, local variables are defined within the workflow and can be modified at different steps. \n\nHow to use:  \n1. In the name selector, click “Add variable” to create a new variable in your workflow.  \n2. Use the “Set Variable” node in different steps of your flow and change the value.  \n3. Reference the variable in nodes, logic or conditions. \n\nLocal variables make workflows more flexible, helping you manage dynamic data more efficiently.",
    "inputs": {
      "properties": {
        "value": {
          "buildship": {
            "index": "1"
          },
          "type": "string",
          "title": "Value",
          "description": "The value to set the variable to"
        },
        "name": {
          "title": "Name",
          "enum": [],
          "buildship": {
            "index": "0"
          },
          "type": "string",
          "description": "The name of the variable"
        }
      },
      "type": "object",
      "required": [
        "name",
        "value"
      ]
    }
  },
  {
    "type": "script",
    "inputs": {
      "type": "object",
      "properties": {
        "data": {
          "title": "data",
          "description": "The input object that may contain a book property from ISBNdb.",
          "type": "object",
          "buildship": {
            "userPromptHint": "Provide the data object that may include a book property.",
            "index": "0",
            "basePrompt": "Input object possibly containing a book from ISBNdb."
          }
        }
      },
      "required": [
        "data"
      ]
    },
    "plan": {
      "name": "Set externalData from ISBNdb",
      "output": [
        {
          "name": "externalData",
          "id": "externalData",
          "description": "Book data from ISBNdb.",
          "type": "object"
        }
      ],
      "description": "Set externalData field if ISBNdb returned a book object.",
      "inputs": [
        {
          "name": "Data",
          "id": "data",
          "_ai_instruction": "Pass data.book as externalData if present.",
          "type": "object",
          "description": "Data object from ISBNdb."
        }
      ]
    },
    "id": "c2b83f5e-c657-4d9d-9958-e0f16f7e7bfd",
    "description": "Set externalData field if ISBNdb returned a book object.",
    "output": {
      "buildship": {
        "index": "0"
      },
      "title": "Book Data",
      "description": "The output object containing detailed information about a book extracted from ISBNdb.",
      "type": "object",
      "properties": {
        "publisher": {
          "type": "string",
          "description": "The publisher of the book.",
          "buildship": {
            "index": "3"
          },
          "title": "Publisher"
        },
        "language": {
          "description": "The language in which the book is written.",
          "buildship": {
            "index": "6"
          },
          "title": "Language",
          "type": "string"
        },
        "publish_date": {
          "buildship": {
            "index": "4"
          },
          "title": "Publish Date",
          "type": "string",
          "description": "The date when the book was published.",
          "format": "date"
        },
        "author": {
          "description": "The author of the book.",
          "title": "Author",
          "type": "string",
          "buildship": {
            "index": "1"
          }
        },
        "pages": {
          "description": "The number of pages in the book.",
          "title": "Pages",
          "type": "number",
          "buildship": {
            "index": "5"
          }
        },
        "title": {
          "buildship": {
            "index": "0"
          },
          "title": "Title",
          "description": "The title of the book.",
          "type": "string"
        },
        "isbn": {
          "format": "utc-millisec",
          "type": "string",
          "buildship": {
            "index": "2"
          },
          "description": "The International Standard Book Number of the book.",
          "title": "ISBN"
        }
      }
    },
    "label": "Set externalData from ISBNdb",
    "meta": {
      "name": "Set externalData from ISBNdb",
      "description": "Set externalData field if ISBNdb returned a book object.",
      "icon": {
        "url": null,
        "type": "URL"
      },
      "id": "set-externaldata-from-isbndb"
    },
    "script": "export default async function setExternalDataFromISBNdb({\n    data\n}: NodeInputs): Promise < NodeOutput > {\n    // Check if data contains a book object\n    if (data && data.book) {\n        // Return the book object as externalData\n        return data.book;\n    }\n\n    // Return null if no book data is present\n    return null;\n}"
  },
  {
    "description": "Execute a BuildShip workflow from another workflow within your current workspace. [Docs](https://docs.buildship.com/core-nodes/execute-workflow)",
    "label": "Execute BuildShip Workflow",
    "output": {
      "type": "object",
      "buildship": {},
      "properties": {
        "books": {
          "buildship": {
            "index": "1"
          },
          "title": "Books",
          "type": "string"
        },
        "authors": {
          "type": "array",
          "buildship": {
            "index": "2"
          },
          "title": "Authors"
        },
        "success": {
          "buildship": {
            "index": "3"
          },
          "title": "Success",
          "type": "boolean"
        },
        "works": {
          "buildship": {
            "index": "2"
          },
          "title": "Works",
          "properties": {},
          "type": "string"
        }
      }
    },
    "workflowId": "7CptA6MNkDG2MM2CAxfe",
    "id": "af26fb51-eb3b-4b3a-a23d-fda1cfd22e63",
    "type": "call-workflow",
    "inputs": {
      "properties": {
        "isbn": {
          "type": "string",
          "buildship": {
            "index": "0",
            "isFile": false
          },
          "description": "The ISBN to fetch (required)",
          "title": "ISBN"
        }
      },
      "required": [],
      "type": "object"
    }
  },
  {
    "then": [
      {
        "type": "set-variable",
        "id": "86b4b5c5-0966-4a1a-ba2d-281e2a28937c",
        "label": "Set Variable",
        "description": "Local variables allow you to store and modify values throughout a workflow. Unlike request variables, local variables are defined within the workflow and can be modified at different steps. \n\nHow to use:  \n1. In the name selector, click “Add variable” to create a new variable in your workflow.  \n2. Use the “Set Variable” node in different steps of your flow and change the value.  \n3. Reference the variable in nodes, logic or conditions. \n\nLocal variables make workflows more flexible, helping you manage dynamic data more efficiently.",
        "inputs": {
          "properties": {
            "value": {
              "buildship": {
                "index": "1"
              },
              "type": "string",
              "title": "Value",
              "description": "The value to set the variable to"
            },
            "name": {
              "title": "Name",
              "enum": [],
              "buildship": {
                "index": "0"
              },
              "type": "string",
              "description": "The name of the variable"
            }
          },
          "type": "object",
          "required": [
            "name",
            "value"
          ]
        }
      },
      {
        "script": "export default async function setExternalData({\n    data\n}: NodeInputs): NodeOutput {\n    // If data exists and is not empty, return it as externalData\n    if (data && Object.keys(data).length > 0) {\n        return {\n            externalData: data\n        };\n    }\n\n    // If no data was provided or it's empty, return null\n    return {\n        externalData: null\n    };\n}",
        "id": "692915b0-ff55-4f6c-bc36-1fa22de5ebf0",
        "output": {
          "properties": {
            "externalData": {
              "title": "External Data",
              "description": "An object containing detailed information about a book retrieved from OpenLibrary.",
              "type": "object",
              "properties": {
                "isbn_13": {
                  "description": "A list of ISBN-13 identifiers for the book.",
                  "title": "ISBN-13",
                  "type": "array",
                  "items": {
                    "format": "utc-millisec",
                    "type": "string",
                    "description": "An ISBN-13 identifier."
                  }
                },
                "number_of_pages": {
                  "type": "number",
                  "title": "Number of Pages",
                  "description": "The total number of pages in the book."
                },
                "key": {
                  "title": "Key",
                  "description": "A unique identifier for the book in the OpenLibrary system.",
                  "type": "string"
                },
                "publish_date": {
                  "type": "string",
                  "format": "utc-millisec",
                  "description": "The date when the book was published.",
                  "title": "Publish Date"
                },
                "publishers": {
                  "type": "array",
                  "items": {
                    "type": "string",
                    "description": "The name of a publisher."
                  },
                  "title": "Publishers",
                  "description": "A list of publishers who published the book."
                },
                "subjects": {
                  "type": "array",
                  "items": {
                    "type": "string",
                    "description": "A subject or category."
                  },
                  "title": "Subjects",
                  "description": "A list of subjects or categories associated with the book."
                },
                "isbn_10": {
                  "items": {
                    "type": "string",
                    "description": "An ISBN-10 identifier.",
                    "format": "utc-millisec"
                  },
                  "title": "ISBN-10",
                  "description": "A list of ISBN-10 identifiers for the book.",
                  "type": "array"
                },
                "cover": {
                  "title": "Cover",
                  "description": "Information about the book's cover images.",
                  "type": "object",
                  "properties": {
                    "small": {
                      "description": "A URI to a small version of the book cover.",
                      "title": "Small Cover",
                      "type": "string",
                      "format": "uri"
                    },
                    "large": {
                      "format": "uri",
                      "description": "A URI to a large version of the book cover.",
                      "title": "Large Cover",
                      "type": "string"
                    },
                    "medium": {
                      "title": "Medium Cover",
                      "type": "string",
                      "description": "A URI to a medium version of the book cover.",
                      "format": "uri"
                    }
                  }
                },
                "title": {
                  "title": "Title",
                  "type": "string",
                  "description": "The title of the book."
                },
                "authors": {
                  "description": "A list of authors who wrote the book.",
                  "title": "Authors",
                  "type": "array",
                  "items": {
                    "properties": {
                      "key": {
                        "type": "string",
                        "description": "A unique identifier for the author."
                      },
                      "name": {
                        "type": "string",
                        "description": "The name of the author."
                      }
                    },
                    "type": "object"
                  }
                }
              },
              "buildship": {
                "index": "0"
              }
            }
          },
          "type": "object",
          "description": "This schema defines the structure of the output object returned by the node, which processes data from OpenLibrary.",
          "title": "Output Schema"
        },
        "label": "Set externalData from OpenLibrary",
        "inputs": {
          "type": "object",
          "required": [
            "data"
          ],
          "properties": {
            "data": {
              "title": "data",
              "description": "The data object returned from OpenLibrary.",
              "type": "object",
              "buildship": {
                "readOnly": false,
                "userPromptHint": "Provide the data object returned from OpenLibrary.",
                "index": "0"
              }
            }
          }
        },
        "meta": {
          "icon": {
            "url": null,
            "type": "URL"
          },
          "description": "Set externalData field if OpenLibrary returned data.",
          "id": "set-externaldata-from-openlibrary",
          "name": "Set externalData from OpenLibrary"
        },
        "plan": {
          "name": "Set externalData from OpenLibrary",
          "inputs": [
            {
              "id": "data",
              "_ai_instruction": "Pass data as externalData.",
              "name": "Data",
              "description": "Data object from OpenLibrary.",
              "type": "object"
            }
          ],
          "description": "Set externalData field if OpenLibrary returned data.",
          "output": [
            {
              "id": "externalData",
              "name": "externalData",
              "type": "object",
              "description": "Book data from OpenLibrary."
            }
          ]
        },
        "description": "Set externalData field if OpenLibrary returned data.",
        "type": "script"
      }
    ],
    "condition": true,
    "label": "Check OpenLibrary Data",
    "id": "b53207f4-997b-4378-be09-4bece1073743",
    "type": "branch",
    "description": "Check if OpenLibrary returned valid book data (status 200 and has title).",
    "else": [
      {
        "type": "set-variable",
        "id": "539b9c5e-886a-42d1-9538-4531461eb39b",
        "label": "Set Variable",
        "description": "Local variables allow you to store and modify values throughout a workflow. Unlike request variables, local variables are defined within the workflow and can be modified at different steps. \n\nHow to use:  \n1. In the name selector, click “Add variable” to create a new variable in your workflow.  \n2. Use the “Set Variable” node in different steps of your flow and change the value.  \n3. Reference the variable in nodes, logic or conditions. \n\nLocal variables make workflows more flexible, helping you manage dynamic data more efficiently.",
        "inputs": {
          "properties": {
            "value": {
              "buildship": {
                "index": "1"
              },
              "type": "string",
              "title": "Value",
              "description": "The value to set the variable to"
            },
            "name": {
              "title": "Name",
              "enum": [],
              "buildship": {
                "index": "0"
              },
              "type": "string",
              "description": "The name of the variable"
            }
          },
          "type": "object",
          "required": [
            "name",
            "value"
          ]
        }
      },
      {
        "meta": {
          "id": "not-found-output",
          "description": "Return not_found result if both APIs failed.",
          "icon": {
            "url": null,
            "type": "URL"
          },
          "name": "Not Found Output"
        },
        "script": "export default async function notFoundResult({\n    isbn\n}: NodeInputs, {\n    logging\n}: NodeScriptOptions) {\n    // Create a standardized \"not found\" response object\n    const notFoundResponse = {\n        status: \"not_found\",\n        message: `No results found for ISBN: ${isbn}`,\n        isbn: isbn,\n        timestamp: new Date().toISOString()\n    };\n\n    logging.log(`Returning not found result for ISBN: ${isbn}`);\n\n    return notFoundResponse;\n}",
        "description": "Return not_found result if both APIs failed.",
        "type": "script",
        "label": "Not Found Output",
        "plan": {
          "inputs": [
            {
              "_ai_instruction": "Use input ISBN.",
              "name": "ISBN",
              "type": "string",
              "id": "isbn",
              "description": "The supplied ISBN."
            }
          ],
          "description": "Return not_found result if both APIs failed.",
          "output": [
            {
              "description": "Output result for not found.",
              "id": "jsonResult",
              "type": "object",
              "name": "jsonResult"
            }
          ],
          "name": "Not Found Output"
        },
        "output": {
          "type": "object",
          "title": "Not Found Response",
          "buildship": {
            "index": "0"
          },
          "properties": {
            "isbn": {
              "buildship": {
                "index": "2"
              },
              "title": "ISBN",
              "type": "string",
              "description": "The ISBN that was searched for and resulted in no found results."
            },
            "status": {
              "type": "string",
              "buildship": {
                "index": "0"
              },
              "description": "The status of the search result, indicating that the item was not found.",
              "title": "Status"
            },
            "message": {
              "type": "string",
              "format": "style",
              "description": "A message explaining that no results were found for the specified ISBN.",
              "title": "Message",
              "buildship": {
                "index": "1"
              }
            },
            "timestamp": {
              "type": "string",
              "description": "The timestamp indicating when the not found response was generated.",
              "format": "date-time",
              "buildship": {
                "index": "3"
              },
              "title": "Timestamp"
            }
          },
          "description": "A standardized response object indicating that no results were found for the given ISBN."
        },
        "inputs": {
          "type": "object",
          "required": [
            "isbn"
          ],
          "properties": {
            "isbn": {
              "description": "The ISBN to search for.",
              "buildship": {
                "readOnly": false,
                "basePrompt": "ISBN to search for.",
                "index": "0",
                "userPromptHint": "Enter the ISBN to search."
              },
              "title": "ISBN",
              "type": "string"
            }
          }
        },
        "id": "8c6fa043-cccd-47c4-8a01-9ec15da7dcae"
      }
    ]
  },
  {
    "type": "set-variable",
    "id": "86b4b5c5-0966-4a1a-ba2d-281e2a28937c",
    "label": "Set Variable",
    "description": "Local variables allow you to store and modify values throughout a workflow. Unlike request variables, local variables are defined within the workflow and can be modified at different steps. \n\nHow to use:  \n1. In the name selector, click “Add variable” to create a new variable in your workflow.  \n2. Use the “Set Variable” node in different steps of your flow and change the value.  \n3. Reference the variable in nodes, logic or conditions. \n\nLocal variables make workflows more flexible, helping you manage dynamic data more efficiently.",
    "inputs": {
      "properties": {
        "value": {
          "buildship": {
            "index": "1"
          },
          "type": "string",
          "title": "Value",
          "description": "The value to set the variable to"
        },
        "name": {
          "title": "Name",
          "enum": [],
          "buildship": {
            "index": "0"
          },
          "type": "string",
          "description": "The name of the variable"
        }
      },
      "type": "object",
      "required": [
        "name",
        "value"
      ]
    }
  },
  {
    "script": "export default async function setExternalData({\n    data\n}: NodeInputs): NodeOutput {\n    // If data exists and is not empty, return it as externalData\n    if (data && Object.keys(data).length > 0) {\n        return {\n            externalData: data\n        };\n    }\n\n    // If no data was provided or it's empty, return null\n    return {\n        externalData: null\n    };\n}",
    "id": "692915b0-ff55-4f6c-bc36-1fa22de5ebf0",
    "output": {
      "properties": {
        "externalData": {
          "title": "External Data",
          "description": "An object containing detailed information about a book retrieved from OpenLibrary.",
          "type": "object",
          "properties": {
            "isbn_13": {
              "description": "A list of ISBN-13 identifiers for the book.",
              "title": "ISBN-13",
              "type": "array",
              "items": {
                "format": "utc-millisec",
                "type": "string",
                "description": "An ISBN-13 identifier."
              }
            },
            "number_of_pages": {
              "type": "number",
              "title": "Number of Pages",
              "description": "The total number of pages in the book."
            },
            "key": {
              "title": "Key",
              "description": "A unique identifier for the book in the OpenLibrary system.",
              "type": "string"
            },
            "publish_date": {
              "type": "string",
              "format": "utc-millisec",
              "description": "The date when the book was published.",
              "title": "Publish Date"
            },
            "publishers": {
              "type": "array",
              "items": {
                "type": "string",
                "description": "The name of a publisher."
              },
              "title": "Publishers",
              "description": "A list of publishers who published the book."
            },
            "subjects": {
              "type": "array",
              "items": {
                "type": "string",
                "description": "A subject or category."
              },
              "title": "Subjects",
              "description": "A list of subjects or categories associated with the book."
            },
            "isbn_10": {
              "items": {
                "type": "string",
                "description": "An ISBN-10 identifier.",
                "format": "utc-millisec"
              },
              "title": "ISBN-10",
              "description": "A list of ISBN-10 identifiers for the book.",
              "type": "array"
            },
            "cover": {
              "title": "Cover",
              "description": "Information about the book's cover images.",
              "type": "object",
              "properties": {
                "small": {
                  "description": "A URI to a small version of the book cover.",
                  "title": "Small Cover",
                  "type": "string",
                  "format": "uri"
                },
                "large": {
                  "format": "uri",
                  "description": "A URI to a large version of the book cover.",
                  "title": "Large Cover",
                  "type": "string"
                },
                "medium": {
                  "title": "Medium Cover",
                  "type": "string",
                  "description": "A URI to a medium version of the book cover.",
                  "format": "uri"
                }
              }
            },
            "title": {
              "title": "Title",
              "type": "string",
              "description": "The title of the book."
            },
            "authors": {
              "description": "A list of authors who wrote the book.",
              "title": "Authors",
              "type": "array",
              "items": {
                "properties": {
                  "key": {
                    "type": "string",
                    "description": "A unique identifier for the author."
                  },
                  "name": {
                    "type": "string",
                    "description": "The name of the author."
                  }
                },
                "type": "object"
              }
            }
          },
          "buildship": {
            "index": "0"
          }
        }
      },
      "type": "object",
      "description": "This schema defines the structure of the output object returned by the node, which processes data from OpenLibrary.",
      "title": "Output Schema"
    },
    "label": "Set externalData from OpenLibrary",
    "inputs": {
      "type": "object",
      "required": [
        "data"
      ],
      "properties": {
        "data": {
          "title": "data",
          "description": "The data object returned from OpenLibrary.",
          "type": "object",
          "buildship": {
            "readOnly": false,
            "userPromptHint": "Provide the data object returned from OpenLibrary.",
            "index": "0"
          }
        }
      }
    },
    "meta": {
      "icon": {
        "url": null,
        "type": "URL"
      },
      "description": "Set externalData field if OpenLibrary returned data.",
      "id": "set-externaldata-from-openlibrary",
      "name": "Set externalData from OpenLibrary"
    },
    "plan": {
      "name": "Set externalData from OpenLibrary",
      "inputs": [
        {
          "id": "data",
          "_ai_instruction": "Pass data as externalData.",
          "name": "Data",
          "description": "Data object from OpenLibrary.",
          "type": "object"
        }
      ],
      "description": "Set externalData field if OpenLibrary returned data.",
      "output": [
        {
          "id": "externalData",
          "name": "externalData",
          "type": "object",
          "description": "Book data from OpenLibrary."
        }
      ]
    },
    "description": "Set externalData field if OpenLibrary returned data.",
    "type": "script"
  },
  {
    "type": "set-variable",
    "id": "539b9c5e-886a-42d1-9538-4531461eb39b",
    "label": "Set Variable",
    "description": "Local variables allow you to store and modify values throughout a workflow. Unlike request variables, local variables are defined within the workflow and can be modified at different steps. \n\nHow to use:  \n1. In the name selector, click “Add variable” to create a new variable in your workflow.  \n2. Use the “Set Variable” node in different steps of your flow and change the value.  \n3. Reference the variable in nodes, logic or conditions. \n\nLocal variables make workflows more flexible, helping you manage dynamic data more efficiently.",
    "inputs": {
      "properties": {
        "value": {
          "buildship": {
            "index": "1"
          },
          "type": "string",
          "title": "Value",
          "description": "The value to set the variable to"
        },
        "name": {
          "title": "Name",
          "enum": [],
          "buildship": {
            "index": "0"
          },
          "type": "string",
          "description": "The name of the variable"
        }
      },
      "type": "object",
      "required": [
        "name",
        "value"
      ]
    }
  },
  {
    "meta": {
      "id": "not-found-output",
      "description": "Return not_found result if both APIs failed.",
      "icon": {
        "url": null,
        "type": "URL"
      },
      "name": "Not Found Output"
    },
    "script": "export default async function notFoundResult({\n    isbn\n}: NodeInputs, {\n    logging\n}: NodeScriptOptions) {\n    // Create a standardized \"not found\" response object\n    const notFoundResponse = {\n        status: \"not_found\",\n        message: `No results found for ISBN: ${isbn}`,\n        isbn: isbn,\n        timestamp: new Date().toISOString()\n    };\n\n    logging.log(`Returning not found result for ISBN: ${isbn}`);\n\n    return notFoundResponse;\n}",
    "description": "Return not_found result if both APIs failed.",
    "type": "script",
    "label": "Not Found Output",
    "plan": {
      "inputs": [
        {
          "_ai_instruction": "Use input ISBN.",
          "name": "ISBN",
          "type": "string",
          "id": "isbn",
          "description": "The supplied ISBN."
        }
      ],
      "description": "Return not_found result if both APIs failed.",
      "output": [
        {
          "description": "Output result for not found.",
          "id": "jsonResult",
          "type": "object",
          "name": "jsonResult"
        }
      ],
      "name": "Not Found Output"
    },
    "output": {
      "type": "object",
      "title": "Not Found Response",
      "buildship": {
        "index": "0"
      },
      "properties": {
        "isbn": {
          "buildship": {
            "index": "2"
          },
          "title": "ISBN",
          "type": "string",
          "description": "The ISBN that was searched for and resulted in no found results."
        },
        "status": {
          "type": "string",
          "buildship": {
            "index": "0"
          },
          "description": "The status of the search result, indicating that the item was not found.",
          "title": "Status"
        },
        "message": {
          "type": "string",
          "format": "style",
          "description": "A message explaining that no results were found for the specified ISBN.",
          "title": "Message",
          "buildship": {
            "index": "1"
          }
        },
        "timestamp": {
          "type": "string",
          "description": "The timestamp indicating when the not found response was generated.",
          "format": "date-time",
          "buildship": {
            "index": "3"
          },
          "title": "Timestamp"
        }
      },
      "description": "A standardized response object indicating that no results were found for the given ISBN."
    },
    "inputs": {
      "type": "object",
      "required": [
        "isbn"
      ],
      "properties": {
        "isbn": {
          "description": "The ISBN to search for.",
          "buildship": {
            "readOnly": false,
            "basePrompt": "ISBN to search for.",
            "index": "0",
            "userPromptHint": "Enter the ISBN to search."
          },
          "title": "ISBN",
          "type": "string"
        }
      }
    },
    "id": "8c6fa043-cccd-47c4-8a01-9ec15da7dcae"
  },
  {
    "description": "Normalize the externalData to a unified bookData format per mapping instructions (custom logic).",
    "script": "export default async function normalizeBookData({ externalData, trigger }, { logging }) {\n    if (!externalData) {\n        logging.log(\"Normalization Error: No external data was provided.\");\n        return { bookData: null };\n    }\n\n    const bookData = {};\n\n    // --- Source Detection ---\n    // We'll use a robust method to determine the data source.\n    // ISBNdb data is nested under a 'book' key.\n    // Our OpenLibrary workflow has 'authors', 'works', and 'books' keys.\n\n    if (externalData.book) {\n        // --- Path 1: Normalizing from ISBNdb ---\n        logging.log(\"Normalizing data from ISBNdb source.\");\n        const source = externalData.book;\n\n        bookData.title = source.title;\n        bookData.authors = source.authors || [];\n        bookData.publisher = source.publisher;\n        bookData.published_date = source.date_published;\n        bookData.cover_image_url = source.image; // CORRECTED: Was 'cover'\n        bookData.isbn = source.isbn13 || trigger.body.isbn;\n\n    } else if (externalData.authors && externalData.works && externalData.books) {\n        // --- Path 2: Normalizing from our OpenLibrary Workflow ---\n        logging.log(\"Normalizing data from OpenLibrary workflow source.\");\n        const source = externalData;\n        \n        // The 'books' object has a dynamic key which is the ISBN\n        const bookDetails = source.books[`ISBN:${trigger.body.isbn}`]?.details;\n\n        if (!bookDetails) {\n             logging.log(\"Normalization Error: OpenLibrary data is missing the 'details' object.\");\n             return { bookData: null };\n        }\n\n        bookData.title = bookDetails.title;\n        // The top-level 'authors' array is already what we need\n        bookData.authors = source.authors.map(a => a.name) || [];\n        bookData.publisher = (bookDetails.publishers || [])[0];\n        bookData.published_date = bookDetails.publish_date;\n        const coverId = (bookDetails.covers || [])[0];\n        bookData.cover_image_url = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null;\n        bookData.isbn = trigger.body.isbn;\n\n    } else {\n        logging.log(\"Normalization Error: Could not determine data source format.\");\n        return { bookData: null };\n    }\n\n    logging.log(\"Book data normalized successfully.\", bookData);\n    return { bookData };\n}",
    "output": {
      "type": "object",
      "description": "This object represents the normalized book data extracted from various external sources like ISBNdb and OpenLibrary.",
      "title": "Normalized Book Data",
      "properties": {
        "cover": {
          "type": "null",
          "buildship": {
            "index": "5"
          },
          "description": "The URL of the book's cover image.",
          "title": "Cover Image"
        },
        "title": {
          "type": "string",
          "buildship": {
            "index": "0"
          },
          "title": "Book Title",
          "description": "The title of the book."
        },
        "isbn13": {
          "description": "The ISBN-13 identifier for the book.",
          "type": "null",
          "buildship": {
            "index": "4"
          },
          "title": "ISBN-13"
        },
        "publisher": {
          "type": "null",
          "buildship": {
            "index": "2"
          },
          "description": "The publisher of the book.",
          "title": "Publisher"
        },
        "published_date": {
          "title": "Published Date",
          "description": "The date when the book was published.",
          "format": "date",
          "buildship": {
            "index": "3"
          },
          "type": "string"
        },
        "authors": {
          "items": {
            "description": "An author's name.",
            "type": "string"
          },
          "type": "array",
          "description": "A list of authors of the book.",
          "buildship": {
            "index": "1"
          },
          "title": "Authors"
        }
      },
      "buildship": {
        "index": "0"
      }
    },
    "plan": {
      "inputs": [
        {
          "name": "externalData",
          "id": "externalData",
          "description": "The book data from either ISBNdb or OpenLibrary.",
          "type": "object",
          "_ai_instruction": "If from ISBNdb (fields like title, authors, publisher, date_published, isbn13, cover, etc): map fields directly.\nIf from OpenLibrary: \n- title: map from 'title'\n- authors: map array of author objects (use just .name or .personal_name if available)\n- publisher: map from 'publishers' (use first string or name if array of objects)\n- published_date: map from 'publish_date'\n- isbn13: use normalized input ISBN\n- cover: map from 'covers' array (use 'https://covers.openlibrary.org/b/id/{cover_id}-L.jpg' for first id if array exists)\nIf neither, skip.\n"
        }
      ],
      "name": "Normalize externalData",
      "description": "Normalize the externalData to a unified bookData format per mapping instructions (custom logic).",
      "output": [
        {
          "description": "Normalized book data.",
          "type": "object",
          "name": "bookData",
          "id": "bookData"
        }
      ]
    },
    "type": "script",
    "inputs": {
      "type": "object",
      "required": [
        "externalData"
      ],
      "properties": {
        "externalData": {
          "description": "The external book data object to be normalized. Supports formats from sources like ISBNdb and OpenLibrary.",
          "title": "externalData",
          "type": "object",
          "buildship": {
            "basePrompt": "Provide the external book data to normalize.",
            "index": "0",
            "readOnly": false,
            "userPromptHint": "Paste the external book data object here."
          }
        }
      }
    },
    "id": "58b98d6b-c080-4826-8041-e838a47d7098",
    "meta": {
      "name": "Normalize externalData",
      "id": "normalize-externaldata",
      "description": "Normalize the externalData to a unified bookData format per mapping instructions (custom logic).",
      "icon": {
        "url": null,
        "type": "URL"
      }
    },
    "label": "Normalize externalData"
  },
  {
    "integrations": [],
    "type": "script",
    "dependencies": {
      "@supabase/supabase-js": "2.39.0"
    },
    "output": {
      "buildship": {},
      "description": "The response from the Postgres function",
      "title": "Response",
      "type": "object"
    },
    "meta": {
      "name": "Postgres RPC",
      "icon": {
        "type": "URL",
        "url": "https://firebasestorage.googleapis.com/v0/b/website-a1s39m.appspot.com/o/buildship-app-logos%2Fsupabase.png?alt=media&token=db017867-8867-4e74-8e94-c7074c82b836"
      },
      "description": "Initializes a Supabase client and calls a Postgres function as Remote Procedure Call.",
      "id": "supabase-postgres-rpc"
    },
    "groupInfo": "0IAjU2tekQHjibkvicpS",
    "id": "9d12b061-9424-4870-b77a-9ea2e44eeff9",
    "_libRef": {
      "libType": "public",
      "libNodeRefId": "@buildship/supabase-postgres-rpc",
      "version": "5.0.0",
      "isDirty": false,
      "buildHash": "b955a9d7db7bc33e286ab4e5fa87eb97c999600106d73c8d6ad9339fc73907b9",
      "integrity": "v3:feaca67f48659fd687ffec87bd79ecc1",
      "src": "https://storage.googleapis.com/buildship-app-us-central1/publicLib/nodesV2/@buildship/supabase-postgres-rpc/5.0.0/build.cjs"
    },
    "integrity": "v3:feaca67f48659fd687ffec87bd79ecc1",
    "inputs": {
      "properties": {
        "apiUrl": {
          "title": "API URL",
          "description": "Your Supabase project URL. (Get it from your [Supabase Project](https://supabase.com/dashboard/projects) API Reference).",
          "pattern": "",
          "default": "",
          "properties": {},
          "buildship": {
            "index": "1",
            "sensitive": false,
            "placeholder": "https://your-supabase-url.supabase.co"
          },
          "type": "string"
        },
        "functionName": {
          "title": "Function Name",
          "description": "The name of the Postgres function to call. Set up your functions on your [Supabase Dashboard](https://supabase.com/dashboard/project) > Database > Functions.\n\n**TIP 💡:** Refer to the dedicated tutorial for setting up Supabase Postgres RPC [here](https://docs.buildship.com/tutorials/supabase-rpc).",
          "pattern": "",
          "default": "",
          "properties": {},
          "buildship": {
            "index": "2",
            "sensitive": false,
            "placeholder": "your_function_name"
          },
          "type": "string"
        },
        "args": {
          "title": "Arguments",
          "description": "The arguments to pass to the function (if required).\n\nSAMPLE INPUT:\n```\n{\"row_id\":2}\n```",
          "pattern": "",
          "default": {},
          "properties": {},
          "buildship": {
            "index": "3",
            "sensitive": false
          },
          "type": "object"
        }
      },
      "sections": {},
      "type": "object",
      "structure": [
        {
          "index": "1",
          "parentId": null,
          "id": "apiUrl",
          "depth": "0"
        },
        {
          "parentId": null,
          "id": "functionName",
          "index": "2",
          "depth": "0"
        },
        {
          "index": "3",
          "depth": "0",
          "id": "args",
          "parentId": null
        }
      ],
      "required": [
        "apiKey",
        "apiUrl",
        "functionName"
      ]
    },
    "script": "import {\n    createClient\n} from '@supabase/supabase-js';\nexport default async function callPostgresFunction({\n    apiUrl,\n    functionName,\n    args\n}: NodeInputs, {auth}) : NodeOutput  {\n    const apiKey = auth.getKey();\n    if (apiKey === undefined) {\n      throw new Error(\"Please select a key for this node.\");\n    }\n    const supabase = createClient(apiUrl, apiKey);\n    const {\n        data,\n        error\n    } = await supabase.rpc(functionName, args);\n    if (error) throw error;\n    return data;\n}",
    "src": "https://storage.googleapis.com/buildship-app-us-central1/publicLib/nodesV2/@buildship/supabase-postgres-rpc/5.0.0/build.cjs",
    "version": "5.0.0",
    "_groupInfo": {
      "uid": "supabase",
      "acceptsKey": true,
      "keyDescription": "The API Key of the Supabase instance. You can get your API Key from the [Supabase Dashboard](https://supabase.com/dashboard/projects) under Settings > API.",
      "iconUrl": "https://firebasestorage.googleapis.com/v0/b/website-a1s39m.appspot.com/o/buildship-app-logos%2Fsupabase.png?alt=media&token=db017867-8867-4e74-8e94-c7074c82b836",
      "description": "Nodes for connecting with your Supabase tables and perform actions on your data.",
      "name": "Supabase"
    },
    "label": "Supabase Edition Check"
  },
  {
    "label": "Build Final Output JSON",
    "output": {
      "buildship": {}
    },
    "plan": {
      "inputs": [
        {
          "id": "bookData",
          "type": "object",
          "_ai_instruction": "Use output from normalize-data.",
          "description": "Normalized book data.",
          "name": "Normalized Book Data"
        },
        {
          "description": "Supabase RPC result.",
          "name": "Supabase Edition Check",
          "_ai_instruction": "Use output from supabase-edition-check.",
          "id": "internalCheck",
          "type": "object"
        },
        {
          "name": "ISBN",
          "type": "string",
          "_ai_instruction": "Use input ISBN.",
          "description": "The supplied ISBN.",
          "id": "isbn"
        }
      ],
      "name": "Build Final Output JSON",
      "description": "Build the final output JSON as per requirements.",
      "output": [
        {
          "id": "jsonResult",
          "description": "Final output JSON.",
          "type": "object",
          "name": "jsonResult"
        }
      ]
    },
    "meta": {
      "icon": {
        "type": "URL",
        "url": null
      },
      "id": "build-final-output-json",
      "name": "Build Final Output JSON",
      "description": "Build the final output JSON as per requirements."
    },
    "id": "4a3679ff-5c0b-453c-9acc-ccd01d264318",
    "type": "script",
    "script": "export default async function buildFinalOutputJson({\n    bookData,\n    internalCheck,\n    isbn\n}: NodeInputs): NodeOutput {\n\n    // Determine if the book exists and get its ID if it does.\n    const existingId = internalCheck?.edition_id;\n\n    // Build the final output JSON structure.\n    // Use the existing ID if available, otherwise this is a new record.\n    const jsonResult = {\n        id: existingId, // Use the ID from Supabase if it exists\n        isNew: !existingId, // A flag to tell the frontend if this is a new book\n        isbn: isbn,\n        ...bookData,\n        updated_at: new Date().toISOString()\n    };\n\n    return {\n        jsonResult\n    };\n}",
    "description": "Build the final output JSON as per requirements.",
    "inputs": {
      "properties": {
        "bookData": {
          "title": "Normalized Book Data",
          "description": "The standardized book data object from the normalization node.",
          "buildship": {
            "index": "0",
            "sensitive": false,
            "defaultExpressionType": "text"
          },
          "type": "object",
          "properties": {}
        },
        "internalCheck": {
          "title": "Internal DB Check Result",
          "description": "The response from the Supabase function call checking for an existing edition.",
          "buildship": {
            "index": "1",
            "sensitive": false,
            "defaultExpressionType": "text"
          },
          "type": "object",
          "properties": {}
        },
        "isbn": {
          "title": "Original ISBN",
          "description": "The original ISBN-13 provided in the workflow trigger.",
          "buildship": {
            "index": "2",
            "sensitive": false,
            "defaultExpressionType": "text"
          },
          "type": "string"
        }
      },
      "type": "object",
      "required": [
        "blogFile",
        "bookData",
        "internalCheck",
        "isbn"
      ],
      "sections": {},
      "structure": [
        {
          "id": "bookData",
          "parentId": null,
          "depth": "0",
          "index": "0"
        },
        {
          "id": "internalCheck",
          "parentId": null,
          "depth": "0",
          "index": "1"
        },
        {
          "id": "isbn",
          "parentId": null,
          "depth": "0",
          "index": "2"
        }
      ]
    },
    "dependencies": {
      "uuid": "11.1.0"
    }
  },
  {
    "type": "output",
    "description": "",
    "id": "1cb91f94-ca62-44dc-980e-7eeef1b03c07",
    "label": "Outputs"
  }
]