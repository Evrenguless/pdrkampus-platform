// Paste only the new platform project's Project URL and publishable key.
// The publishable key is designed for browser use. Never add a secret/service_role key here.
export const SUPABASE_URL = '';
export const SUPABASE_PUBLISHABLE_KEY = '';
export const authConfigured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(SUPABASE_URL) && /^sb_publishable_/.test(SUPABASE_PUBLISHABLE_KEY);
