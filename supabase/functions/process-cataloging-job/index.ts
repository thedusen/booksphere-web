import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { GeminiProcessor } from './_utils/gemini-client.ts';
import { ImageProcessor } from './_utils/image-processor.ts';

interface RequestBody {
  jobId: string;
}

interface CatalogJob {
  job_id: string;
  organization_id: string;
  user_id: string;
  status: string;
  image_urls: Record<string, string>;
  extracted_data?: any;
  matched_edition_ids?: string[];
  error_message?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { jobId }: RequestBody = await req.json();
    
    if (!jobId) {
      throw new Error('Job ID is required');
    }

    console.log(`🚀 Starting job processing: ${jobId}`);

    // Get user JWT token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    // Initialize Supabase client with user token for authentication
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Initialize service role client for elevated operations
    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user has access to this job and get job details
    const { data: jobDetails, error: fetchError } = await userSupabase
      .from('cataloging_jobs')
      .select('*')
      .eq('job_id', jobId)
      .single();

    if (fetchError || !jobDetails) {
      throw new Error(`Failed to fetch job details: ${fetchError?.message || 'Job not found'}`);
    }

    console.log(`✅ Job found for user. Starting processing...`);

    // Update job status to processing using service role
    await serviceSupabase
      .from('cataloging_jobs')
      .update({ status: 'processing' })
      .eq('job_id', jobId);

    console.log(`📊 Status updated to 'processing'`);

    // Process images and extract data
    const imageProcessor = new ImageProcessor(serviceSupabase);
    const geminiProcessor = new GeminiProcessor();

    // Fetch and process images
    const imageData = await imageProcessor.processImages(jobDetails.image_urls);
    console.log(`🖼️ Images processed successfully`);

    // Extract book data using Gemini AI
    const extractedData = await geminiProcessor.extractBookData(imageData);
    console.log(`🤖 AI extraction completed:`, JSON.stringify(extractedData, null, 2));

    // Match against existing books in database
    const firstAuthor = extractedData.authors && extractedData.authors.length > 0 
      ? extractedData.authors[0].name 
      : null;

    const { data: matchedEditionIds, error: rpcError } = await serviceSupabase
      .rpc('match_book_by_details', {
        p_title: extractedData.title,
        p_author_name: firstAuthor,
        p_publication_year: extractedData.publication_year
      });

    if (rpcError) {
      console.error('📚 RPC Error:', rpcError);
      throw new Error(`Failed to match books: ${rpcError.message}`);
    }

    console.log(`🔍 Book matching completed. Found ${matchedEditionIds?.length || 0} matches`);

    // Update job with results using service role
    await serviceSupabase
      .from('cataloging_jobs')
      .update({
        status: 'completed',
        extracted_data: extractedData,
        matched_edition_ids: matchedEditionIds || [],
        error_message: null
      })
      .eq('job_id', jobId);

    console.log(`✅ Job completed successfully: ${jobId}`);

    return new Response(
      JSON.stringify({
        success: true,
        jobId,
        extractedData,
        matchedEditionIds: matchedEditionIds || []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ Job processing failed:', errorMessage);

    // Try to update job status to failed if we have a jobId
    try {
      const { jobId } = await req.json();
      if (jobId) {
        const serviceSupabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        await serviceSupabase
          .from('cataloging_jobs')
          .update({
            status: 'failed',
            error_message: errorMessage
          })
          .eq('job_id', jobId);
      }
    } catch (updateError) {
      console.error('Failed to update job status to failed:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});