-- =============================================
-- 灵感菇 (Linggamgu) - Supabase Schema
-- Run this in your Supabase SQL editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS (extends Supabase auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '灵感播种人',
  avatar TEXT DEFAULT 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
  bio TEXT,
  planted_count INTEGER DEFAULT 0,
  harvested_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INSPIRATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS public.inspirations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  image TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_avatar TEXT NOT NULL,
  content TEXT DEFAULT '',
  quote TEXT DEFAULT '',
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  collections_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- COMMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspiration_id UUID REFERENCES public.inspirations(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_avatar TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- LIKES
-- =============================================
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspiration_id UUID REFERENCES public.inspirations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(inspiration_id, user_id)
);

-- =============================================
-- COLLECTIONS (bookmarks)
-- =============================================
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspiration_id UUID REFERENCES public.inspirations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(inspiration_id, user_id)
);

-- =============================================
-- FOLLOWS
-- =============================================
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- =============================================
-- DRAFTS
-- =============================================
CREATE TABLE IF NOT EXISTS public.drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT DEFAULT '未命名的灵感',
  content TEXT DEFAULT '',
  image TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  location TEXT,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- NOTIFICATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'collect')),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  actor_avatar TEXT NOT NULL,
  target_id UUID,
  target_title TEXT,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MESSAGES (Chat)
-- =============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES for performance
-- =============================================
CREATE INDEX IF NOT EXISTS inspirations_author_id_idx ON public.inspirations(author_id);
CREATE INDEX IF NOT EXISTS inspirations_visibility_idx ON public.inspirations(visibility);
CREATE INDEX IF NOT EXISTS inspirations_created_at_idx ON public.inspirations(created_at DESC);
CREATE INDEX IF NOT EXISTS comments_inspiration_id_idx ON public.comments(inspiration_id);
CREATE INDEX IF NOT EXISTS notifications_recipient_id_idx ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS messages_sender_recipient_idx ON public.messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS likes_user_id_idx ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS collections_user_id_idx ON public.collections(user_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspirations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, only owner can write
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Inspirations: public ones visible to all, private only to owner
CREATE POLICY "Public inspirations viewable by everyone" ON public.inspirations
  FOR SELECT USING (visibility = 'public' OR auth.uid() = author_id);
-- Allow any logged-in user to create inspirations
-- (author_id is set by the app, may differ if profile load is still in progress)
CREATE POLICY "Authenticated users can create inspirations" ON public.inspirations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authors can update their inspirations" ON public.inspirations
  FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete their inspirations" ON public.inspirations
  FOR DELETE USING (auth.uid() = author_id);

-- Comments: viewable by all, writable by authenticated
CREATE POLICY "Comments viewable by everyone" ON public.comments
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can delete their comments" ON public.comments
  FOR DELETE USING (auth.uid() = author_id);

-- Likes: viewable by all, managed by user
CREATE POLICY "Likes viewable by everyone" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users can like" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- Collections: viewable by all, managed by user
CREATE POLICY "Collections viewable by everyone" ON public.collections FOR SELECT USING (true);
CREATE POLICY "Users can collect" ON public.collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can uncollect" ON public.collections FOR DELETE USING (auth.uid() = user_id);

-- Follows: viewable by all, managed by user
CREATE POLICY "Follows viewable by everyone" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Drafts: only owner can see and manage
CREATE POLICY "Users can view their own drafts" ON public.drafts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create drafts" ON public.drafts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their drafts" ON public.drafts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their drafts" ON public.drafts
  FOR DELETE USING (auth.uid() = user_id);

-- Notifications: only recipient can see
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = recipient_id);
CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can mark their notifications as read" ON public.notifications
  FOR UPDATE USING (auth.uid() = recipient_id);

-- Messages: sender and recipient can see
CREATE POLICY "Users can view their messages" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Authenticated users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', '灵感播种人'),
    COALESCE(NEW.raw_user_meta_data->>'avatar', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_inspirations_updated_at BEFORE UPDATE ON public.inspirations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_drafts_updated_at BEFORE UPDATE ON public.drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- SEED DATA (optional demo content)
-- =============================================
-- Note: Insert seed data AFTER creating a user through auth,
-- then replace 'YOUR_USER_ID' with the actual UUID from auth.users

-- INSERT INTO public.inspirations (title, description, image, tags, author_id, author_name, author_avatar, likes_count, comments_count, collections_count, content, quote)
-- VALUES 
-- ('极简禅意', '在简约与温暖的木质纹理中寻找宁静，享受一个安静的下午。',
--  'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=800&q=80',
--  ARRAY['#设计', '#家居'], 'YOUR_USER_ID', 'lin_design',
--  'https://api.dicebear.com/7.x/avataaars/svg?seed=Lin', 124, 12, 45,
--  '光线温柔地穿过古老的树木，照亮了下方隐藏的小世界。',
--  '万物皆有裂痕，那是光照进来的地方。');
