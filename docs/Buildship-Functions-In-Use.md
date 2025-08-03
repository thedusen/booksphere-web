## Buildship Flow:

getEnrichedBookDataByIsbn

### API Endpoint:

https://qdpvud.buildship.run/getEnrichedBookDataByIsbn

### Fuction:

get_edition_details_by_isbn

### Node code:

import {
    createClient
} from '@supabase/supabase-js';
export default async function callPostgresFunction({
    apiUrl,
    functionName,
    args
}: NodeInputs, {auth}) : NodeOutput  {
    const apiKey = auth.getKey();
    if (apiKey === undefined) {
      throw new Error("Please select a key for this node.");
    }
    const supabase = createClient(apiUrl, apiKey);
    const {
        data,
        error
    } = await supabase.rpc(functionName, args);
    if (error) throw error;
    return data;
}

------

## Buildship Flow:

eBay - get refresih_code

### API Endpoint:

https://qdpvud.buildship.run/ebay/get_tokens

### Fuction:

upsert_ebay_tokens

### Node code:

import {
    createClient
} from '@supabase/supabase-js';
export default async function callPostgresFunction({
    apiUrl,
    functionName,
    args
}: NodeInputs, {auth}) : NodeOutput  {
    const apiKey = auth.getKey();
    if (apiKey === undefined) {
      throw new Error("Please select a key for this node.");
    }
    const supabase = createClient(apiUrl, apiKey);
    const {
        data,
        error
    } = await supabase.rpc(functionName, args);
    if (error) throw error;
    return data;
}

------

## Buildship Flow:

ebay - get access token

### API Endpoint:

Internal trigger

### Fuction:

get_ebay_token_status

### Node code:

import {
    createClient
} from '@supabase/supabase-js';

// Assuming NodeInputs is an interface/type like this:
// interface NodeInputs {
//     apiUrl: string;
//     functionName: string;
//     args: Record<string, any>; // Or object
//     serviceKey?: string; // << NEW OPTIONAL INPUT
// }
// interface NodeScriptOptions {
//     auth: { getKey: () => string | undefined; };
// }
// interface NodeOutput { /* ... */ }


export default async function callPostgresFunctionWithServiceRole(
    inputs: NodeInputs, // Changed to receive the whole inputs object
    { auth }: NodeScriptOptions
): NodeOutput {
    const { apiUrl, functionName, args, serviceKey } = inputs; // Destructure inputs

    let effectiveApiKey: string | undefined;

    if (serviceKey && serviceKey.trim() !== "") {
        // If a serviceKey is provided and is not empty, use it.
        effectiveApiKey = serviceKey;
        // console.log("Using provided serviceKey for Supabase client."); // Optional: for debugging
    } else {
        // Otherwise, fall back to the default key from auth configuration.
        effectiveApiKey = auth.getKey();
        // console.log("Using default auth.getKey() for Supabase client."); // Optional: for debugging
    }

    if (effectiveApiKey === undefined) {
        throw new Error("Supabase API key is not available. Please select a key for this node or provide a serviceKey input.");
    }

    const supabase = createClient(apiUrl, effectiveApiKey);

    // console.log(`Calling RPC function: ${functionName} with args:`, args); // Optional: for debugging
    // console.log(`Using Supabase client initialized with API URL: ${apiUrl}`); // Optional: for debugging


    const {
        data,
        error
    } = await supabase.rpc(functionName, args);

    if (error) {
        console.error("Supabase RPC Error:", JSON.stringify(error, null, 2)); // Log the full error
        throw error; // Re-throw the original error object for Buildship to handle
    }

    return data;
}

------

## Buildship Flow:

ebay - get access token

### API Endpoint:

Internal

### Fuction:

update_ebay_access_token

### Node code:

import {
    createClient
} from '@supabase/supabase-js';

// Assuming NodeInputs is an interface/type like this:
// interface NodeInputs {
//     apiUrl: string;
//     functionName: string;
//     args: Record<string, any>; // Or object
//     serviceKey?: string; // << NEW OPTIONAL INPUT
// }
// interface NodeScriptOptions {
//     auth: { getKey: () => string | undefined; };
// }
// interface NodeOutput { /* ... */ }


