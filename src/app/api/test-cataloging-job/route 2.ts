import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';

const schema = z.object({
  title: z.string(),
  source_type: z.string(),
  image_urls: z.object({
    cover_url: z.string().url(),
    title_page_url: z.string().url(),
    copyright_page_url: z.string().url(),
  }),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    // Get the organization ID from the user_organizations table
    const { data: userOrg, error: userOrgError } = await supabase
      .from('user_organizations')
      .select('organizations_id')
      .eq('user_id', session.user.id)
      .single();

    if (userOrgError || !userOrg) {
      return NextResponse.json({ error: 'No organization found for user' }, { status: 400 });
    }

    const orgId = userOrg.organizations_id;

    const { data: row, error } = await supabase
      .from('cataloging_jobs')
      .insert({
        organization_id: orgId,
        source_type: data.source_type,
        status: 'pending',
        image_urls: data.image_urls,
        extracted_data: { title: data.title },
      })
      .select('job_id')
      .single();

    if (error) throw error;

    return NextResponse.json({ job_id: row.job_id });
  } catch (err: any) {
    const message =
      err instanceof z.ZodError ? err.issues.map(i => i.message).join(', ')
      : err.message ?? 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 