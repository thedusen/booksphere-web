# Schema Change Workflow (Manual by Design)

# 1. In web repo only:
supabase migration new add_feature_name
# Edit the generated .sql file
supabase db push

# 2. Regenerate types:
supabase gen types typescript > src/lib/database.types.ts

# 3. Manual sync to mobile:
cp src/lib/database.types.ts ../project-mobile/src/lib/database.types.ts

# 4. Commit both repos with clear messages:
# Web: "feat(schema): add feature description"
# Mobile: "chore(types): sync database types from web"