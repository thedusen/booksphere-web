/**
 * Test script for enhanced Gemini prompt improvements
 * Tests the new confidence indicators and improved extraction logic
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://oteqbwupxzjjvqbkumlt.supabase.co';

console.log(`🔗 Using Supabase URL: ${SUPABASE_URL}`);
console.log(`🔑 Gemini API Key available: ${GEMINI_API_KEY ? 'Yes' : 'No (will skip API test)'}`);
console.log('');

console.log('🧪 Testing Enhanced Gemini Prompt');
console.log('================================');

/**
 * Test the enhanced prompt directly with Gemini API
 * This simulates the enhanced extraction logic without needing real book images
 */
async function testEnhancedPrompt() {
  if (!GEMINI_API_KEY) {
    console.log('⏭️  Skipping Gemini API test (no API key available)');
    console.log('   Note: GEMINI_API_KEY should be set as a Supabase secret for production Edge Function');
    return;
  }
  const testPrompt = `<prompt>
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

For this test, simulate analyzing a book with the following characteristics:
- Title page shows: "TRAFFIC SECRETS" (all caps, stylistic)
- Author: "Russell Brunson"
- Copyright page shows: "© 2020"
- Publisher: "Hay House"

Please extract data following the enhanced prompt rules.
</prompt>`;

  const requestBody = {
    contents: [{
      role: "user",
      parts: [
        { text: testPrompt },
        { text: `JSON Schema: { "title": "string | null", "subtitle": "string | null", "authors": [{ "name": "string", "role": "string", "confidence": "high | medium | low" }] | null, "publisher": "string | null", "publication_year": "number | null", "publication_location": "string | null", "edition_statement": "string | null", "has_dust_jacket": "boolean | null", "extraction_confidence": { "title": "high | medium | low", "contributors": "high | medium | low", "publication_info": "high | medium | low" } }` }
      ]
    }]
  };

  try {
    console.log('🤖 Calling Gemini API with enhanced prompt...');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini API call failed: ${response.status} ${errorBody}`);
    }

    const result = await response.json();

    if (!result.candidates || !result.candidates[0]?.content?.parts[0]?.text) {
      console.error('❌ Invalid Gemini response structure:', result);
      return;
    }

    const rawText = result.candidates[0].content.parts[0].text
      .replace(/```json|```/g, "")
      .trim();

    console.log('📝 Raw Gemini Response:');
    console.log(rawText);
    console.log('');

    try {
      const extractedData = JSON.parse(rawText);
      
      console.log('✅ Enhanced Extraction Results:');
      console.log('================================');
      console.log(`Title: ${extractedData.title}`);
      console.log(`Subtitle: ${extractedData.subtitle}`);
      console.log(`Publisher: ${extractedData.publisher}`);
      console.log(`Publication Year: ${extractedData.publication_year}`);
      console.log('');
      
      if (extractedData.authors) {
        console.log('📚 Authors:');
        extractedData.authors.forEach((author, index) => {
          console.log(`  ${index + 1}. ${author.name} (${author.role}) - Confidence: ${author.confidence}`);
        });
      }
      console.log('');

      console.log('🎯 Extraction Confidence:');
      console.log(`  Title: ${extractedData.extraction_confidence?.title}`);
      console.log(`  Contributors: ${extractedData.extraction_confidence?.contributors}`);
      console.log(`  Publication Info: ${extractedData.extraction_confidence?.publication_info}`);
      console.log('');

      // Test specific improvements
      console.log('🧪 Testing Improvements:');
      console.log('========================');
      
      // Check capitalization fix
      if (extractedData.title === 'Traffic Secrets') {
        console.log('✅ Capitalization fix working: "TRAFFIC SECRETS" → "Traffic Secrets"');
      } else {
        console.log(`⚠️  Capitalization might need review: Got "${extractedData.title}"`);
      }

      // Check confidence indicators
      if (extractedData.extraction_confidence) {
        console.log('✅ Confidence indicators present');
      } else {
        console.log('❌ Confidence indicators missing');
      }

      // Check author confidence
      if (extractedData.authors?.[0]?.confidence) {
        console.log('✅ Author confidence indicators present');
      } else {
        console.log('❌ Author confidence indicators missing');
      }

    } catch (parseError) {
      console.error('❌ Failed to parse Gemini response as JSON:', parseError);
      console.log('Raw response was:', rawText);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

/**
 * Test Edge Function endpoint
 */
async function testEdgeFunction() {
  console.log('🚀 Testing Edge Function with enhanced prompt...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/process-cataloging-job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test' // This will fail auth but test the function structure
      },
      body: JSON.stringify({ jobId: 'test-123' })
    });

    console.log(`📡 Edge Function response status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('✅ Edge Function is running (authentication required as expected)');
    } else {
      const responseText = await response.text();
      console.log('📝 Response:', responseText);
    }

  } catch (error) {
    console.error('❌ Edge Function test failed:', error.message);
  }
}