export default async function callPostgresFunctionWithServiceRole(
    inputs: NodeInputs, // Changed to receive the whole inputs object
    { auth }: NodeScriptOptions
): NodeOutput {
    const { apiUrl, functionName, args, serviceKey } = inputs; // Destructure inputs

    let effectiveApiKey: string | undefined;

    if (serviceKey && serviceKey.trim() !== "") {
        // If a serviceKey is provided and is not empty, use it.
        effectiveApiKey = serviceKey;
        // console.log("Using provided serviceKey for Supabase client."); // Optional: for debugging
    } else {
        // Otherwise, fall back to the default key from auth configuration.
        effectiveApiKey = auth.getKey();
        // console.log("Using default auth.getKey() for Supabase client."); // Optional: for debugging
    }

    if (effectiveApiKey === undefined) {
        throw new Error("Supabase API key is not available. Please select a key for this node or provide a serviceKey input.");
    }

    const supabase = createClient(apiUrl, effectiveApiKey);

    // console.log(`Calling RPC function: ${functionName} with args:`, args); // Optional: for debugging
    // console.log(`Using Supabase client initialized with API URL: ${apiUrl}`); // Optional: for debugging


    const {
        data,
        error
    } = await supabase.rpc(functionName, args);

    if (error) {
        console.error("Supabase RPC Error:", JSON.stringify(error, null, 2)); // Log the full error
        throw error; // Re-throw the original error object for Buildship to handle
    }

    return data;
}


------

## Buildship Flow:

Get Amazon API Token

### API Endpoint:

Internal tool trigger

### Fuction:

get_sp_api_token_status

### Node code:

import {
    createClient
} from '@supabase/supabase-js';

// Assuming NodeInputs is an interface/type like this:
// interface NodeInputs {
//     apiUrl: string;
//     functionName: string;
//     args: Record<string, any>; // Or object
//     serviceKey?: string; // << NEW OPTIONAL INPUT
// }
// interface NodeScriptOptions {
//     auth: { getKey: () => string | undefined; };
// }
// interface NodeOutput { /* ... */ }


export default async function callPostgresFunctionWithServiceRole(
    inputs: NodeInputs, // Changed to receive the whole inputs object
    { auth }: NodeScriptOptions
): NodeOutput {
    const { apiUrl, functionName, args, serviceKey } = inputs; // Destructure inputs

    let effectiveApiKey: string | undefined;

    if (serviceKey && serviceKey.trim() !== "") {
        // If a serviceKey is provided and is not empty, use it.
        effectiveApiKey = serviceKey;
        // console.log("Using provided serviceKey for Supabase client."); // Optional: for debugging
    } else {
        // Otherwise, fall back to the default key from auth configuration.
        effectiveApiKey = auth.getKey();
        // console.log("Using default auth.getKey() for Supabase client."); // Optional: for debugging
    }

    if (effectiveApiKey === undefined) {
        throw new Error("Supabase API key is not available. Please select a key for this node or provide a serviceKey input.");
    }

    const supabase = createClient(apiUrl, effectiveApiKey);

    // console.log(`Calling RPC function: ${functionName} with args:`, args); // Optional: for debugging
    // console.log(`Using Supabase client initialized with API URL: ${apiUrl}`); // Optional: for debugging


    const {
        data,
        error
    } = await supabase.rpc(functionName, args);

    if (error) {
        console.error("Supabase RPC Error:", JSON.stringify(error, null, 2)); // Log the full error
        throw error; // Re-throw the original error object for Buildship to handle
    }

    return data;
}


------

## Buildship Flow:

Open Library ISBN to Supabase Upsert

### API Endpoint:

https://qdpvud.buildship.run/openLibraryISBN

### Fuction:

get_full_edition_details

### Node code:

import { createClient } from '@supabase/supabase-js';

export default async function callPostgresFunction({
    apiUrl,
    functionName,
    args
}: NodeInputs, {auth}) : NodeOutput  {
    const apiKey = auth.getKey();
    if (apiKey === undefined) {
      throw new Error("Please select a key for this node.");
    }
    const supabase = createClient(apiUrl, apiKey);
    const {
        data,
        error
    } = await supabase.rpc(functionName, args);
    if (error) throw error;
    return data;
}

------

## Buildship Flow:

Process -Catalog From Images

### API Endpoint:

Internal tool call

### Fuction:

match_book_by_details

### Node code:

import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";

