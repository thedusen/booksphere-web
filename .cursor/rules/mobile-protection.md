---
description: Protect booksphere-mobile from accidental edits
alwaysApply: true
---

# CRITICAL: booksphere-mobile Protection Rule

**NEVER EDIT ANY FILES IN THE `booksphere-mobile/` DIRECTORY**

## Context
- The `booksphere-mobile/` folder contains a separate React Native project
- It exists in this workspace ONLY for reference purposes
- It has its own repository and development lifecycle
- Any edits could corrupt the mobile project or create merge conflicts

## Strict Rules
1. **NO EDITS**: Never use edit_file, search_replace, or any file modification tools on files in `booksphere-mobile/`
2. **READ-ONLY**: You may read files from `booksphere-mobile/` for reference, but NEVER modify them
3. **NO SUGGESTIONS**: Do not suggest changes to mobile files, even if you spot issues
4. **REDIRECT**: If asked to modify mobile files, redirect the user to work in the actual booksphere-mobile project

## Allowed Actions
- ✅ Reading mobile files for reference
- ✅ Analyzing patterns to apply to web project
- ✅ Understanding shared database schemas

## Forbidden Actions
- ❌ Any file edits in booksphere-mobile/
- ❌ Creating new files in booksphere-mobile/
- ❌ Deleting files from booksphere-mobile/
- ❌ Moving/renaming files in booksphere-mobile/
- ❌ Running terminal commands that affect booksphere-mobile/

## Error Response
If asked to modify mobile files, respond:
"I cannot modify files in booksphere-mobile/ as it's a reference-only directory. Please work in the actual booksphere-mobile project for any mobile-related changes." 