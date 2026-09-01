import { databaseEnabled, ensureSession, supabase } from '../lib/supabase';
import { getProfileAvatarUrl } from './profile';

function fromRow(row, currentUserId) {
  return {
    id: row.id,
    userId: row.user_id,
    user: row.profiles?.nickname || '一天用户',
    avatar: row.profiles?.avatar_text || '一',
    avatarUrl: getProfileAvatarUrl(row.profiles?.avatar_url),
    city: row.location_name || row.match_city || '未展示位置',
    matchCity: row.match_city || '',
    createdAt: new Date(row.created_at).getTime(),
    expiresAt: new Date(row.expires_at).getTime(),
    archivedAt: row.archived_at ? new Date(row.archived_at).getTime() : null,
    mood: row.mood,
    text: row.body,
    tags: row.tags || [],
    reactions: row.reactions?.[0]?.count || 0,
    color: row.user_id === currentUserId ? '#d95f45' : '#4a8f75',
    images: row.signedImageUrls || (row.signedImageUrl ? [row.signedImageUrl] : []),
    image: row.signedImageUrls?.[0] || row.signedImageUrl || null,
    imagePaths: row.image_urls?.length ? row.image_urls : (row.image_url ? [row.image_url] : []),
    imagePath: row.image_url || null,
    hasPhoto: row.has_photo,
    visibility: row.visibility === 'private' ? '仅自己' : '同频的人',
    location: row.location_name || '不展示位置',
    isMine: row.user_id === currentUserId,
    isEdited: Boolean(row.edited_at),
    persisted: true,
  };
}

const momentSelect = '*, reactions(count), profiles!moments_user_id_fkey(nickname, avatar_text, avatar_url)';

async function withSignedImages(rows) {
  return Promise.all(rows.map(async (row) => {
    const paths = row.image_urls?.length ? row.image_urls : (row.image_url ? [row.image_url] : []);
    if (!paths.length) return row;
    const { data, error } = await supabase.storage.from('moment-images').createSignedUrls(paths, 60 * 60);
    if (error || !data) {
      console.error('图片签名地址生成失败', error);
      return row;
    }
    const signedImageUrls = data.filter((item) => !item.error && item.signedUrl).map((item) => item.signedUrl);
    return { ...row, signedImageUrls, signedImageUrl: signedImageUrls[0] || null };
  }));
}

async function uploadMomentImage(userId, momentId, imageSource, index = 0) {
  if (!imageSource) return null;
  const response = await fetch(imageSource);
  if (!response.ok) throw new Error('读取待上传图片失败');
  const blob = await response.blob();
  const extension = blob.type === 'image/jpeg' ? 'jpg' : blob.type === 'image/webp' ? 'webp' : 'png';
  const path = `${userId}/${momentId}/${index}.${extension}`;
  const { error } = await supabase.storage.from('moment-images').upload(path, blob, {
    contentType: blob.type || 'image/png',
    upsert: true,
  });
  if (error) throw error;
  return path;
}

export async function loadDatabaseMoments() {
  if (!databaseEnabled) return null;
  const user = await ensureSession();
  const now = new Date().toISOString();
  const [{ data: active, error: activeError }, { data: archived, error: archivedError }, { data: ownReactions, error: reactionsError }] = await Promise.all([
    supabase.from('moments').select(momentSelect).is('archived_at', null).gt('expires_at', now).order('created_at', { ascending: false }),
    supabase.from('moments').select(momentSelect).eq('user_id', user.id).or(`archived_at.not.is.null,expires_at.lte.${now}`).order('created_at', { ascending: false }),
    supabase.from('reactions').select('moment_id').eq('user_id', user.id),
  ]);
  if (activeError) throw activeError;
  if (archivedError) throw archivedError;
  if (reactionsError) throw reactionsError;
  const [activeWithImages, archivedWithImages] = await Promise.all([
    withSignedImages(active),
    withSignedImages(archived),
  ]);
  return {
    userId: user.id,
    active: activeWithImages.map((row) => fromRow(row, user.id)),
    archived: archivedWithImages.map((row) => fromRow(row, user.id)),
    reactedMomentIds: ownReactions.map((reaction) => reaction.moment_id),
  };
}

export async function setDatabaseReaction(momentId, active) {
  if (!databaseEnabled) return null;
  const user = await ensureSession();
  const query = active
    ? supabase.from('reactions').upsert({ moment_id: momentId, user_id: user.id }, { onConflict: 'moment_id,user_id' })
    : supabase.from('reactions').delete().eq('moment_id', momentId).eq('user_id', user.id);
  const { error } = await query;
  if (error) throw error;
  const { count, error: countError } = await supabase.from('reactions').select('*', { count: 'exact', head: true }).eq('moment_id', momentId);
  if (countError) throw countError;
  return count || 0;
}

