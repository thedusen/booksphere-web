---
description: Protect booksphere-mobile from accidental edits while allowing reference access
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
1. **NO DIRECT EDITS**: Never use edit_file, search_replace, or any file modification tools on files in `booksphere-mobile/`
2. **READ ACCESS ALLOWED**: You may read files from `booksphere-mobile/` for reference and analysis
3. **COPY ALLOWED**: You may copy content from mobile files to create new files in the web project (`booksphere-web/`)
4. **NO SUGGESTIONS FOR MOBILE**: Do not suggest changes to mobile files, even if you spot issues

## Allowed Actions
- ✅ Reading mobile files for reference
- ✅ Copying patterns/code from mobile to web project
- ✅ Creating new files in web project based on mobile patterns
- ✅ Analyzing shared database schemas
- ✅ Using mobile files as templates for web implementation

## Forbidden Actions
- ❌ Any direct file edits in booksphere-mobile/
- ❌ Creating new files in booksphere-mobile/
- ❌ Deleting files from booksphere-mobile/
- ❌ Moving/renaming files in booksphere-mobile/
- ❌ Running terminal commands that affect booksphere-mobile/

## When Copying Content
- Always create new files in the appropriate `booksphere-web/` directories
- Adapt mobile-specific code (React Native) to web equivalents (React)
- Maintain the same architectural patterns but adjust for web platform

## Error Response
If asked to modify mobile files directly, respond:
"I cannot modify files in booksphere-mobile/ as it's a reference-only directory. However, I can read these files and help you create equivalent functionality in the web project." 