export interface UserProfile {
  id: string;
  username: string;
  email: string;
  bio?: string;
  avatar_url?: string;
  role: "user" | "admin";
  created_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  content: string;
  image_url?: string;
  category?: string;
  is_active: boolean;
  created_at: string;
  like_count?: number;
  comment_count?: number;
  author?: UserProfile;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  text: string;
  created_at: string;
  author?: UserProfile;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface SearchUsersParams {
  query: string;
}

export interface SearchPostsParams {
  query: string;
}
