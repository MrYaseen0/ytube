import type { Profile, Video } from "./types";

// Demo content used when Supabase env keys are not configured,
// so the UI is viewable instantly. Mirrors supabase/seed.sql.

const GTV = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample";

function channel(id: string, username: string): Profile {
  return { id, username, avatar_url: null, is_admin: false, created_at: new Date().toISOString() };
}

const EDU = channel("11111111-1111-4111-8111-111111111111", "EduLearn");
const GAMING = channel("22222222-2222-4222-8222-222222222222", "GameZone");
const MUSIC = channel("33333333-3333-4333-8333-333333333333", "Music Hub");
const NEWS = channel("44444444-4444-4434-8434-444444444444", "News Now");
const SPORTS = channel("55555555-5555-4535-8535-555555555555", "SportZone");
const TECH = channel("66666666-6666-4636-8636-666666666666", "Tech Daily");

const daysAgo = (n: number) =>
  new Date(Date.now() - n * 24 * 3600 * 1000).toISOString();

export const DEMO_CHANNELS: Profile[] = [EDU, GAMING, MUSIC, NEWS, SPORTS, TECH];

export const DEMO_VIDEOS: Video[] = [
  {
    id: "demo-1",
    user_id: EDU.id,
    title: "Big Buck Bunny - Learn 3D Animation Basics",
    description: "A beginner-friendly breakdown of how the classic open-source short Big Buck Bunny was made.",
    video_url: `${GTV}/BigBuckBunny.mp4`,
    thumbnail_url: "https://picsum.photos/seed/ytube1/640/360",
    duration: 596, views: 128400, category: "Education", status: "published",
    created_at: daysAgo(6), profiles: EDU,
  },
  {
    id: "demo-2",
    user_id: EDU.id,
    title: "Elephants Dream: Open Movie Masterclass",
    description: "The first open movie ever made - full production pipeline walkthrough with free tools.",
    video_url: `${GTV}/ElephantsDream.mp4`,
    thumbnail_url: "https://picsum.photos/seed/ytube2/640/360",
    duration: 653, views: 84200, category: "Education", status: "published",
    created_at: daysAgo(12), profiles: EDU,
  },
  {
    id: "demo-3",
    user_id: GAMING.id,
    title: "Tears of Steel - Epic Sci-Fi Short Film",
    description: "Our full reaction and breakdown of the legendary sci-fi short Tears of Steel.",
    video_url: `${GTV}/TearsOfSteel.mp4`,
    thumbnail_url: "https://picsum.photos/seed/ytube3/640/360",
    duration: 734, views: 256700, category: "Gaming", status: "published",
    created_at: daysAgo(3), profiles: GAMING,
  },
  {
    id: "demo-4",
    user_id: GAMING.id,
    title: "Sintel - Fantasy Adventure Short Film",
    description: "Revisiting the story, the dragon, and the ending nobody forgets.",
    video_url: `${GTV}/Sintel.mp4`,
    thumbnail_url: "https://picsum.photos/seed/ytube4/640/360",
    duration: 888, views: 198300, category: "Gaming", status: "published",
    created_at: daysAgo(9), profiles: GAMING,
  },
  {
    id: "demo-5",
    user_id: TECH.id,
    title: "Volkswagen GTI - Full In-Depth Review",
    description: "A week with the GTI: performance numbers, interior tech and our final verdict.",
    video_url: `${GTV}/VolkswagenGTIReview.mp4`,
    thumbnail_url: "https://picsum.photos/seed/ytube5/640/360",
    duration: 616, views: 95400, category: "Tech", status: "published",
    created_at: daysAgo(5), profiles: TECH,
  },
  {
    id: "demo-6",
    user_id: TECH.id,
    title: "For Bigger Escapes - Top 10 Travel Gadgets",
    description: "The 10 gadgets we never travel without.",
    video_url: `${GTV}/ForBiggerEscapes.mp4`,
    thumbnail_url: "https://picsum.photos/seed/ytube6/640/360",
    duration: 15, views: 45200, category: "Tech", status: "published",
    created_at: daysAgo(2), profiles: TECH,
  },
  {
    id: "demo-7",
    user_id: MUSIC.id,
    title: "For Bigger Fun - Official Music Video",
    description: "The official music video for our new single.",
    video_url: `${GTV}/ForBiggerFun.mp4`,
    thumbnail_url: "https://picsum.photos/seed/ytube7/640/360",
    duration: 60, views: 312800, category: "Music", status: "published",
    created_at: daysAgo(1), profiles: MUSIC,
  },
  {
    id: "demo-8",
    user_id: MUSIC.id,
    title: "For Bigger Joyrides - Live Studio Session",
    description: "One take, no overdubs - just the band and the song.",
    video_url: `${GTV}/ForBiggerJoyrides.mp4`,
    thumbnail_url: "https://picsum.photos/seed/ytube8/640/360",
    duration: 15, views: 67800, category: "Music", status: "published",
    created_at: daysAgo(8), profiles: MUSIC,
  },
  {
    id: "demo-9",
    user_id: SPORTS.id,
    title: "For Bigger Meltdowns - Extreme Sports Fails",
    description: "The wildest extreme sports fails caught on camera this month.",
    video_url: `${GTV}/ForBiggerMeltdowns.mp4`,
    thumbnail_url: "https://picsum.photos/seed/ytube9/640/360",
    duration: 15, views: 149600, category: "Sports", status: "published",
    created_at: daysAgo(4), profiles: SPORTS,
  },
  {
    id: "demo-10",
    user_id: NEWS.id,
    title: "For Bigger Blazes - Weekly News Roundup",
    description: "Your 60-second briefing on the biggest stories of the week.",
    video_url: `${GTV}/ForBiggerBlazes.mp4`,
    thumbnail_url: "https://picsum.photos/seed/ytube10/640/360",
    duration: 15, views: 52100, category: "News", status: "published",
    created_at: daysAgo(1), profiles: NEWS,
  },
];
