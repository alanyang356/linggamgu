/**
 * api.ts — 灵感菇 Supabase API 封装
 * 替代原来的 Express + SQLite 后端，所有数据操作走 Supabase Client SDK
 */
import { supabase } from './supabase';
import { Inspiration, User, Draft, Notification, Comment } from '../types';

// =============================================
// IMAGE UTILS
// =============================================

/**
 * 压缩 base64 图片到指定最大宽度和质量
 * 解决大图超出 Supabase 请求限制问题
 */
export async function compressImage(
  base64: string,
  maxWidth = 1200,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve) => {
    // 非 base64 直接返回（网络图片URL）
    if (!base64.startsWith('data:image')) {
      resolve(base64);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64); // 失败时原样返回
    img.src = base64;
  });
}

// =============================================
// AUTH
// =============================================

export async function signUp(email: string, password: string, name: string) {
  const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, avatar }
    }
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// =============================================
// PROFILES
// =============================================

export async function getProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    avatar: data.avatar,
    bio: data.bio || undefined,
    stats: {
      planted: data.planted_count,
      harvested: data.harvested_count,
      following: data.following_count,
    }
  };
}

/**
 * 创建或更新 profile（兜底用，防止触发器失败导致 profile 不存在）
 */
export async function upsertProfile(userId: string, name: string, avatar: string): Promise<User> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, name, avatar }, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('upsertProfile error:', error);
    // 返回一个临时对象，让 app 至少能运行
    return { id: userId, name, avatar, stats: { planted: 0, harvested: 0, following: 0 } };
  }

  return {
    id: data.id,
    name: data.name,
    avatar: data.avatar,
    bio: data.bio || undefined,
    stats: {
      planted: data.planted_count,
      harvested: data.harvested_count,
      following: data.following_count,
    }
  };
}

export async function updateProfile(userId: string, updates: { name?: string; avatar?: string; bio?: string }) {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  if (error) throw error;
}

// =============================================
// INSPIRATIONS
// =============================================

export async function getInspirations(
  visibility: 'public' | 'private' | 'all' = 'public',
  page = 0,
  pageSize = 12
): Promise<Inspiration[]> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('inspirations')
    .select('*')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (visibility === 'public') {
    query = query.eq('visibility', 'public');
  } else if (visibility === 'private') {
    query = query.eq('visibility', 'private');
  }
  // 'all' fetches everything (RLS ensures private ones only visible to owner)

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapInspiration);
}

export async function getInspiration(id: string): Promise<Inspiration | null> {
  const { data, error } = await supabase
    .from('inspirations')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return mapInspiration(data);
}

/**
 * 获取指定用户自己发布的所有灵感（公开+私密）
 * 按 author_id 精确匹配，不依赖名字
 */
export async function getMyInspirations(userId: string): Promise<Inspiration[]> {
  const { data, error } = await supabase
    .from('inspirations')
    .select('*')
    .eq('author_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapInspiration);
}

export async function getMatureInspirations(): Promise<Inspiration[]> {
  const { data, error } = await supabase
    .from('inspirations')
    .select('*')
    .eq('visibility', 'public')
    .gte('likes_count', 50)
    .order('likes_count', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapInspiration);
}

export async function createInspiration(inspiration: {
  title: string;
  description: string;
  image: string;
  tags: string[];
  content: string;
  quote: string;
  visibility: 'public' | 'private';
  author: { id: string; name: string; avatar: string };
}): Promise<Inspiration> {
  // 压缩图片，防止超出请求体限制
  const compressedImage = inspiration.image
    ? await compressImage(inspiration.image)
    : '';

  const { data, error } = await supabase
    .from('inspirations')
    .insert({
      title: inspiration.title,
      description: inspiration.description,
      image: compressedImage,
      tags: inspiration.tags,
      content: inspiration.content,
      quote: inspiration.quote,
      visibility: inspiration.visibility,
      // author_id 必须是有效 UUID 或 null，不能是空字符串
      author_id: inspiration.author.id || null,
      author_name: inspiration.author.name,
      author_avatar: inspiration.author.avatar,
    })
    .select()
    .single();

  if (error) {
    console.error('createInspiration error:', error.message, error.details, error.hint);
    throw new Error(error.message || '发布失败');
  }

  // 更新播种数：先尝试RPC，失败则手动+1
  if (inspiration.author.id) {
    const rpcOk = await supabase.rpc('increment_planted', { user_id: inspiration.author.id })
      .then(() => true).catch(() => false);
    if (!rpcOk) {
      const { data: p } = await supabase.from('profiles').select('planted_count').eq('id', inspiration.author.id).single();
      if (p) await supabase.from('profiles').update({ planted_count: (p.planted_count || 0) + 1 }).eq('id', inspiration.author.id);
    }
  }

  return mapInspiration(data);
}

export async function getUserInspirations(authorId: string): Promise<Inspiration[]> {
  const { data, error } = await supabase
    .from('inspirations')
    .select('*')
    .eq('author_id', authorId)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapInspiration);
}

