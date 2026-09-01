import { ensureSession, supabase } from '../lib/supabase';

export async function loadDatabaseDrafts() {
  const user = await ensureSession();
  const { data, error } = await supabase
    .from('drafts')
    .select('content, updated_at')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;

  const drafts = Array.isArray(data?.content?.drafts)
    ? data.content.drafts
    : Array.isArray(data?.content) ? data.content : [];
  return { drafts, updatedAt: data?.updated_at || null };
}

export async function saveDatabaseDrafts(drafts) {
  const user = await ensureSession();
  const { error } = await supabase.from('drafts').upsert({
    user_id: user.id,
    content: { version: 1, drafts },
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (error) throw error;
}