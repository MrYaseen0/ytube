-- ============================================================
-- YTUBE database schema
-- Run this in the Supabase Dashboard -> SQL Editor (one go).
-- Idempotent: safe to re-run.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- Tables
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  username TEXT NOT NULL,
  avatar_url TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'Education',
  status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('published', 'pending', 'removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS videos_user_id_idx ON public.videos(user_id);
CREATE INDEX IF NOT EXISTS videos_status_idx ON public.videos(status);
CREATE INDEX IF NOT EXISTS videos_created_idx ON public.videos(created_at DESC);

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS comments_video_idx ON public.comments(video_id);

CREATE TABLE IF NOT EXISTS public.likes (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  value SMALLINT NOT NULL CHECK (value IN (1, -1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, video_id)
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  subscriber_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (subscriber_id, channel_id),
  CHECK (subscriber_id <> channel_id)
);

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports(status);

CREATE TABLE IF NOT EXISTS public.watch_history (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  watched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, video_id)
);

-- ------------------------------------------------------------
-- Auto-create a profile row whenever a new auth user signs up
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'username', ''), split_part(NEW.email, '@', 1)),
    NULL
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------
-- Admin check helper (SECURITY DEFINER avoids RLS recursion)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;

-- profiles
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admins update any profile" ON public.profiles;
CREATE POLICY "Admins update any profile" ON public.profiles FOR UPDATE USING (public.is_admin());

-- videos
DROP POLICY IF EXISTS "Public read published videos" ON public.videos;
CREATE POLICY "Public read published videos" ON public.videos FOR SELECT
  USING (status = 'published' OR auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Authenticated insert own videos" ON public.videos;
CREATE POLICY "Authenticated insert own videos" ON public.videos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
DROP POLICY IF EXISTS "Owners and admins update videos" ON public.videos;
CREATE POLICY "Owners and admins update videos" ON public.videos FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Owners and admins delete videos" ON public.videos;
CREATE POLICY "Owners and admins delete videos" ON public.videos FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin());

-- comments
DROP POLICY IF EXISTS "Public read comments" ON public.comments;
CREATE POLICY "Public read comments" ON public.comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated insert own comments" ON public.comments;
CREATE POLICY "Authenticated insert own comments" ON public.comments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
DROP POLICY IF EXISTS "Owners and admins manage comments" ON public.comments;
CREATE POLICY "Owners and admins manage comments" ON public.comments FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Owners and admins delete comments" ON public.comments;
CREATE POLICY "Owners and admins delete comments" ON public.comments FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin());

-- likes
DROP POLICY IF EXISTS "Public read likes" ON public.likes;
CREATE POLICY "Public read likes" ON public.likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users manage own likes" ON public.likes;
CREATE POLICY "Users manage own likes" ON public.likes FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- subscriptions
DROP POLICY IF EXISTS "Public read subscriptions" ON public.subscriptions;
CREATE POLICY "Public read subscriptions" ON public.subscriptions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users manage own subscriptions" ON public.subscriptions;
CREATE POLICY "Users manage own subscriptions" ON public.subscriptions FOR ALL
  USING (auth.uid() = subscriber_id) WITH CHECK (auth.uid() = subscriber_id);

-- reports
DROP POLICY IF EXISTS "Reporters and admins read reports" ON public.reports;
CREATE POLICY "Reporters and admins read reports" ON public.reports FOR SELECT
  USING (auth.uid() = reporter_id OR public.is_admin());
DROP POLICY IF EXISTS "Authenticated file reports" ON public.reports;
CREATE POLICY "Authenticated file reports" ON public.reports FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = reporter_id);
DROP POLICY IF EXISTS "Admins update reports" ON public.reports;
CREATE POLICY "Admins update reports" ON public.reports FOR UPDATE USING (public.is_admin());

-- watch_history
DROP POLICY IF EXISTS "Users manage own history" ON public.watch_history;
CREATE POLICY "Users manage own history" ON public.watch_history FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Storage buckets (public read) + policies
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true), ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read video files" ON storage.objects;
CREATE POLICY "Public read video files" ON storage.objects FOR SELECT
  USING (bucket_id = 'videos');
DROP POLICY IF EXISTS "Public read thumbnail files" ON storage.objects;
CREATE POLICY "Public read thumbnail files" ON storage.objects FOR SELECT
  USING (bucket_id = 'thumbnails');

DROP POLICY IF EXISTS "Authenticated upload videos" ON storage.objects;
CREATE POLICY "Authenticated upload videos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated upload thumbnails" ON storage.objects;
CREATE POLICY "Authenticated upload thumbnails" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'thumbnails' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Owners manage own video files" ON storage.objects;
CREATE POLICY "Owners manage own video files" ON storage.objects FOR UPDATE
  USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Owners delete own video files" ON storage.objects;
CREATE POLICY "Owners delete own video files" ON storage.objects FOR DELETE
  USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Owners manage own thumbnail files" ON storage.objects;