export async function setInspirationPrivate(id: string): Promise<void> {
  const { error } = await supabase
    .from('inspirations')
    .update({ visibility: 'private' })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteInspiration(id: string) {
  // 先查作者id，删除后减planted_count
  const { data: insp } = await supabase.from('inspirations').select('author_id').eq('id', id).single();
  const { error } = await supabase.from('inspirations').delete().eq('id', id);
  if (error) throw error;
  // 减播种数
  if (insp?.author_id) {
    const { data: p } = await supabase.from('profiles').select('planted_count').eq('id', insp.author_id).single();
    if (p) await supabase.from('profiles').update({ planted_count: Math.max(0, (p.planted_count || 0) - 1) }).eq('id', insp.author_id);
  }
}

export async function updateInspiration(id: string, updates: {
  title: string;
  description: string;
  content: string;
  image: string;
  tags: string[];
  visibility: 'public' | 'private';
}): Promise<void> {
  const compressedImage = updates.image && updates.image.startsWith('data:image')
    ? await compressImage(updates.image)
    : updates.image;

  const { error } = await supabase
    .from('inspirations')
    .update({
      title: updates.title,
      description: updates.description,
      content: updates.content,
      image: compressedImage,
      tags: updates.tags,
      visibility: updates.visibility,
    })
    .eq('id', id);

  if (error) throw error;
}

// =============================================
// LIKES
// =============================================

export async function likeInspiration(inspirationId: string, userId: string): Promise<boolean> {
  // 用原子RPC函数，一次请求完成toggle+计数更新，避免并发竞争
  const { data, error } = await supabase.rpc('toggle_like', {
    p_inspiration_id: inspirationId,
    p_user_id: userId,
  });
  if (error) throw error;
  return data as boolean;
}

export async function hasLiked(inspirationId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('likes')
    .select('id')
    .eq('inspiration_id', inspirationId)
    .eq('user_id', userId)
    .single();
  return !!data;
}

// =============================================
// COLLECTIONS
// =============================================

export async function collectInspiration(inspirationId: string, userId: string): Promise<boolean> {
  const { data: existing } = await supabase
    .from('collections')
    .select('id')
    .eq('inspiration_id', inspirationId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    await supabase.from('collections').delete()
      .eq('inspiration_id', inspirationId).eq('user_id', userId);
    const { data: insp } = await supabase.from('inspirations').select('collections_count').eq('id', inspirationId).single();
    if (insp) {
      await supabase.from('inspirations').update({ collections_count: Math.max(0, insp.collections_count - 1) }).eq('id', inspirationId);
    }
    return false;
  } else {
    await supabase.from('collections').insert({ inspiration_id: inspirationId, user_id: userId });
    const { data: insp } = await supabase.from('inspirations').select('collections_count').eq('id', inspirationId).single();
    if (insp) {
      await supabase.from('inspirations').update({ collections_count: insp.collections_count + 1 }).eq('id', inspirationId);
    }
    return true;
  }
}

export async function hasCollected(inspirationId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('collections')
    .select('id')
    .eq('inspiration_id', inspirationId)
    .eq('user_id', userId)
    .single();
  return !!data;
}

export async function getUserCollections(userId: string): Promise<Inspiration[]> {
  const { data, error } = await supabase
    .from('collections')
    .select('inspiration_id, inspirations(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || [])
    .map((item: any) => item.inspirations)
    .filter(Boolean)
    .map(mapInspiration);
}

// =============================================
// COMMENTS
// =============================================

export async function getComments(inspirationId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('inspiration_id', inspirationId)
    .is('parent_id', null)
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Fetch replies for each comment
  const commentsWithReplies = await Promise.all(
    (data || []).map(async (comment: any) => {
      const { data: replies } = await supabase
        .from('comments')
        .select('*')
        .eq('parent_id', comment.id)
        .order('created_at', { ascending: true });

      return {
        id: comment.id,
        user: { name: comment.author_name, avatar: comment.author_avatar },
        content: comment.content,
        time: formatRelativeTime(comment.created_at),
        replies: (replies || []).map((r: any) => ({
          id: r.id,
          user: { name: r.author_name, avatar: r.author_avatar },
          content: r.content,
          time: formatRelativeTime(r.created_at),
        }))
      };
    })
  );

  return commentsWithReplies;
}

export async function addComment(params: {
  inspirationId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  parentId?: string;
}): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      inspiration_id: params.inspirationId,
      parent_id: params.parentId || null,
      author_id: params.authorId,
      author_name: params.authorName,
      author_avatar: params.authorAvatar,
      content: params.content,
    })
    .select()
    .single();

  if (error) throw error;

  // Update comments_count
  const { data: insp } = await supabase.from('inspirations').select('comments_count').eq('id', params.inspirationId).single();
  if (insp) {
    await supabase.from('inspirations').update({ comments_count: insp.comments_count + 1 }).eq('id', params.inspirationId);
  }

  return {
    id: data.id,
    user: { name: data.author_name, avatar: data.author_avatar },
    content: data.content,
    time: '刚刚',
  };
}

