# env/ Folder Guide

This folder stores all sensitive RSA key files used for JWT (RS256).

## Files inside env/

### 1. private.key
- RSA private key
- Used for **signing** JWT tokens
- Must always remain secret

### 2. public.key
- RSA public key
- Used for **verifying** JWT tokens
- Safe to share with other services, but still kept in env/ for consistency

### 3. help.md (optional)
- Notes about how keys were generated
- Developer instructions

## Important Notes
- Do NOT store .env inside this folder.
- Your `.env` file stays in project root:
  - `project/.env`

## .gitignore
Add this to ensure env folder is ignored: