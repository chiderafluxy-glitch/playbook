import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars missing — running in offline/demo mode.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

// ─── Auth Helpers ────────────────────────────────────────────────────────────

export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } }
  });
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// ─── Profile Helpers ─────────────────────────────────────────────────────────

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
}

export async function updateProfile(userId: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
}

// ─── Onboarding Helpers ───────────────────────────────────────────────────────

export async function getOnboarding(userId: string) {
  const { data, error } = await supabase
    .from('user_onboarding')
    .select('*')
    .eq('user_id', userId)
    .single();
  return { data, error };
}

export async function upsertOnboarding(userId: string, fields: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('user_onboarding')
    .upsert({ user_id: userId, ...fields }, { onConflict: 'user_id' })
    .select()
    .single();
  return { data, error };
}

// ─── Generated Outputs ────────────────────────────────────────────────────────

export async function getOutput(userId: string, tool: string) {
  const { data, error } = await supabase
    .from('generated_outputs')
    .select('output')
    .eq('user_id', userId)
    .eq('tool', tool)
    .single();
  return { data: data?.output ?? null, error };
}

export async function upsertOutput(userId: string, tool: string, output: unknown) {
  const { error } = await supabase
    .from('generated_outputs')
    .upsert({ user_id: userId, tool, output }, { onConflict: 'user_id,tool' });
  return { error };
}

// ─── Generation Counts ────────────────────────────────────────────────────────

function currentMonth() {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

export async function getGenerationCounts(userId: string) {
  const month = currentMonth();
  const { data, error } = await supabase
    .from('generation_counts')
    .select('tool, count')
    .eq('user_id', userId)
    .eq('month', month);
  if (error) return {};
  const result: Record<string, number> = {};
  for (const row of data ?? []) result[row.tool] = row.count;
  return result;
}

export async function incrementGenerationCount(userId: string, tool: string) {
  const month = currentMonth();
  // Upsert: insert or increment
  const { error } = await supabase.rpc('increment_generation_count', {
    p_user_id: userId,
    p_tool: tool,
    p_month: month
  });
  return { error };
}