export async function deleteComment(commentId: string, authorId: string): Promise<void> {
  // 先删除所有回复
  await supabase.from('comments').delete().eq('parent_id', commentId);
  // 再删除评论本身
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('author_id', authorId);
  if (error) throw error;
}

// =============================================
// FOLLOWS
// =============================================

export async function followUser(followerId: string, followingId: string): Promise<boolean> {
  const { data: existing } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single();

  if (existing) {
    await supabase.from('follows').delete()
      .eq('follower_id', followerId).eq('following_id', followingId);
    // Decrement following count
    const { data: profile } = await supabase.from('profiles').select('following_count').eq('id', followerId).single();
    if (profile) {
      await supabase.from('profiles').update({ following_count: Math.max(0, profile.following_count - 1) }).eq('id', followerId);
    }
    return false;
  } else {
    await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId });
    const { data: profile } = await supabase.from('profiles').select('following_count').eq('id', followerId).single();
    if (profile) {
      await supabase.from('profiles').update({ following_count: profile.following_count + 1 }).eq('id', followerId);
    }
    return true;
  }
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const { data } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single();
  return !!data;
}

export async function getFollowingList(userId: string): Promise<User[]> {
  // 第一步：拿到所有 following_id
  const { data: follows, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);

  if (error) throw error;
  if (!follows || follows.length === 0) return [];

  const ids = follows.map((f: any) => f.following_id).filter(Boolean);
  if (ids.length === 0) return [];

  // 第二步：用 in 查询批量拉取 profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', ids);

  if (profilesError) throw profilesError;
  return (profiles || []).map(mapProfile);
}

// =============================================
// DRAFTS
// =============================================

export async function getDrafts(userId: string): Promise<Draft[]> {
  const { data, error } = await supabase
    .from('drafts')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((d: any) => ({
    id: d.id,
    title: d.title,
    content: d.content,
    image: d.image,
    tags: d.tags || [],
    location: d.location || undefined,
    visibility: d.visibility,
    time: new Date(d.updated_at).toLocaleString('zh-CN'),
  }));
}

export async function saveDraft(userId: string, draft: Omit<Draft, 'id'> & { id?: string }): Promise<Draft> {
  if (draft.id) {
    // Update existing
    const { data, error } = await supabase
      .from('drafts')
      .update({
        title: draft.title,
        content: draft.content,
        image: draft.image,
        tags: draft.tags,
        location: draft.location || null,
        visibility: draft.visibility,
      })
      .eq('id', draft.id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return { ...draft, id: data.id, time: new Date(data.updated_at).toLocaleString('zh-CN') };
  } else {
    // Create new
    const { data, error } = await supabase
      .from('drafts')
      .insert({
        user_id: userId,
        title: draft.title,
        content: draft.content,
        image: draft.image,
        tags: draft.tags,
        location: draft.location || null,
        visibility: draft.visibility,
      })
      .select()
      .single();
    if (error) throw error;
    return { ...draft, id: data.id, time: new Date(data.updated_at).toLocaleString('zh-CN') };
  }
}

export async function deleteDraft(draftId: string, userId: string) {
  const { error } = await supabase.from('drafts').delete().eq('id', draftId).eq('user_id', userId);
  if (error) throw error;
}

// =============================================
// NOTIFICATIONS
// =============================================

export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((n: any) => ({
    id: n.id,
    type: n.type,
    user_name: n.actor_name,
    user_avatar: n.actor_avatar,
    target_id: n.target_id,
    target_title: n.target_title,
    content: n.content,
    is_read: n.is_read ? 1 : 0,
    created_at: n.created_at,
  }));
}

