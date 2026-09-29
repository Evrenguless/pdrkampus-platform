// Set the project's HTTPS API origin and browser-safe publishable key.
// A self-hosted project may use a custom origin such as https://api.pdrkampus.com.
// The publishable key is designed for browser use. Never add a secret/service_role key here.
export const SUPABASE_URL = 'https://ptdotvzkizlwkjgcazox.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_5RQYR3KIGtfBr7IW11rMVQ_jyi3T9Ct';
export const authConfigured = /^https:\/\/[a-z0-9.-]+(?::443)?\/?$/i.test(SUPABASE_URL) && /^sb_publishable_/.test(SUPABASE_PUBLISHABLE_KEY);
