import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

interface CatalogProps {
  userName: string;
}

const DEFAULT_COVERS = [
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1463320726281-696a485928c7?q=80&w=600&auto=format&fit=crop',
];

export const Catalog: React.FC<CatalogProps> = ({ userName }) => {
  const [books, setBooks] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Φόρμα προσθήκης (Μόνο Τίτλος & Συγγραφέας)
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const data = await api.getBooks('');
      const list = Array.isArray(data) ? data : (data?.books || []);
      setBooks(list);
    } catch (err) {
      console.error('Σφάλμα κατά τη φόρτωση βιβλίων:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // 🔍 Έξυπνη αναζήτηση
  const filteredBooks = books.filter((book) => {
    const query = search.toLowerCase().trim();
    if (!query) return true;

    const title = (book.title ?? book.Title ?? '').toLowerCase();
    const author = (book.author ?? book.Author ?? '').toLowerCase();

    return title.includes(query) || author.includes(query);
  });

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAuthor.trim()) {
      alert('Παρακαλώ συμπληρώστε τίτλο και συγγραφέα.');
      return;
    }

    const randomCover = DEFAULT_COVERS[Math.floor(Math.random() * DEFAULT_COVERS.length)];

    try {
      await api.createBook({ 
        title: newTitle, 
        author: newAuthor,
        cover_url: randomCover,
        image_url: randomCover
      });
      alert('Το βιβλίο προστέθηκε με επιτυχία!');
      setNewTitle('');
      setNewAuthor('');
      fetchBooks();
    } catch (err: any) {
      alert(err.message || 'Σφάλμα κατά την προσθήκη βιβλίου.');
    }
  };

  // 🗑️ Συνάρτηση Διαγραφής Βιβλίου
  const handleDeleteBook = async (bookId: number, title: string) => {
    if (!window.confirm(`Είστε σίγουροι ότι θέλετε να διαγράψετε το βιβλίο "${title}";`)) {
      return;
    }

    try {
      await api.deleteBook(bookId);
      alert('Το βιβλίο διαγράφηκε με επιτυχία!');
      fetchBooks();
    } catch (err: any) {
      alert(err.message || 'Σφάλμα κατά τη διαγραφή του βιβλίου.');
    }
  };

  const handleBorrow = async (bookId: number) => {
    try {
      await api.borrowBook(bookId, userName);
      alert('Ο δανεισμός έγινε επιτυχώς!');
      fetchBooks();
    } catch (err: any) {
      alert(err.message || 'Σφάλμα κατά τον δανεισμό.');
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '0.5rem', fontFamily: 'Georgia, serif' }}>📚 Κατάλογος Βιβλιοθήκης</h1>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Αναζητήστε και δανειστείτε κλασικά συγγράμματα.</p>

      {/* ➕ ΦΟΡΜΑ ΠΡΟΣΘΗΚΗΣ */}
      <form onSubmit={handleCreateBook} className="card-form">
        <h3 style={{ margin: '0 0 1rem 0', fontFamily: 'Georgia, serif' }}>✒️ Προσθήκη Νέου Βιβλίου</h3>
        
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Τίτλος Βιβλίου"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="input-field"
            style={{ flex: 1, minWidth: '180px' }}
          />
          <input
            type="text"
            placeholder="Συγγραφέας"
            value={newAuthor}
            onChange={(e) => setNewAuthor(e.target.value)}
            className="input-field"
            style={{ flex: 1, minWidth: '180px' }}
          />
        </div>

        <button type="submit" className="btn-primary">
          + Προσθήκη Βιβλίου
        </button>
      </form>

      {/* 🔍 ΑΝΑΖΗΤΗΣΗ */}
      <div style={{ marginBottom: '2rem' }}>
        <input
          type="text"
          placeholder="🔎 Αναζήτηση με τίτλο ή συγγραφέα..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field"
          style={{ width: '100%', boxSizing: 'border-box' }}
        />
      </div>

      {loading && <p>Φόρτωση βιβλίων...</p>}

      {/* 🎴 GRID ΜΕ ΚΑΡΤΕΣ */}
      {!loading && (
        <div className="grid-container">
          {filteredBooks.length === 0 ? (
            <p style={{ color: '#64748b' }}>Δεν βρέθηκαν βιβλία.</p>
          ) : (
            filteredBooks.map((book, index) => {
              const bookId = book.id ?? book.Id ?? book.ID;
              const title = book.title ?? book.Title;
              const author = book.author ?? book.Author;
              const isAvailable = book.available ?? book.Available ?? true;

              const coverUrl =
                book.cover_url ||
                book.image_url ||
                book.CoverUrl ||
                DEFAULT_COVERS[index % DEFAULT_COVERS.length];

              return (
                <div key={bookId} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ overflow: 'hidden', borderRadius: '8px', marginBottom: '1rem', height: '220px' }}>
                      <img
                        src={coverUrl}
                        alt={title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </div>

                    <h3 style={{ margin: '0 0 0.4rem 0', fontFamily: 'Georgia, serif' }}>{title}</h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 0.8rem 0' }}>✍️ {author}</p>
                    
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        backgroundColor: isAvailable ? '#dcfce7' : '#fee2e2',
                        color: isAvailable ? '#15803d' : '#b91c1c',
                        marginBottom: '1rem'
                      }}
                    >
                      {isAvailable ? '🟢 Διαθέσιμο' : '🔴 Δανεισμένο'}
                    </span>
                  </div>

                  {/* 🔘 ΚΟΥΜΠΙΑ ΔΑΝΕΙΣΜΟΥ & ΔΙΑΓΡΑΦΗΣ */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button
                      onClick={() => handleBorrow(bookId)}
                      disabled={!isAvailable}
                      className="btn-primary"
                      style={{
                        flex: 1,
                        opacity: isAvailable ? 1 : 0.5,
                        cursor: isAvailable ? 'pointer' : 'not-allowed',
                      }}
                    >
                      {isAvailable ? '📖 Δανεισμός' : 'Μη διαθέσιμο'}
                    </button>

                    <button
                      onClick={() => handleDeleteBook(bookId, title)}
                      style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.5rem 0.8rem',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                      title="Διαγραφή βιβλίου"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default Catalog;