/**
 * Validate the enhanced prompt structure without API calls
 */
function validatePromptImprovements() {
  console.log('🔍 Validating Enhanced Prompt Structure');
  console.log('=======================================');

  // Read the gemini-client.ts file to validate improvements
  const fs = require('fs');
  const path = require('path');
  
  try {
    const geminiClientPath = path.join(__dirname, 'supabase/functions/process-cataloging-job/_utils/gemini-client.ts');
    const geminiClientContent = fs.readFileSync(geminiClientPath, 'utf8');
    
    const improvements = [
      {
        name: 'Capitalization Decision Tree',
        test: geminiClientContent.includes('Capitalization Decision Tree:'),
        description: 'Fixed contradiction between "extract exactly" and "convert to title case"'
      },
      {
        name: 'Three-Phase Analysis',
        test: geminiClientContent.includes('THREE-PHASE ANALYSIS'),
        description: 'Added internal cross-validation methodology'
      },
      {
        name: 'Contributor Detection Instructions',
        test: geminiClientContent.includes('<contributor_detection_instructions>'),
        description: 'Enhanced contributor role detection with visual cues'
      },
      {
        name: 'Complete Name Extraction',
        test: geminiClientContent.includes('Always capture the FULL name'),
        description: 'Explicit instructions for complete name capture'
      },
      {
        name: 'Confidence Indicators',
        test: geminiClientContent.includes('confidence: \'high\' | \'medium\' | \'low\''),
        description: 'Added confidence indicators for extraction quality'
      },
      {
        name: 'Visual Hierarchy Analysis',
        test: geminiClientContent.includes('Font Size Hierarchy:'),
        description: 'Instructions for analyzing visual cues in contributor detection'
      },
      {
        name: 'Concrete Examples',
        test: geminiClientContent.includes('**Examples:**'),
        description: 'Added concrete examples for common edge cases'
      },
      {
        name: 'Enhanced Interface',
        test: geminiClientContent.includes('extraction_confidence:'),
        description: 'Updated TypeScript interface with confidence fields'
      }
    ];

    console.log('📊 Enhancement Validation Results:');
    console.log('==================================');
    
    let passedCount = 0;
    improvements.forEach((improvement, index) => {
      const status = improvement.test ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${improvement.name}`);
      console.log(`   ${improvement.description}`);
      if (improvement.test) passedCount++;
    });

    console.log('');
    console.log(`📈 Summary: ${passedCount}/${improvements.length} improvements validated`);
    
    if (passedCount === improvements.length) {
      console.log('🎉 All prompt enhancements successfully implemented!');
    } else {
      console.log('⚠️  Some enhancements may need review');
    }

  } catch (error) {
    console.log('❌ Could not validate prompt file:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('Starting Enhanced Gemini Prompt Tests');
  console.log('=====================================\n');

  // Test 1: Validate prompt structure improvements
  validatePromptImprovements();
  console.log('\n');

  // Test 2: Direct Gemini API test with enhanced prompt (if API key available)
  await testEnhancedPrompt();
  console.log('\n');

  // Test 3: Edge Function availability
  await testEdgeFunction();
  
  console.log('\n🏁 Tests completed!');
}

runTests().catch(console.error);