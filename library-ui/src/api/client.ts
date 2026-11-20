import type { Book, BookPayload, CategoryCount } from '../types';
import { INITIAL_BOOKS } from '../data/initialBooks';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';
const STORAGE_KEY = 'bibliotheca_books_v1';

const isLocalHost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

let useLocalMode = !isLocalHost;

function readLocalBooks(): Book[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore corrupted storage
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_BOOKS));
  return [...INITIAL_BOOKS];
}

function writeLocalBooks(books: Book[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

function computeCategories(books: Book[]): CategoryCount[] {
  const counts = new Map<string, number>();
  for (const b of books) {
    const cat = b.category || 'Παγκόσμια Λογοτεχνία';
    counts.set(cat, (counts.get(cat) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'el'));
}

async function handleResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || fallbackMessage);
  }
  return response.json();
}

export const api = {
  getBooks: async (params?: {
    search?: string;
    category?: string;
    status?: string;
    favorite?: boolean;
  }): Promise<Book[]> => {
    if (!useLocalMode) {
      try {
        const qs = new URLSearchParams();
        if (params?.search?.trim()) qs.set('search', params.search.trim());
        if (params?.category?.trim()) qs.set('category', params.category.trim());
        if (params?.status?.trim()) qs.set('status', params.status.trim());
        if (params?.favorite) qs.set('favorite', 'true');
        const query = qs.toString() ? `?${qs.toString()}` : '';
        const response = await fetch(`${BASE_URL}/books${query}`);
        return await handleResponse<Book[]>(response, 'Αποτυχία φόρτωσης βιβλίων');
      } catch {
        // Fallback smoothly to offline local storage if backend is unreachable
        useLocalMode = true;
      }
    }

    let books = readLocalBooks();
    if (params?.category?.trim()) {
      books = books.filter((b) => b.category === params.category?.trim());
    }
    if (params?.status?.trim()) {
      books = books.filter((b) => b.status === params.status?.trim());
    }
    if (params?.favorite) {
      books = books.filter((b) => b.is_favorite);
    }
    if (params?.search?.trim()) {
      const q = params.search.trim().toLowerCase();
      books = books.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          (b.notes || '').toLowerCase().includes(q)
      );
    }
    return books;
  },

  getCategories: async (): Promise<CategoryCount[]> => {
    if (!useLocalMode) {
      try {
        const response = await fetch(`${BASE_URL}/categories`);
        return await handleResponse<CategoryCount[]>(response, 'Αποτυχία φόρτωσης κατηγοριών');
      } catch {
        useLocalMode = true;
      }
    }
    return computeCategories(readLocalBooks());
  },

  createBook: async (book: BookPayload): Promise<{ message: string; book: Book }> => {
    if (!useLocalMode) {
      try {
        const response = await fetch(`${BASE_URL}/books`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(book),
        });
        return await handleResponse(response, 'Αποτυχία προσθήκης βιβλίου');
      } catch {
        useLocalMode = true;
      }
    }

    const books = readLocalBooks();
    const maxId = books.reduce((m, b) => Math.max(m, b.id), 0);
    const created: Book = { ...book, id: maxId + 1 };
    writeLocalBooks([created, ...books]);
    return { message: 'Το βιβλίο προστέθηκε με επιτυχία', book: created };
  },

  updateBook: async (bookId: number, book: BookPayload): Promise<{ message: string; book: Book }> => {
    if (!useLocalMode) {
      try {
        const response = await fetch(`${BASE_URL}/books/${bookId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(book),
        });
        return await handleResponse(response, 'Αποτυχία ενημέρωσης βιβλίου');
      } catch {
        useLocalMode = true;
      }
    }

    const books = readLocalBooks();
    const updated: Book = { ...book, id: bookId };
    writeLocalBooks(books.map((b) => (b.id === bookId ? updated : b)));
    return { message: 'Το βιβλίο ενημερώθηκε με επιτυχία', book: updated };
  },

  deleteBook: async (bookId: number): Promise<{ message: string }> => {
    if (!useLocalMode) {
      try {
        const response = await fetch(`${BASE_URL}/books/${bookId}`, {
          method: 'DELETE',
        });
        return await handleResponse(response, 'Αποτυχία διαγραφής βιβλίου');
      } catch {
        useLocalMode = true;
      }
    }

    const books = readLocalBooks();
    writeLocalBooks(books.filter((b) => b.id !== bookId));
    return { message: 'Το βιβλίο διαγράφηκε με επιτυχία' };
  },
};
