# [Project Name] Web - AI Development Context

## Critical Rules
1. This repo OWNS the database schema
2. All migrations must be created here
3. After schema changes, regenerate types and copy to mobile
4. Never reference the mobile repo directly

## Tech Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Supabase (full access)

## Database Management Process
1. Create migration: `supabase migration new <name>`
2. Edit the .sql file in supabase/migrations
3. Apply locally: `supabase db reset`
4. Generate types: `supabase gen types typescript --local > src/lib/database.types.ts`
5. Copy types to mobile: `cp src/lib/database.types.ts ../project-mobile/src/lib/database.types.ts`

## What This Repo Does
- Web interface for [functionality]
- Admin functions
- Database schema management
- API routes if needed

## Forbidden Actions
- Automated sync scripts (manual is intentional)
- Cross-repo imports or references