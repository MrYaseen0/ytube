-- ============================================================
-- YTUBE demo seed data
-- Run AFTER schema.sql in the Supabase Dashboard -> SQL Editor.
-- 6 demo channels + 10 demo videos (public sample MP4s).
-- Idempotent: safe to re-run.
-- ============================================================

-- Demo channels (fixed UUIDs so videos can reference them)
INSERT INTO public.profiles (id, username, avatar_url) VALUES
  ('11111111-1111-4111-8111-111111111111', 'EduLearn',  NULL),
  ('22222222-2222-4222-8222-222222222222', 'GameZone',  NULL),
  ('33333333-3333-4333-8333-333333333333', 'Music Hub', NULL),
  ('44444444-4444-4434-8434-444444444444', 'News Now',  NULL),
  ('55555555-5555-4535-8535-555555555555', 'SportZone', NULL),
  ('66666666-6666-4636-8636-666666666666', 'Tech Daily', NULL)
ON CONFLICT (id) DO NOTHING;

-- Demo videos (fixed UUIDs so re-running the seed changes nothing)
INSERT INTO public.videos
  (id, user_id, title, description, video_url, thumbnail_url, duration, views, category, status, created_at)
VALUES
  (
    'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1',
    '11111111-1111-4111-8111-111111111111',
    'Big Buck Bunny - Learn 3D Animation Basics',
    'A beginner-friendly breakdown of how the classic open-source short Big Buck Bunny was made. We cover modeling, rigging, lighting and rendering so you can start your own 3D animation journey.',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'https://picsum.photos/seed/ytube1/640/360',
    596, 128400, 'Education', 'published', now() - interval '6 days'
  ),
  (
    'a2a2a2a2-a2a2-42a2-82a2-a2a2a2a2a2a2',
    '11111111-1111-4111-8111-111111111111',
    'Elephants Dream: Open Movie Masterclass',
    'Elephants Dream was the first open movie ever made. In this masterclass we walk through the full production pipeline - story, animatic, shading and compositing - all with free tools.',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'https://picsum.photos/seed/ytube2/640/360',
    653, 84200, 'Education', 'published', now() - interval '12 days'
  ),
  (
    'b1b1b1b1-b1b1-41b1-81b1-b1b1b1b1b1b1',
    '22222222-2222-4222-8222-222222222222',
    'Tears of Steel - Epic Sci-Fi Short Film',
    'Our full reaction and breakdown of the legendary sci-fi short Tears of Steel. Robots, Amsterdam, and one of the most ambitious VFX shots in open-film history.',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    'https://picsum.photos/seed/ytube3/640/360',
    734, 256700, 'Gaming', 'published', now() - interval '3 days'
  ),
  (
    'b2b2b2b2-b2b2-42b2-82b2-b2b2b2b2b2b2',
    '22222222-2222-4222-8222-222222222222',
    'Sintel - Fantasy Adventure Short Film',
    'Sintel is still one of the best fantasy shorts ever rendered on a computer. Join us as we revisit the story, the dragon, and the ending nobody forgets.',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    'https://picsum.photos/seed/ytube4/640/360',
    888, 198300, 'Gaming', 'published', now() - interval '9 days'
  ),
  (
    'c1c1c1c1-c1c1-41c1-81c1-c1c1c1c1c1c1',
    '66666666-6666-4636-8636-666666666666',
    'Volkswagen GTI - Full In-Depth Review',
    'We spent a week with the GTI to answer one question: is it still the hot-hatch king? Performance numbers, interior tech, daily driving impressions and our final verdict.',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
    'https://picsum.photos/seed/ytube5/640/360',
    616, 95400, 'Tech', 'published', now() - interval '5 days'
  ),
  (
    'c2c2c2c2-c2c2-42c2-82c2-c2c2c2c2c2c2',
    '66666666-6666-4636-8636-666666666666',
    'For Bigger Escapes - Top 10 Travel Gadgets',
    'Packing for your next trip? These are the 10 gadgets we never travel without - from universal adapters to pocket drones. Links in the description.',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'https://picsum.photos/seed/ytube6/640/360',
    15, 45200, 'Tech', 'published', now() - interval '2 days'
  ),
  (
    'd1d1d1d1-d1d1-41d1-81d1-d1d1d1d1d1d1',
    '33333333-3333-4333-8333-333333333333',
    'For Bigger Fun - Official Music Video',
    'The official music video for our new single "For Bigger Fun". Stream it everywhere now and let us know your favorite shot in the comments.',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    'https://picsum.photos/seed/ytube7/640/360',
    60, 312800, 'Music', 'published', now() - interval '1 day'
  ),
  (
    'd2d2d2d2-d2d2-42d2-82d2-d2d2d2d2d2d2',
    '33333333-3333-4333-8333-333333333333',
    'For Bigger Joyrides - Live Studio Session',
    'An intimate live studio session recording of "For Bigger Joyrides". One take, no overdubs - just the band and the song.',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    'https://picsum.photos/seed/ytube8/640/360',
    15, 67800, 'Music', 'published', now() - interval '8 days'
  ),
  (
    'e1e1e1e1-e1e1-41e1-81e1-e1e1e1e1e1e1',
    '55555555-5555-4535-8535-555555555555',
    'For Bigger Meltdowns - Extreme Sports Fails',
    'The wildest extreme sports fails caught on camera this month. Remember: these athletes are professionals - do not try this at home.',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    'https://picsum.photos/seed/ytube9/640/360',
    15, 149600, 'Sports', 'published', now() - interval '4 days'
  ),
  (
    'f1f1f1f1-f1f1-41f1-81f1-f1f1f1f1f1f1',
    '44444444-4444-4434-8434-444444444444',
    'For Bigger Blazes - Weekly News Roundup',
    'Your 60-second briefing on the biggest stories of the week - tech, culture and everything in between. New roundup every Friday.',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://picsum.photos/seed/ytube10/640/360',
    15, 52100, 'News', 'published', now() - interval '1 day'
  )
ON CONFLICT (id) DO NOTHING;
