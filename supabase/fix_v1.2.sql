-- =============================================
-- 灵感菇 修复补丁 v1.2（完整版）
-- 解决：发布失败 / profile 不存在 / 权限问题
-- 在 Supabase SQL Editor 中执行此文件
-- 可以多次执行，幂等安全
-- =============================================

-- -----------------------------------------------
-- 修复1：profiles 表允许用户 upsert 自己的 profile
-- 解决：注册后 profile 不存在导致无法发布
-- -----------------------------------------------
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can upsert their own profile" ON public.profiles;

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- -----------------------------------------------
-- 修复2：inspirations 表 RLS 策略重建
-- 解决：author_id 空字符串 / 权限拒绝
-- -----------------------------------------------
DROP POLICY IF EXISTS "Public inspirations viewable by everyone" ON public.inspirations;
DROP POLICY IF EXISTS "Authenticated users can create inspirations" ON public.inspirations;
DROP POLICY IF EXISTS "Authors can update their inspirations" ON public.inspirations;
DROP POLICY IF EXISTS "Authors can delete their inspirations" ON public.inspirations;

CREATE POLICY "Public inspirations viewable by everyone" ON public.inspirations
  FOR SELECT USING (visibility = 'public' OR auth.uid() = author_id);

-- 关键：只要登录就能发布，不强求 author_id 必须等于 auth.uid()
CREATE POLICY "Authenticated users can create inspirations" ON public.inspirations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authors can update their inspirations" ON public.inspirations
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their inspirations" ON public.inspirations
  FOR DELETE USING (auth.uid() = author_id);

-- -----------------------------------------------
-- 修复3：通知表允许已登录用户插入
-- -----------------------------------------------
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;

CREATE POLICY "Authenticated users can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- -----------------------------------------------
-- 修复4：likes / collections 表允许读写
-- -----------------------------------------------
DROP POLICY IF EXISTS "Likes viewable by everyone" ON public.likes;
DROP POLICY IF EXISTS "Users can like" ON public.likes;
DROP POLICY IF EXISTS "Users can unlike" ON public.likes;

CREATE POLICY "Likes viewable by everyone" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users can like" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON public.likes FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Collections viewable by everyone" ON public.collections;
DROP POLICY IF EXISTS "Users can collect" ON public.collections;
DROP POLICY IF EXISTS "Users can uncollect" ON public.collections;

CREATE POLICY "Collections viewable by everyone" ON public.collections FOR SELECT USING (true);
CREATE POLICY "Users can collect" ON public.collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can uncollect" ON public.collections FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------
-- 修复5：comments 表
-- -----------------------------------------------
DROP POLICY IF EXISTS "Comments viewable by everyone" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can comment" ON public.comments;
DROP POLICY IF EXISTS "Authors can delete their comments" ON public.comments;

CREATE POLICY "Comments viewable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON public.comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authors can delete their comments" ON public.comments
  FOR DELETE USING (auth.uid() = author_id);

-- -----------------------------------------------
-- 性能优化索引（已存在则跳过）
-- -----------------------------------------------
CREATE INDEX IF NOT EXISTS inspirations_visibility_created_idx
  ON public.inspirations(visibility, created_at DESC);

CREATE INDEX IF NOT EXISTS inspirations_likes_count_idx
  ON public.inspirations(likes_count DESC);

CREATE INDEX IF NOT EXISTS notifications_recipient_created_idx
  ON public.notifications(recipient_id, created_at DESC);

-- -----------------------------------------------
-- 验证结果（执行后能看到策略列表说明成功）
-- -----------------------------------------------
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('profiles', 'inspirations', 'notifications', 'likes', 'collections', 'comments')
ORDER BY tablename, cmd;
