import { supabase } from '../lib/supabase';
import { INITIAL_BOOKS } from '../data/initialBooks';
import type { Book, BookPayload, CategoryCount, Profile } from '../types';

export function computeCategories(books: Book[]): CategoryCount[] {
  const counts = new Map<string, number>();
  for (const b of books) {
    const cat = b.category || 'Παγκόσμια Λογοτεχνία';
    counts.set(cat, (counts.get(cat) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'el'));
}

export const api = {
  // ===== Auth & Profile =====
  getProfile: async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },

  ensureProfile: async (
    userId: string,
    usernameHint: string,
    displayNameHint?: string
  ): Promise<Profile> => {
    const existing = await api.getProfile(userId);
    if (existing) return existing;

    const cleanBase =
      usernameHint
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 18) || 'reader';
    const uniqueUsername = `${cleanBase}_${userId.slice(0, 4)}`;

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username: uniqueUsername,
        display_name: displayNameHint || usernameHint || 'Αναγνώστης',
        bio: '',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  createProfile: async (
    userId: string,
    username: string,
    displayName: string
  ): Promise<Profile> => {
    const cleanUsername = username.trim().toLowerCase().replace(/^@+/, '');
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        username: cleanUsername,
        display_name: displayName.trim() || cleanUsername,
        bio: '',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Αυτό το username χρησιμοποιείται ήδη. Διάλεξε ένα άλλο!');
      }
      throw new Error(error.message);
    }
    return data;
  },

  // ===== Books CRUD =====
  getUserBooks: async (userId: string): Promise<Book[]> => {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', userId)
      .order('id', { ascending: false });
    if (error) throw new Error('Αποτυχία φόρτωσης βιβλίων: ' + error.message);
    return (data || []) as Book[];
  },

  createBook: async (userId: string, book: BookPayload): Promise<Book> => {
    const { data, error } = await supabase
      .from('books')
      .insert({
        user_id: userId,
        title: book.title,
        author: book.author,
        category: book.category,
        status: book.status,
        rating: book.rating,
        is_favorite: book.is_favorite,
        notes: book.notes,
        cover_url: book.cover_url,
      })
      .select()
      .single();
    if (error) throw new Error('Αποτυχία προσθήκης βιβλίου: ' + error.message);
    return data as Book;
  },

  updateBook: async (bookId: number, book: BookPayload): Promise<Book> => {
    const { data, error } = await supabase
      .from('books')
      .update({
        title: book.title,
        author: book.author,
        category: book.category,
        status: book.status,
        rating: book.rating,
        is_favorite: book.is_favorite,
        notes: book.notes,
        cover_url: book.cover_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookId)
      .select()
      .single();
    if (error) throw new Error('Αποτυχία ενημέρωσης βιβλίου: ' + error.message);
    return data as Book;
  },

  deleteBook: async (bookId: number): Promise<void> => {
    const { error } = await supabase.from('books').delete().eq('id', bookId);
    if (error) throw new Error('Αποτυχία διαγραφής βιβλίου: ' + error.message);
  },

  importMyCollection: async (userId: string): Promise<number> => {
    const rows = INITIAL_BOOKS.map((b) => ({
      user_id: userId,
      title: b.title,
      author: b.author,
      category: b.category,
      status: b.status,
      rating: b.rating,
      is_favorite: b.is_favorite,
      notes: b.notes,
      cover_url: b.cover_url,
    }));
    const { error } = await supabase.from('books').insert(rows);
    if (error) throw new Error('Αποτυχία εισαγωγής συλλογής: ' + error.message);
    return rows.length;
  },

  // ===== Social: Profiles, Follows & Feed =====
  searchProfiles: async (query: string, excludeUserId?: string): Promise<Profile[]> => {
    let req = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    const q = query.trim().replace(/^@+/, '');
    if (q) {
      req = req.or(`username.ilike.%${q}%,display_name.ilike.%${q}%`);
    }
    if (excludeUserId) {
      req = req.neq('id', excludeUserId);
    }

    const { data, error } = await req;
    if (error) throw new Error(error.message);
    return (data || []) as Profile[];
  },

  getFollowStats: async (
    userId: string
  ): Promise<{ followingIds: string[]; followersCount: number; followingCount: number }> => {
    const [followingRes, followersRes] = await Promise.all([
      supabase.from('follows').select('following_id').eq('follower_id', userId),
      supabase
        .from('follows')
        .select('follower_id', { count: 'exact', head: true })
        .eq('following_id', userId),
    ]);

    const followingIds = (followingRes.data || []).map((r) => r.following_id as string);
    return {
      followingIds,
      followingCount: followingIds.length,
      followersCount: followersRes.count || 0,
    };
  },

  followUser: async (myUserId: string, targetUserId: string): Promise<void> => {
    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: myUserId, following_id: targetUserId });
    if (error && error.code !== '23505') throw new Error(error.message);
  },

  unfollowUser: async (myUserId: string, targetUserId: string): Promise<void> => {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', myUserId)
      .eq('following_id', targetUserId);
    if (error) throw new Error(error.message);
  },

  getFollowingFeed: async (followingIds: string[]): Promise<Book[]> => {
    if (followingIds.length === 0) return [];
    const { data, error } = await supabase
      .from('books')
      .select('*, profile:profiles(*)')
      .in('user_id', followingIds)
      .order('updated_at', { ascending: false })
      .limit(40);
    if (error) throw new Error(error.message);
    return (data || []) as Book[];
  },
};
