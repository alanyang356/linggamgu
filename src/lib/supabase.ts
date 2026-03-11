import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          avatar: string;
          bio: string | null;
          planted_count: number;
          harvested_count: number;
          following_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      inspirations: {
        Row: {
          id: string;
          title: string;
          description: string;
          image: string;
          tags: string[];
          author_id: string | null;
          author_name: string;
          author_avatar: string;
          content: string;
          quote: string;
          visibility: 'public' | 'private';
          likes_count: number;
          comments_count: number;
          collections_count: number;
          created_at: string;
          updated_at: string;
        };
      };
      drafts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          image: string;
          tags: string[];
          location: string | null;
          visibility: 'public' | 'private';
          created_at: string;
          updated_at: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          type: 'like' | 'comment' | 'follow' | 'collect';
          actor_id: string | null;
          actor_name: string;
          actor_avatar: string;
          target_id: string | null;
          target_title: string | null;
          content: string;
          is_read: boolean;
          created_at: string;
        };
      };
    };
  };
};
