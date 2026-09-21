export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface Video {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration: number | null;
  views: number;
  category: string;
  status: string;
  created_at: string;
  profiles: Profile | null;
}

export interface CommentItem {
  id: string;
  video_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles: Profile | null;
}

export interface ReportItem {
  id: string;
  video_id: string;
  reporter_id: string;
  reason: string;
  status: string;
  created_at: string;
  video_title?: string;
  reporter_name?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  sort_order: number;
  created_at: string;
}

export interface AdminAuditItem {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  created_at: string;
  admin_name?: string;
}
