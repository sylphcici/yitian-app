import { databaseEnabled, ensureSession, supabase } from '../lib/supabase';
import { getProfileAvatarUrl } from './profile';

const replySelect = `
  *,
  sender:profiles!replies_sender_id_fkey(nickname, avatar_text, avatar_url),
  receiver:profiles!replies_receiver_id_fkey(nickname, avatar_text, avatar_url),
  moment:moments!replies_moment_id_fkey(body, expires_at, user_id)
`;

function groupThreads(rows, currentUserId) {
  const groups = new Map();
  rows.forEach((row) => {
    const sentByMe = row.sender_id === currentUserId;
    const otherId = sentByMe ? row.receiver_id : row.sender_id;
    const otherProfile = sentByMe ? row.receiver : row.sender;
    const key = `${row.moment_id}:${otherId}`;
    if (!groups.has(key)) {
      groups.set(key, {
        id: key,
        momentId: row.moment_id,
        otherId,
        user: otherProfile?.nickname || '一天用户',
        avatar: otherProfile?.avatar_text || '一',
        avatarUrl: getProfileAvatarUrl(otherProfile?.avatar_url),
        color: '#4a8f75',
        source: row.moment?.body || '这条此刻已不可见',
        sourceOwner: row.moment?.user_id === currentUserId ? 'me' : 'them',
        expiresAt: row.moment?.expires_at ? new Date(row.moment.expires_at).getTime() : 0,
        unread: false,
        messages: [],
        persisted: true,
      });
    }
    const thread = groups.get(key);
    thread.messages.push({
      id: row.id,
      body: row.body,
      sender: sentByMe ? 'me' : 'them',
      createdAt: new Date(row.created_at).getTime(),
      readAt: row.read_at,
    });
    if (!sentByMe && !row.read_at) thread.unread = true;
  });
  return [...groups.values()].sort((a, b) => {
    const aTime = a.messages.at(-1)?.createdAt || 0;
    const bTime = b.messages.at(-1)?.createdAt || 0;
    return bTime - aTime;
  });
}

export async function loadReplyThreads() {
  if (!databaseEnabled) return [];
  const user = await ensureSession();
  const { data, error } = await supabase
    .from('replies')
    .select(replySelect)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return groupThreads(data, user.id);
}

export async function sendDatabaseReply({ momentId, receiverId, body }) {
  if (!databaseEnabled) return null;
  const user = await ensureSession();
  const { data, error } = await supabase.from('replies').insert({
    moment_id: momentId,
    sender_id: user.id,
    receiver_id: receiverId,
    body,
  }).select('id, created_at').single();
  if (error) throw error;
  return { id: data.id, body, sender: 'me', createdAt: new Date(data.created_at).getTime(), readAt: null };
}

export async function markDatabaseThreadRead(momentId, otherId) {
  if (!databaseEnabled) return;
  const user = await ensureSession();
  const { error } = await supabase
    .from('replies')
    .update({ read_at: new Date().toISOString() })
    .eq('moment_id', momentId)
    .eq('sender_id', otherId)
    .eq('receiver_id', user.id)
    .is('read_at', null);
  if (error) throw error;
}
