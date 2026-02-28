#!/bin/bash
# =============================================================================
# LAWNLENS: Supabase Secrets Setup Script
# =============================================================================
# File: supabase/setup_secrets.sh
#
# PURPOSE:
#   This script sets all required secrets in the Supabase Secrets Vault so
#   that Edge Functions can read API keys at runtime WITHOUT those keys ever
#   being stored in the codebase, committed to Git, or sent to the client app.
#
# HOW IT WORKS:
#   1. Supabase Edge Functions read secrets via `Deno.env.get("SECRET_NAME")`.
#   2. The values are encrypted at rest in the Supabase Vault.
#   3. This is the RECOMMENDED way to store API keys for Supabase projects.
#      Reference: https://supabase.com/docs/guides/functions/secrets
#
# HOW TO RUN:
#   1. Install the Supabase CLI: `npm install -g supabase`
#   2. Link your project: `supabase link --project-ref <your-project-ref>`
#   3. Make this file executable: `chmod +x supabase/setup_secrets.sh`
#   4. Run it: `./supabase/setup_secrets.sh`
#
# AFTER RUNNING:
#   Verify secrets were set correctly:
#     supabase secrets list
#
# NOTE: The actual key values are NOT stored in this file. You will be prompted
#       to enter them, or you can pass them as environment variables.
# =============================================================================

set -e # Exit immediately if any command fails

echo "============================================"
echo " LawnLens: Supabase Secrets Setup"
echo "============================================"
echo ""

# Use environment variable if set, otherwise prompt the user interactively.
# This design allows this script to be run both manually (interactive prompt)
# or in a CI/CD pipeline (via DEDALUS_API_KEY env var already set).
if [ -z "$DEDALUS_API_KEY" ]; then
  echo "Enter your Dedalus API key (starts with dsk-live-...):"
  read -s DEDALUS_API_KEY  # -s hides the input for security
  echo ""
fi

echo "Setting DEDALUS_API_KEY in Supabase Secrets Vault..."
supabase secrets set DEDALUS_API_KEY="$DEDALUS_API_KEY"

echo ""
echo "✅ All secrets set successfully!"
echo ""
echo "Verifying (this will list secret NAMES only, not values):"
supabase secrets list
echo ""
echo "============================================"
echo " NEXT STEP: Apply the database migration"
echo "============================================"
echo ""
echo "Run the following command to apply the match_plants RPC:"
echo ""
echo "  supabase db push"
echo ""
echo "Or copy the contents of:"
echo "  supabase/migrations/20260228_match_plants_rpc.sql"
echo "into the Supabase SQL Editor and click Run."
echo ""
