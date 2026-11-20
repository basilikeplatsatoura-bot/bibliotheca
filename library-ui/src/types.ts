export type BookStatus = 'want_to_read' | 'reading' | 'read';

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  created_at?: string;
}

export interface Book {
  id: number;
  user_id?: string;
  title: string;
  author: string;
  category: string;
  status: BookStatus;
  rating: number;
  is_favorite: boolean;
  notes: string;
  cover_url: string;
  created_at?: string;
  updated_at?: string;
  profile?: Profile;
}

export interface BookPayload {
  title: string;
  author: string;
  category: string;
  status: BookStatus;
  rating: number;
  is_favorite: boolean;
  notes: string;
  cover_url: string;
}

export interface CategoryCount {
  name: string;
  count: number;
}

export interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error';
}