export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .eq('is_read', false);

  if (error) return 0;
  return count || 0;
}

export async function markNotificationsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('recipient_id', userId)
    .eq('is_read', false);
  if (error) throw error;
}

export async function createNotification(params: {
  recipientId: string;
  type: 'like' | 'comment' | 'follow' | 'collect';
  actorId: string;
  actorName: string;
  actorAvatar: string;
  targetId?: string;
  targetTitle?: string;
  content: string;
}) {
  // Don't notify yourself
  if (params.recipientId === params.actorId) return;

  await supabase.from('notifications').insert({
    recipient_id: params.recipientId,
    type: params.type,
    actor_id: params.actorId,
    actor_name: params.actorName,
    actor_avatar: params.actorAvatar,
    target_id: params.targetId || null,
    target_title: params.targetTitle || null,
    content: params.content,
  });
}

// =============================================
// MESSAGES
// =============================================

export async function getConversations(userId: string): Promise<{
  user: { id: string; name: string; avatar: string };
  lastMessage: string;
  lastTime: string;
  unread: number;
}[]> {
  // 拉取该用户参与的所有消息，按对话方分组，取最新一条
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  // 找出所有对话方的 ID（去重）
  const otherIds = new Set<string>();
  data.forEach((m: any) => {
    const otherId = m.sender_id === userId ? m.recipient_id : m.sender_id;
    if (otherId) otherIds.add(otherId);
  });

  // 拉取对话方的 profile
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, avatar')
    .in('id', Array.from(otherIds));

  const profileMap: Record<string, { id: string; name: string; avatar: string }> = {};
  (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });

  // 每个对话方取最新一条消息
  const seen = new Set<string>();
  const conversations: {
    user: { id: string; name: string; avatar: string };
    lastMessage: string;
    lastTime: string;
    unread: number;
  }[] = [];

  for (const msg of data) {
    const otherId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
    if (!otherId || seen.has(otherId)) continue;
    seen.add(otherId);
    const profile = profileMap[otherId];
    if (!profile) continue;
    // 统计未读数（对方发给我、且未读的）
    const unread = data.filter(
      (m: any) => m.sender_id === otherId && m.recipient_id === userId && !m.is_read
    ).length;
    conversations.push({
      user: profile,
      lastMessage: msg.content,
      lastTime: msg.created_at,
      unread,
    });
  }

  return conversations;
}

export async function getMessages(userId: string, otherUserId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(
      `and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`
    )
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function sendMessage(senderId: string, recipientId: string, content: string) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ sender_id: senderId, recipient_id: recipientId, content })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function markMessagesRead(userId: string, otherUserId: string): Promise<void> {
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('sender_id', otherUserId)
    .eq('recipient_id', userId)
    .eq('is_read', false);
}

export async function subscribeToMessages(
  userId: string,
  otherUserId: string,
  callback: (message: any) => void
) {
  return supabase
    .channel(`messages:${userId}:${otherUserId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${userId}`,
      },
      (payload) => callback(payload.new)
    )
    .subscribe();
}

// =============================================
// STATS
// =============================================

export async function getStats() {
  const { count: total } = await supabase
    .from('inspirations')
    .select('*', { count: 'exact', head: true })
    .eq('visibility', 'public');

  const { count: mature } = await supabase
    .from('inspirations')
    .select('*', { count: 'exact', head: true })
    .eq('visibility', 'public')
    .gte('likes_count', 50);

  return { total: total || 0, mature: mature || 0 };
}

// =============================================
// HELPERS
// =============================================

function mapInspiration(item: any): Inspiration {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    image: item.image,
    tags: item.tags || [],
    author: {
      id: item.author_id,
      name: item.author_name,
      avatar: item.author_avatar,
    },
    stats: {
      likes: item.likes_count,
      comments: item.comments_count,
      collections: item.collections_count,
    },
    content: item.content,
    quote: item.quote,
    visibility: item.visibility || 'public',
  };
}

function mapProfile(item: any): User {
  return {
    id: item.id,
    name: item.name,
    avatar: item.avatar,
    bio: item.bio || undefined,
    stats: {
      planted: item.planted_count,
      harvested: item.harvested_count,
      following: item.following_count,
    }
  };
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}小时前`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}天前`;
  return date.toLocaleDateString('zh-CN');
}