export async function loadResonanceNotifications() {
  if (!databaseEnabled) return [];
  const user = await ensureSession();
  const selectReactions = (includeReadAt) => supabase
    .from('reactions')
    .select(`
      id,
      user_id,
      created_at,
      ${includeReadAt ? 'read_at,' : ''}
      user:profiles!reactions_user_id_fkey(nickname, avatar_text, avatar_url),
      moment:moments!inner(id, body, user_id, expires_at, archived_at)
    `)
    .eq('moment.user_id', user.id)
    .neq('user_id', user.id)
    .order('created_at', { ascending: false });
  let supportsReadState = true;
  let { data, error } = await selectReactions(true);
  if (error && /read_at|column/i.test(error.message || '')) {
    supportsReadState = false;
    ({ data, error } = await selectReactions(false));
  }
  if (error) throw error;
  return data.map((reaction) => ({
    id: reaction.id,
    type: '共鸣',
    userId: reaction.user_id,
    user: reaction.user?.nickname || '一天用户',
    avatar: reaction.user?.avatar_text || '一',
    avatarUrl: getProfileAvatarUrl(reaction.user?.avatar_url),
    color: '#d95f45',
    createdAt: new Date(reaction.created_at).getTime(),
    time: '',
    preview: '和你说了“我也是”',
    source: reaction.moment?.body || '这条此刻已不可见',
    momentId: reaction.moment?.id,
    unread: supportsReadState ? !reaction.read_at : false,
  }));
}

export async function markDatabaseResonanceRead(reactionIds = null) {
  if (!databaseEnabled) return;
  const { error } = await supabase.rpc('mark_own_reactions_read', {
    target_reaction_ids: reactionIds?.length ? reactionIds : null,
  });
  if (error) throw error;
}

export async function createMoment(moment) {
  if (!databaseEnabled) return null;
  const user = await ensureSession();
  const payload = {
    user_id: user.id,
    body: moment.text,
    mood: moment.mood,
    tags: moment.tags,
    visibility: moment.visibility === '仅自己' ? 'private' : 'same_frequency',
    location_name: moment.location === '不展示位置' ? null : moment.location,
    match_city: moment.matchCity || null,
    has_photo: Boolean(moment.hasPhoto),
    archived_at: moment.visibility === '仅自己' ? new Date().toISOString() : null,
    created_at: new Date(moment.createdAt).toISOString(),
    expires_at: new Date(moment.expiresAt).toISOString(),
  };
  const { data, error } = await supabase.from('moments').insert(payload).select(momentSelect).single();
  if (error) throw error;
  let saved = data;
  if (moment.hasPhoto && moment.images?.length) {
    try {
      const imagePaths = await Promise.all(moment.images.slice(0, 4).map((image, index) => uploadMomentImage(user.id, data.id, image, index)));
      const { data: updated, error: updateError } = await supabase
        .from('moments')
        .update({ image_url: imagePaths[0], image_urls: imagePaths })
        .eq('id', data.id)
        .select(momentSelect)
        .single();
      if (updateError) throw updateError;
      const [signed] = await withSignedImages([updated]);
      saved = signed;
    } catch (uploadError) {
      await supabase.from('moments').delete().eq('id', data.id);
      throw uploadError;
    }
  }
  return fromRow(saved, user.id);
}

export async function updateDatabaseMoment(id, changes) {
  if (!databaseEnabled) return null;
  const user = await ensureSession();
  const previousPaths = changes.imagePaths?.length ? changes.imagePaths : (changes.imagePath ? [changes.imagePath] : []);
  let imagePaths = previousPaths;
  if (changes.hasPhoto && changes.images?.length) {
    if (previousPaths.length) await supabase.storage.from('moment-images').remove(previousPaths);
    imagePaths = await Promise.all(changes.images.slice(0, 4).map((image, index) => uploadMomentImage(user.id, id, image, index)));
  } else if (!changes.hasPhoto && previousPaths.length) {
    const { error: removeError } = await supabase.storage.from('moment-images').remove(previousPaths);
    if (removeError) throw removeError;
    imagePaths = [];
  }
  const payload = {
    body: changes.text,
    mood: changes.mood,
    tags: changes.tags,
    visibility: changes.visibility === '仅自己' ? 'private' : 'same_frequency',
    location_name: changes.location === '不展示位置' ? null : changes.location,
    match_city: changes.matchCity || null,
    has_photo: Boolean(changes.hasPhoto),
    image_url: imagePaths[0] || null,
    image_urls: imagePaths,
    archived_at: changes.visibility === '仅自己' ? new Date().toISOString() : null,
    edited_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('moments').update(payload).eq('id', id);
  if (error) throw error;
}

export async function archiveDatabaseMoment(id) {
  if (!databaseEnabled) return;
  const { error } = await supabase.from('moments').update({ archived_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function deleteDatabaseMoment(id) {
  if (!databaseEnabled) return;
  const { data: moment, error: readError } = await supabase.from('moments').select('image_url, image_urls').eq('id', id).single();
  if (readError) throw readError;
  const imagePaths = moment.image_urls?.length ? moment.image_urls : (moment.image_url ? [moment.image_url] : []);
  if (imagePaths.length) {
    const { error: removeError } = await supabase.storage.from('moment-images').remove(imagePaths);
    if (removeError) throw removeError;
  }
  const { error } = await supabase.from('moments').delete().eq('id', id);
  if (error) throw error;
}