CREATE POLICY "Owners manage own thumbnail files" ON storage.objects FOR UPDATE
  USING (bucket_id = 'thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Owners delete own thumbnail files" ON storage.objects;
CREATE POLICY "Owners delete own thumbnail files" ON storage.objects FOR DELETE
  USING (bucket_id = 'thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- Admin-managed site content, categories, audit log
-- (appended 2026-09-21; idempotent: safe to re-run)
-- ============================================================

-- Key/value site content: keys "header", "footer", "home" (JSONB values)
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Video categories, managed from /admin/categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin action audit trail (viewable at /admin/audit)
CREATE TABLE IF NOT EXISTS public.admin_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_audit_created_idx ON public.admin_audit(created_at DESC);

-- Default categories (also guarantees the FK below is satisfiable)
INSERT INTO public.categories (name, slug, sort_order) VALUES
  ('Music', 'music', 1),
  ('Gaming', 'gaming', 2),
  ('Tech', 'tech', 3),
  ('Education', 'education', 4),
  ('News', 'news', 5),
  ('Sports', 'sports', 6),
  ('Entertainment', 'entertainment', 7)
ON CONFLICT (name) DO NOTHING;

-- videos.category becomes a real FK into categories(name)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'videos_category_fkey') THEN
    ALTER TABLE public.videos
      ADD CONSTRAINT videos_category_fkey
      FOREIGN KEY (category) REFERENCES public.categories(name)
      ON UPDATE CASCADE;
  END IF;
END $$;

-- ------------------------------------------------------------
-- RLS for the new tables
-- ------------------------------------------------------------
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit ENABLE ROW LEVEL SECURITY;

-- site_settings: public read, admin-only write
DROP POLICY IF EXISTS "Public read site settings" ON public.site_settings;
CREATE POLICY "Public read site settings" ON public.site_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins write site settings" ON public.site_settings;
CREATE POLICY "Admins write site settings" ON public.site_settings
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- categories: public read, admin-only write
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins write categories" ON public.categories;
CREATE POLICY "Admins write categories" ON public.categories
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- admin_audit: admins only (read the log, append via server actions)
DROP POLICY IF EXISTS "Admins read audit log" ON public.admin_audit;
CREATE POLICY "Admins read audit log" ON public.admin_audit FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Admins write audit log" ON public.admin_audit;
CREATE POLICY "Admins write audit log" ON public.admin_audit FOR INSERT WITH CHECK (public.is_admin());

-- ------------------------------------------------------------
-- Videos: admin-only writes (uploads happen only from /admin/videos)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated insert own videos" ON public.videos;
DROP POLICY IF EXISTS "Admins insert videos" ON public.videos;
CREATE POLICY "Admins insert videos" ON public.videos FOR INSERT
  WITH CHECK (public.is_admin() AND auth.uid() = user_id);
DROP POLICY IF EXISTS "Owners and admins update videos" ON public.videos;
DROP POLICY IF EXISTS "Admins update videos" ON public.videos;
CREATE POLICY "Admins update videos" ON public.videos FOR UPDATE USING (public.is_admin());
DROP POLICY IF EXISTS "Owners and admins delete videos" ON public.videos;
DROP POLICY IF EXISTS "Admins delete videos" ON public.videos;
CREATE POLICY "Admins delete videos" ON public.videos FOR DELETE USING (public.is_admin());

-- ------------------------------------------------------------
-- Storage: only admins may write to the media buckets,
-- with an extension allowlist enforced by RLS.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload videos" ON storage.objects;
CREATE POLICY "Admins upload videos" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'videos'
    AND public.is_admin()
    AND lower(storage.extension(name)) = ANY (ARRAY['mp4','webm','mov','m4v','ogv','avi','mkv'])
  );

DROP POLICY IF EXISTS "Authenticated upload thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload thumbnails" ON storage.objects;
CREATE POLICY "Admins upload thumbnails" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'thumbnails'
    AND public.is_admin()
    AND lower(storage.extension(name)) = ANY (ARRAY['jpg','jpeg','png','gif','webp','avif','svg'])
  );

DROP POLICY IF EXISTS "Owners manage own video files" ON storage.objects;
DROP POLICY IF EXISTS "Admins manage video files" ON storage.objects;
CREATE POLICY "Admins manage video files" ON storage.objects FOR UPDATE
  USING (bucket_id = 'videos' AND public.is_admin());
DROP POLICY IF EXISTS "Owners delete own video files" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete video files" ON storage.objects;
CREATE POLICY "Admins delete video files" ON storage.objects FOR DELETE
  USING (bucket_id = 'videos' AND public.is_admin());

DROP POLICY IF EXISTS "Owners manage own thumbnail files" ON storage.objects;
DROP POLICY IF EXISTS "Admins manage thumbnail files" ON storage.objects;
CREATE POLICY "Admins manage thumbnail files" ON storage.objects FOR UPDATE
  USING (bucket_id = 'thumbnails' AND public.is_admin());
DROP POLICY IF EXISTS "Owners delete own thumbnail files" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete thumbnail files" ON storage.objects;
CREATE POLICY "Admins delete thumbnail files" ON storage.objects FOR DELETE
  USING (bucket_id = 'thumbnails' AND public.is_admin());