export default async function (
  { jobId, supabaseUrl, supabaseServiceKey, geminiApiKey }: NodeInputs,
  { logging }: NodeScriptOptions
): Promise<NodeOutput> {

  // --- FIX: Robustly extract the UUID string from the input ---
  // This handles cases where jobId is an object { "jobId": "..." } or already a plain string.
  const jobUUID = typeof jobId === 'object' && jobId !== null && jobId.jobId ? jobId.jobId : jobId;

  logging.log(`--- Starting Job Processing (v4 - Final): ${jobUUID} ---`);

  // Initialize the Supabase client with the service_role key to bypass RLS
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Check for null or undefined jobId early to prevent errors
    if (!jobUUID) {
      throw new Error("Job ID is null, undefined, or could not be extracted. Halting execution.");
    }

    // --- FIX: Use the corrected jobUUID variable in all queries ---
    await supabaseAdmin.from('cataloging_jobs').update({ status: 'processing' }).eq('job_id', jobUUID);
    logging.log("Set status to 'processing'.");

    const { data: jobDetails, error: fetchError } = await supabaseAdmin.from('cataloging_jobs').select('image_urls').eq('job_id', jobUUID).single();
    if (fetchError) {
      // Provide a more informative error message that includes the failing UUID.
      throw new Error(`Failed to fetch details for job ${jobUUID}: ${fetchError.message}`);
    }
    logging.log("Fetched image URLs successfully.");

    // This is the prompt template you provided, in XML format.
    const promptText = `<prompt>
<system_instruction>
Your sole task is to act as an expert antiquarian bookseller and master cataloger. You will be provided with URLs for up to three images of a single book: a cover, a title page, and a copyright page. Your mission is to meticulously analyze these images to extract detailed bibliographic information and return it only in the specified raw JSON format.
</system_instruction>

<bibliographic_authority_hierarchy>
You MUST adhere to the following strict hierarchy of sources when extracting data. When information between sources conflicts, the higher-authority source is always correct.

1.  **For Title, Subtitle, and Contributors (Authors, Editors, etc.):**
    * **Definitive Source:** The **Title Page**. This page is the absolute source of truth for the full title, subtitle, and the names of all contributors.
    * **Supporting Source:** The Cover. Use the cover only to confirm spellings if the title page is difficult to read. If there is any discrepancy in wording or contributors between the cover and the title page, the title page is ALWAYS correct.
    * **Capitalization Rule:** Extract capitalization **exactly as it appears on the Title Page**. If the title page itself uses all-caps for stylistic reasons, you must then convert it to standard "Title Case" capitalization (e.g., "A Thousand Plateaus," not "A THOUSAND PLATEAUS").

2.  **For Edition, Publication Year, and Printing Information:**
    * **Definitive Source:** The **Copyright Page**. This is the only reliable source for identifying the edition and publication year.
    * **Specific Fields:**
        * `publication_year`: Use the latest copyright date (e.g., ©1987).
        * `edition_statement`: Look for explicit phrases ("First Edition") or the number line. Report the lowest digit on the number line to determine the printing.

3.  **For Publisher and Publication Location:**
    * **Primary Source:** The **Title Page**.
    * **Secondary Source:** The Copyright Page. If the publisher is not on the title page, use the copyright page.

4.  **For Dust Jacket Presence (`has_dust_jacket`):**
    * **Definitive Source:** The **Cover Image**. This is a purely visual assessment. Is a paper dust jacket visible on the book? This can only be determined from the main cover photo.

</bibliographic_authority_hierarchy>

<field_instructions>
-   title: (string) The full main title of the book. Must follow the hierarchy and capitalization rules.
-   subtitle: (string | null) The subtitle, if present. Must follow the hierarchy and capitalization rules.
-   authors: (array of objects | null) An array for all contributors. If none are found, return null.
    -   name: (string) The full name of the person from the Title Page.
    -   role: (string) The contributor's role (e.g., "Author," "Illustrator," "Editor," "Translator," "Introduction"). Default to "Author" if no role is specified.
-   publisher: (string | null) The publisher's name, following the hierarchy rules.
-   publication_year: (number | null) The year of publication, from the Copyright Page only.
-   publication_location: (string | null) The city where the publisher is located, following the hierarchy rules.
-   edition_statement: (string | null) Any explicit statement from the Copyright Page (e.g., "First Edition"). If a number line is the only evidence, report it (e.g., "Number line indicates 2nd printing").
-   has_dust_jacket: (boolean) Based only on the cover image, is a dust jacket present? True for hardcovers with a paper wrapper, false otherwise.
</field_instructions>
<data_handling_rules>
-   If information for a field is not present on any image, the value must be null.
-   If information is present but illegible (blurry, obscured), the value must be the string "unreadable".
-   Crucially, you must completely IGNORE any handwritten text or stickers.
</data_handling_rules>
<output_constraints>
Your entire response MUST be only the raw JSON object conforming to the schema below. Do not output any text, explanations, greetings, or markdown formatting like \`json\` before or after the object.
</output_constraints>
</prompt>`;

    // Fetch images and convert to base64
    const imageFetchPromises = Object.values(jobDetails.image_urls).map(async (url) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch image from URL: ${url}`);
        const buffer = await response.arrayBuffer();
        if (buffer.byteLength === 0) {
            throw new Error(`Data Integrity Error: Fetched 0-byte file from URL: ${url}.`);
        }
        return {
            inlineData: {
                mimeType: "image/jpeg",
                data: Buffer.from(new Uint8Array(buffer)).toString("base64")
            }
        };
    });
    const imageParts = await Promise.all(imageFetchPromises);
    
    // Construct the request body using the native Gemini API format
    const requestBody = {
        contents: [{
            role: "user",
            parts: [
                { text: promptText },
                { text: `JSON Schema: { "title": "string | null", "subtitle": "string | null", "authors": [{ "name": "string", "role": "string" }], "publisher": "string | null", "publication_year": "number | null", "publication_location": "string | null", "edition_statement": "string | null", "has_dust_jacket": "boolean | null" }` },
                ...imageParts
            ]
        }]
    };

    const model = "gemini-1.5-pro-latest"; // Using latest for best performance
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

    logging.log(`Calling Gemini API for job ${jobUUID}`);
    
    const geminiResponse = await fetch(geminiApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    if (!geminiResponse.ok) {
        const errorBody = await geminiResponse.text();
        throw new Error(`Gemini API call failed: ${geminiResponse.status} ${errorBody}`);
    }
    
    const geminiResult = await geminiResponse.json();
    
    if (!geminiResult.candidates || !geminiResult.candidates[0].content.parts[0].text) {
        logging.error("Invalid response structure from Gemini:", geminiResult);
        throw new Error("AI returned an unexpected response structure.");
    }

    const rawText = geminiResult.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
    const extractedData = JSON.parse(rawText);
    logging.log("Parsed AI response:", JSON.stringify(extractedData, null, 2));

    const firstAuthor = extractedData.authors && extractedData.authors.length > 0 ? extractedData.authors[0].name : null;
    const { data: matched_edition_ids, error: rpcError } = await supabaseAdmin.rpc('match_book_by_details', {
        p_title: extractedData.title,
        p_author_name: firstAuthor,
        p_publication_year: extractedData.publication_year
    });

    if (rpcError) {
        logging.error("RPC Error Details:", JSON.stringify(rpcError, null, 2));
        throw new Error(`RPC 'match_book_by_details' failed: ${rpcError.message}`);
    }
    
    logging.log(`Matched against database. Found ${matched_edition_ids?.length || 0} matches.`);

    // --- FIX: Use the corrected jobUUID variable ---
    await supabaseAdmin.from('cataloging_jobs').update({
        status: 'completed',
        extracted_data: extractedData,
        matched_edition_ids: matched_edition_ids || []
    }).eq('job_id', jobUUID);
    logging.log("--- Job Completed Successfully ---");

    return {
      success: true,
      errorMessage: null
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error, Object.getOwnPropertyNames(error));
    logging.error("--- Job Failed ---");
    logging.error("Caught Error:", errorMessage);

    if (jobUUID) {
        // --- FIX: Use the corrected jobUUID variable ---
        await supabaseAdmin
            .from('cataloging_jobs')
            .update({ status: 'failed', error_message: errorMessage })
            .eq('job_id', jobUUID);
    }

    return {
      success: false,
      errorMessage: errorMessage
    };
  }
}

------

## Buildship Flow:

Create Job - Catalog From Images

### API Endpoint:

https://qdpvud.buildship.run/catalog-from-images

### Fuction:

create_cataloging_job

### Node code:

import { createClient } from "@supabase/supabase-js";

export default async function callRpcWithUserToken(
  { apiUrl, apiKey, authToken, imageUrls }: NodeInputs,
  { logging }: NodeScriptOptions
): Promise<NodeOutput> {

  if (!apiUrl || !apiKey || !authToken || !imageUrls) {
    throw new Error("Missing one or more required inputs: apiUrl, apiKey, authToken, imageUrls.");
  }

  // Initialize the Supabase client with the public anon key.
  const supabase = createClient(apiUrl, apiKey);

  // ✅ THE FIX: Use the modern `setSession` method instead of the deprecated `setAuth`.
  // This takes the raw token and prepares the client to act on the user's behalf.
  // We provide a dummy refresh token as it's required but not used for a single call.
  const { error: sessionError } = await supabase.auth.setSession({
    access_token: authToken,
    refresh_token: authToken, // Passing the access token again is a common pattern here.
  });

  if (sessionError) {
    logging.error("Failed to set user session:", sessionError);
    throw new Error(`Session Error: ${sessionError.message}`);
  }

  logging.log("User session set successfully. Calling 'create_cataloging_job' RPC...");

  // Call the RPC function. The client will now automatically use the token we just set.
  const { data, error } = await supabase.rpc('create_cataloging_job', {
    image_urls_payload: imageUrls
  });

  if (error) {
    logging.error("RPC call failed:", error);
    throw new Error(`RPC Error: ${error.message}`);
  }

  logging.log("RPC call successful. New Job ID:", data);

  // The RPC function directly returns the new job ID.
  return {
    jobId: data,
  };
}

------

## Buildship Flow:



### API Endpoint:



### Fuction:


### Node code:



------

## Buildship Flow:



### API Endpoint:



### Fuction:


### Node code:



------

## Buildship Flow:



### API Endpoint:



### Fuction:


### Node code:



------

