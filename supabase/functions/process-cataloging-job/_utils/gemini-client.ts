import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Deno global for Edge Functions
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

interface ImageData {
  inlineData: {
    mimeType: string;
    data: string;
  };
}

interface ExtractedBookData {
  title: string | null;
  subtitle: string | null;
  authors: Array<{
    name: string;
    role: string;
    confidence: 'high' | 'medium' | 'low';
  }> | null;
  publisher: string | null;
  publication_year: number | null;
  publication_location: string | null;
  edition_statement: string | null;
  has_dust_jacket: boolean | null;
  extraction_confidence: {
    title: 'high' | 'medium' | 'low';
    contributors: 'high' | 'medium' | 'low';
    publication_info: 'high' | 'medium' | 'low';
  };
}

export class GeminiProcessor {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = Deno.env.get('GEMINI_API_KEY') ?? '';
    this.model = 'gemini-2.5-pro';
    
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
  }

  async extractBookData(imageData: ImageData[]): Promise<ExtractedBookData> {
    const promptText = `<prompt>
<system_instruction>
Your sole task is to act as an expert antiquarian bookseller and master cataloger. You will be provided with up to three images of a single book: a cover, a title page, and a copyright page. Your mission is to meticulously analyze these images to extract detailed bibliographic information with maximum accuracy and return it only in the specified raw JSON format.
</system_instruction>

<extraction_methodology>
You must perform a THREE-PHASE ANALYSIS for maximum accuracy:

**Phase 1: Individual Image Analysis**
Examine each image individually and note all visible bibliographic information.

**Phase 2: Cross-Validation**
Compare information across all available images, noting any discrepancies or confirmations.

**Phase 3: Final Determination**
Apply the authority hierarchy below to resolve any conflicts and determine final values.
</extraction_methodology>

<bibliographic_authority_hierarchy>
You MUST adhere to the following strict hierarchy of sources when extracting data. When information between sources conflicts, the higher-authority source is always correct.

1.  **For Title, Subtitle, and Contributors (Authors, Editors, etc.):**
    * **Definitive Source:** The **Title Page**. This page is the absolute source of truth for the full title, subtitle, and the names of all contributors.
    * **Supporting Source:** The Cover. Use the cover only to confirm spellings if the title page is difficult to read. If there is any discrepancy in wording or contributors between the cover and the title page, the title page is ALWAYS correct.
    * **Capitalization Decision Tree:**
      - If title page shows mixed case (normal capitalization), preserve it exactly
      - If title page shows ALL CAPS for stylistic reasons, convert to Title Case (e.g., "TRAFFIC SECRETS" → "Traffic Secrets")
      - PRESERVE intentional capitalization for: acronyms (FBI, NASA), brand names (iPhone, eBay), proper nouns requiring specific case
      - When uncertain between stylistic vs. intentional caps, check cover for confirmation

2.  **For Edition, Publication Year, and Printing Information:**
    * **Definitive Source:** The **Copyright Page**. This is the only reliable source for identifying the edition and publication year.
    * **Specific Fields:**
        * \`publication_year\`: Use the latest copyright date (e.g., ©1987).
        * \`edition_statement\`: Look for explicit phrases ("First Edition") or the number line. Report the lowest digit on the number line to determine the printing.

3.  **For Publisher and Publication Location:**
    * **Primary Source:** The **Title Page**.
    * **Secondary Source:** The Copyright Page. If the publisher is not on the title page, use the copyright page.

4.  **For Dust Jacket Presence (\`has_dust_jacket\`):**
    * **Definitive Source:** The **Cover Image**. This is a purely visual assessment. Is a paper dust jacket visible on the book? This can only be determined from the main cover photo.

</bibliographic_authority_hierarchy>

<contributor_detection_instructions>
**Complete Name Extraction:** Always capture the FULL name as it appears. Never use initials unless that's exactly how it's presented.

**Role Detection via Visual Analysis:**
- **Font Size Hierarchy:** Largest names are typically primary authors, smaller text often indicates editors/translators
- **Positional Cues:** Names at the top are usually authors, names at bottom or in smaller text may be editors
- **Explicit Role Indicators:** Look for words like "Edited by," "Translated by," "Illustrated by," "Introduction by"
- **Multiple Contributors:** If multiple names appear with no explicit roles, analyze positioning and typography to infer hierarchy

**Role Assignment Logic:**
- Use explicit role indicators when present
- For unnamed roles, infer from context: largest/prominent = "Author", smaller/secondary = "Editor" or "Contributor"
- When completely uncertain about role, use "Contributor" rather than defaulting to "Author"
- Common roles: Author, Editor, Translator, Illustrator, Introduction, Foreword, Contributor

**Examples:**
- "John Smith" (large text, prominent) → role: "Author" 
- "Edited by Jane Doe" → role: "Editor"
- "Smith, John" and "Doe, Jane" (equal prominence) → both "Author"
- "With an Introduction by Bob Wilson" → role: "Introduction"
</contributor_detection_instructions>

<field_instructions>
-   title: (string) The full main title of the book. Apply capitalization decision tree above.
-   subtitle: (string | null) The subtitle, if present. Apply capitalization decision tree above.
-   authors: (array of objects | null) An array for all contributors. If none are found, return null.
    -   name: (string) The COMPLETE full name of the person from the Title Page.
    -   role: (string) The contributor's specific role using the detection logic above.
    -   confidence: (string) Your confidence in this contributor identification: "high" (explicit role/clear), "medium" (inferred from context), "low" (uncertain/guess).
-   publisher: (string | null) The publisher's name, following the hierarchy rules.
-   publication_year: (number | null) The year of publication, from the Copyright Page only.
-   publication_location: (string | null) The city where the publisher is located, following the hierarchy rules.
-   edition_statement: (string | null) Any explicit statement from the Copyright Page (e.g., "First Edition"). If a number line is the only evidence, report it (e.g., "Number line indicates 2nd printing").
-   has_dust_jacket: (boolean) Based only on the cover image, is a dust jacket present? True for hardcovers with a paper wrapper, false otherwise.
-   extraction_confidence: (object) Your overall confidence in different extraction categories:
    -   title: "high" (clearly visible), "medium" (somewhat unclear), "low" (very difficult to read)
    -   contributors: "high" (all roles clear), "medium" (some inference needed), "low" (significant uncertainty)
    -   publication_info: "high" (copyright page clear), "medium" (some details unclear), "low" (limited visibility)
</field_instructions>

<data_handling_rules>
-   If information for a field is not present on any image, the value must be null.
-   If information is present but illegible (blurry, obscured), the value must be the string "unreadable".
-   Crucially, you must completely IGNORE any handwritten text or stickers.
-   When multiple images show conflicting information, ALWAYS follow the authority hierarchy above.
</data_handling_rules>

<output_constraints>
Your entire response MUST be only the raw JSON object conforming to the schema below. Do not output any text, explanations, greetings, or markdown formatting like \`json\` before or after the object.
</output_constraints>
</prompt>`;

    const requestBody = {
      contents: [{
        role: "user",
        parts: [
          { text: promptText },
          { text: `JSON Schema: { "title": "string | null", "subtitle": "string | null", "authors": [{ "name": "string", "role": "string", "confidence": "high | medium | low" }] | null, "publisher": "string | null", "publication_year": "number | null", "publication_location": "string | null", "edition_statement": "string | null", "has_dust_jacket": "boolean | null", "extraction_confidence": { "title": "high | medium | low", "contributors": "high | medium | low", "publication_info": "high | medium | low" } }` },
          ...imageData
        ]
      }]
    };

    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    console.log(`🤖 Calling Gemini API with ${imageData.length} images`);

    const response = await fetch(geminiApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini API call failed: ${response.status} ${errorBody}`);
    }

    const result = await response.json();

    if (!result.candidates || !result.candidates[0]?.content?.parts[0]?.text) {
      console.error('Invalid Gemini response structure:', result);
      throw new Error('AI returned an unexpected response structure');
    }

    const rawText = result.candidates[0].content.parts[0].text
      .replace(/```json|```/g, "")
      .trim();

    try {
      const extractedData = JSON.parse(rawText) as ExtractedBookData;
      console.log(`✅ Gemini extraction successful`);
      return extractedData;
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', rawText);
      throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }
  }
}