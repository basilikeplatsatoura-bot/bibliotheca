//const BASE_URL = 'http://localhost:5005/api';//
const BASE_URL = 'http://localhost:5005/api';

export const api = {
  // 📚 Φέρνει όλα τα βιβλία (με δυνατότητα αναζήτησης)
  getBooks: async (search = '') => {
    const url = search.trim() !== '' 
      ? `${BASE_URL}/books?search=${encodeURIComponent(search)}` 
      : `${BASE_URL}/books`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Αποτυχία φόρτωσης βιβλίων');
    }
    return response.json();
  },

  // ➕ Προσθήκη νέου βιβλίου
  addBook: async (title: string, author: string, copies: number) => {
    const response = await fetch(`${BASE_URL}/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title,
        author: author,
        total_copies: copies,
      }),
    });

    if (!response.ok) {
      throw new Error('Αποτυχία προσθήκης βιβλίου');
    }
    return response.json();
  },

  // 🤝 Δανεισμός βιβλίου
  borrowBook: async (bookId: number, userName: string) => {
    const response = await fetch(`${BASE_URL}/books/${bookId}/borrow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Αποτυχία δανεισμού');
    }

    return response.json();
  },

  // 📋 Φέρνει τους δανεισμούς του χρήστη
  getLoans: async (userName: string) => {
    const response = await fetch(`${BASE_URL}/loans?userName=${encodeURIComponent(userName)}`);
    if (!response.ok) {
      throw new Error('Αποτυχία φόρτωσης δανεισμών');
    }
    return response.json();
  },

  // ↩️ Επιστροφή βιβλίου
  returnBook: async (loanId: number, userName: string) => {
    const response = await fetch(`${BASE_URL}/loans/${loanId}/return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Αποτυχία επιστροφής βιβλίου');
    }

    return response.json();
  },

  // ➕ Δημιουργία νέου βιβλίου
  createBook: async (book: { title: string; author: string; cover_url?: string; image_url?: string }) => {
    const response = await fetch(`${BASE_URL}/books`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: book.title,
        author: book.author,
        total_copies: 1,
        cover_url: book.cover_url || book.image_url || '',
        image_url: book.cover_url || book.image_url || '',
      }),
    });

    if (!response.ok) {
      throw new Error('Σφάλμα κατά την δημιουργία βιβλίου (Status: ' + response.status + ')');
    }

    return response.json();
  },

  // 🗑️ Διαγραφή βιβλίου
  deleteBook: async (bookId: number) => {
    const response = await fetch(`${BASE_URL}/books/${bookId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Αποτυχία διαγραφής βιβλίου');
    }

    return response.json();
  },
};