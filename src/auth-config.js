// Paste only the new platform project's Project URL and publishable key.
// The publishable key is designed for browser use. Never add a secret/service_role key here.
export const SUPABASE_URL = 'https://ptdotvzkizlwkjgcazox.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_5RQYR3KIGtfBr7IW11rMVQ_jyi3T9Ct';
export const authConfigured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(SUPABASE_URL) && /^sb_publishable_/.test(SUPABASE_PUBLISHABLE_KEY);
