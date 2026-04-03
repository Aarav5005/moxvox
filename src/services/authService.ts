import { supabase } from "./supabaseClient";

export async function login(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signup(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function logout() {
  return supabase.auth.signOut();
}

export async function getCurrentUser() {
  return supabase.auth.getUser();
}
