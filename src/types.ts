export interface User {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
  stats: {
    planted: number;
    harvested: number;
    following: number;
  };
}

export interface Comment {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  content: string;
  time: string;
  replies?: Comment[];
}

export interface Inspiration {
  id: string;
  title: string;
  description: string;
  image?: string;
  tags: string[];
  author: {
    id?: string;
    name: string;
    avatar: string;
  };
  stats: {
    likes: number;
    comments: number;
    collections: number;
  };
  quote?: string;
  content?: string;
  comments?: Comment[];
  visibility?: 'public' | 'private';
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'collect';
  user_name: string;
  user_avatar: string;
  target_id?: string;
  target_title?: string;
  content: string;
  is_read: number;
  created_at: string;
}

export interface Draft {
  id: string;
  title: string;
  content: string;
  time: string;
  image?: string;
  tags: string[];
  location?: string;
  visibility: 'public' | 'private';
}

export type Screen = 'home' | 'square' | 'create' | 'notifications' | 'messages' | 'profile' | 'detail' | 'settings' | 'collections' | 'drafts' | 'my-inspirations' | 'following-list' | 'user-profile' | 'chat' | 'mature-list';
