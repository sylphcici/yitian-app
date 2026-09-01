import { ensureSession, supabase } from '../lib/supabase';

export function getProfileAvatarUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  return supabase.storage.from('profile-avatars').getPublicUrl(path).data.publicUrl;
}

export async function saveProfileToDatabase({ nickname, signature, avatarSource, existingAvatarPath }) {
  const user = await ensureSession();
  let avatarPath = existingAvatarPath || null;

  if (avatarSource?.startsWith('data:')) {
    const response = await fetch(avatarSource);
    if (!response.ok) throw new Error('读取头像失败');
    const blob = await response.blob();
    const extension = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
    const previousPath = avatarPath;
    avatarPath = `${user.id}/avatar-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from('profile-avatars').upload(avatarPath, blob, {
      contentType: blob.type || 'image/jpeg',
      upsert: false,
    });
    if (uploadError) throw uploadError;
    if (previousPath && previousPath !== avatarPath) await supabase.storage.from('profile-avatars').remove([previousPath]);
  }

  const profileChanges = {
    nickname,
    signature,
    avatar_text: nickname.slice(0, 1),
    avatar_url: avatarPath,
  };
  const { error } = await supabase.from('profiles').update(profileChanges).eq('id', user.id);
  if (error && /signature/i.test(`${error.message} ${error.details || ''}`)) {
    const { signature: _signature, ...legacyChanges } = profileChanges;
    const { error: legacyError } = await supabase.from('profiles').update(legacyChanges).eq('id', user.id);
    if (legacyError) throw legacyError;
  } else if (error) {
    throw error;
  }

  return { avatarPath, avatarUrl: getProfileAvatarUrl(avatarPath) };
}
