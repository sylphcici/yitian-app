import { databaseEnabled, ensureSession, supabase } from '../lib/supabase';

export async function loadRecommendationFeedback() {
  if (!databaseEnabled) return [];
  const user = await ensureSession();
  const { data, error } = await supabase
    .from('recommendation_feedback')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function saveRecommendationFeedback(feedback) {
  if (!databaseEnabled) return null;
  const user = await ensureSession();
  const payload = {
    user_id: user.id,
    feedback_type: feedback.feedbackType,
    target_key: feedback.targetKey,
    target_user_id: feedback.targetUserId || null,
    topic: feedback.topic || null,
    mood: feedback.mood || null,
    source_moment_id: feedback.sourceMomentId || null,
    expires_at: feedback.expiresAt ? new Date(feedback.expiresAt).toISOString() : null,
  };
  const { data, error } = await supabase
    .from('recommendation_feedback')
    .upsert(payload, { onConflict: 'user_id,feedback_type,target_key' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRecommendationFeedback(feedbackType, targetKey) {
  if (!databaseEnabled) return;
  const user = await ensureSession();
  const { error } = await supabase
    .from('recommendation_feedback')
    .delete()
    .eq('user_id', user.id)
    .eq('feedback_type', feedbackType)
    .eq('target_key', targetKey);
  if (error) throw error;
}
