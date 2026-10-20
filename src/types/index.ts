export type HipHopDiscipline = 
  | 'mc'
  | 'dj'
  | 'breaking'
  | 'graffiti'
  | 'beatmaking'
  | 'produccion'
  | 'colectivo'
  | 'aficionado';

export type UserRole = 'user' | 'moderator' | 'admin' | 'super_admin';

export interface CryptoWalletInfo {
  btc?: string;
  eth?: string;
  sol?: string;
  usdt?: string;
}

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
  location?: string;
  website?: string;
  portfolio_url?: string;
  artistic_disciplines?: string;
  role: UserRole;
  is_banned: boolean;
  verified_artist?: boolean;
  wallet_addresses?: CryptoWalletInfo;
  created_at: string;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
}

export type ContentProvider = 
  | 'youtube'
  | 'spotify'
  | 'soundcloud'
  | 'instagram'
  | 'tiktok'
  | 'vimeo'
  | 'bandcamp'
  | 'generic';

export type ContentType = 'music' | 'video' | 'visual_art' | 'link';

export interface PostMetadata {
  id?: string;
  post_id?: string;
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
  description?: string;
  embed_url?: string;
  provider?: ContentProvider;
  raw_metadata?: Record<string, any>;
}

export interface Post {
  id: string;
  user_id: string;
  external_url: string;
  normalized_url?: string;
  provider: ContentProvider;
  content_type: ContentType;
  description: string;
  tags: string[];
  likes_count: number;
  comments_count: number;
  is_hidden: boolean;
  created_at: string;
  updated_at?: string;
  author: Profile;
  metadata?: PostMetadata;
  user_has_liked?: boolean;
  user_has_bookmarked?: boolean;
  crypto_tips_total?: number;
  crypto_tips_count?: number;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  is_hidden: boolean;
  created_at: string;
  author: Profile;
}

export interface Reaction {
  id: string;
  post_id: string;
  user_id: string;
  type: string;
  created_at: string;
}

export interface Bookmark {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface HipHopEvent {
  id: string;
  organizer_id: string;
  title: string;
  slug: string;
  description: string;
  flyer_url?: string;
  start_date: string;
  end_date?: string;
  timezone: string;
  location: string;
  is_online: boolean;
  organizer_name: string;
  ticket_url?: string;
  tags: string[];
  created_at: string;
  organizer?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: 'like' | 'comment' | 'follow' | 'event' | 'mention';
  post_id?: string;
  read: boolean;
  created_at: string;
  actor: Profile;
  post?: Post;
}

export interface Report {
  id: string;
  reporter_id: string;
  target_type: 'post' | 'comment' | 'user';
  target_id: string;
  reason: string;
  details?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  resolved_by?: string;
  created_at: string;
  reporter?: Profile;
  target_summary?: string;
}

export interface Contribution {
  id: string;
  user_id?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  provider: string;
  transaction_id?: string;
  donor_name?: string;
  is_anonymous: boolean;
  created_at: string;
}

export interface CryptoTip {
  id: string;
  post_id: string;
  sender_id?: string;
  sender_username?: string;
  recipient_id: string;
  recipient_username: string;
  amount_usd: number;
  crypto_amount: number;
  currency: 'USDT' | 'SOL' | 'ETH' | 'BTC';
  tx_hash: string;
  message?: string;
  created_at: string;
}

export interface RadioStation {
  id: string;
  name: string;
  tagline: string;
  stream_url: string;
  genre: string;
  current_track: {
    title: string;
    artist: string;
    album_art?: string;
  };
  listeners_count: number;
  is_live: boolean;
}

export type FeedFilter = 'para_ti' | 'reciente' | 'popular';
