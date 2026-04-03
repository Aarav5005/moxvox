import { createClient } from '@supabase/supabase-js';

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || __SUPABASE_URL__ || '').trim();
const supabaseAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || __SUPABASE_ANON_KEY__ || '').trim();

if (!supabaseUrl || !/^https?:\/\//i.test(supabaseUrl)) {
	throw new Error(
		'[env] Invalid or missing VITE_SUPABASE_URL. Set it in .env as a full URL (https://...) and restart the dev server.'
	);
}

if (!supabaseAnonKey) {
	throw new Error(
		'[env] Missing VITE_SUPABASE_ANON_KEY. Set it in .env and restart the dev server.'
	);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
