import {AUTH_URL,AUTH_ANON_KEY} from './auth-config.js';
export const client=window.supabase?.createClient(AUTH_URL,AUTH_ANON_KEY)??null;
export async function signIn(email,password){if(!client)throw Error('Giriş hizmeti yüklenemedi. Sayfayı yenileyin.');const {data,error}=await client.auth.signInWithPassword({email,password});if(error)throw error;return data}
export async function signUp(email,password){if(!client)throw Error('Kayıt hizmeti yüklenemedi. Sayfayı yenileyin.');const {data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+window.location.pathname}});if(error)throw error;return data}
export async function signOut(){if(!client)return;const {error}=await client.auth.signOut();if(error)throw error}
