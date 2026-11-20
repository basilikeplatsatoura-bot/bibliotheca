export type BookStatus = 'want_to_read' | 'reading' | 'read';

export interface Book {
  id: number;
  title: string;
  author: string;
  category: string;
  status: BookStatus;
  rating: number;
  is_favorite: boolean;
  notes: string;
  cover_url: string;
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
