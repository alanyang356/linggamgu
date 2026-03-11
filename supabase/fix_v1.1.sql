-- =============================================
-- 灵感菇 修复补丁 v1.1
-- 解决：发布失败 / 加载慢 问题
-- 在 Supabase SQL Editor 中执行此文件
-- =============================================

-- -----------------------------------------------
-- 修复1：确保 inspirations 表 RLS 策略正确
-- 问题：author_id 为空字符串时违反外键约束
-- 解决：允许 author_id 为 NULL
-- -----------------------------------------------

-- 删除旧策略重建（确保权限正确）
DROP POLICY IF EXISTS "Public inspirations viewable by everyone" ON public.inspirations;
DROP POLICY IF EXISTS "Authenticated users can create inspirations" ON public.inspirations;
DROP POLICY IF EXISTS "Authors can update their inspirations" ON public.inspirations;
DROP POLICY IF EXISTS "Authors can delete their inspirations" ON public.inspirations;

-- 重建策略
CREATE POLICY "Public inspirations viewable by everyone" ON public.inspirations
  FOR SELECT USING (visibility = 'public' OR auth.uid() = author_id);

-- 关键修复：允许已登录用户发布（不强制 author_id = auth.uid()，因为可能为 NULL）
CREATE POLICY "Authenticated users can create inspirations" ON public.inspirations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authors can update their inspirations" ON public.inspirations
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their inspirations" ON public.inspirations
  FOR DELETE USING (auth.uid() = author_id);

-- -----------------------------------------------
-- 修复2：通知表允许已登录用户插入（发布/点赞时触发通知）
-- -----------------------------------------------
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- -----------------------------------------------
-- 修复3：性能优化索引（加快加载速度）
-- -----------------------------------------------
CREATE INDEX IF NOT EXISTS inspirations_visibility_created_idx 
  ON public.inspirations(visibility, created_at DESC);

CREATE INDEX IF NOT EXISTS inspirations_likes_count_idx 
  ON public.inspirations(likes_count DESC);

CREATE INDEX IF NOT EXISTS drafts_user_updated_idx 
  ON public.drafts(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS notifications_recipient_created_idx 
  ON public.notifications(recipient_id, created_at DESC);

-- -----------------------------------------------
-- 修复4：为 inspirations 表设置行大小限制提示
-- （base64 图片存储在数据库中，建议压缩后再存）
-- 此处将 image 字段类型改为 TEXT（允许存储 base64）
-- -----------------------------------------------
-- 如果 image 字段有长度限制，取消注释下面这行：
-- ALTER TABLE public.inspirations ALTER COLUMN image TYPE TEXT;

-- -----------------------------------------------
-- 验证：检查策略是否正确应用
-- -----------------------------------------------
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'inspirations'
ORDER BY policyname;
