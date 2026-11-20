import { useCallback, useEffect, useState } from 'react';
import { api } from './api/client';
import Catalog from './pages/Catalog';
import { ToastContainer } from './components/Toast';
import {
  BookOpenIcon,
  BookmarkIcon,
  CompassIcon,
  HeartIcon,
  MessageIcon,
  PlusIcon,
  TagIcon,
} from './components/Icons';
import { RoseOrnament } from './components/RoseOrnament';
import type { Book, CategoryCount, ToastMessage } from './types';

export type ShelfFilter = 'all' | 'reading' | 'want_to_read' | 'read' | 'favorites' | 'reviews';

export function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeShelf, setActiveShelf] = useState<ShelfFilter>('all');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [createTrigger, setCreateTrigger] = useState<number>(0);

  const notify = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, text, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const fetchLibrary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [booksData, catsData] = await Promise.all([api.getBooks(), api.getCategories()]);
      setBooks(Array.isArray(booksData) ? booksData : []);
      setCategories(Array.isArray(catsData) ? catsData : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Αποτυχία φόρτωσης βιβλιοθήκης');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  const readingCount = books.filter((b) => b.status === 'reading').length;
  const wantCount = books.filter((b) => b.status === 'want_to_read').length;
  const readCount = books.filter((b) => b.status === 'read').length;
  const favCount = books.filter((b) => b.is_favorite).length;
  const reviewsCount = books.filter((b) => b.rating > 0 || (b.notes && b.notes.trim().length > 0)).length;

  const handleSelectShelf = (shelf: ShelfFilter) => {
    setActiveShelf(shelf);
    setActiveCategory('');
  };

  const handleSelectCategory = (catName: string) => {
    setActiveCategory((prev) => (prev === catName ? '' : catName));
    setActiveShelf('all');
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <BookOpenIcon size={20} />
          </span>
          <span className="brand-title">bibliotheca</span>
        </div>

        <button className="sidebar-cta" onClick={() => setCreateTrigger((c) => c + 1)}>
          <PlusIcon size={17} />
          <span>Νέο Βιβλίο</span>
        </button>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Τα Ράφια μου</div>
          <nav className="sidebar-nav" aria-label="Ράφια ανάγνωσης">
            <button
              className={`sidebar-link ${activeShelf === 'all' && !activeCategory ? 'active' : ''}`}
              onClick={() => handleSelectShelf('all')}
            >
              <CompassIcon />
              <span>Όλα τα Βιβλία</span>
              <span className="sidebar-count">{books.length}</span>
            </button>

            <button
              className={`sidebar-link ${activeShelf === 'reading' ? 'active' : ''}`}
              onClick={() => handleSelectShelf('reading')}
            >
              <BookOpenIcon size={17} />
              <span>Διαβάζω τώρα</span>
              {readingCount > 0 && <span className="sidebar-badge">{readingCount}</span>}
            </button>

            <button
              className={`sidebar-link ${activeShelf === 'want_to_read' ? 'active' : ''}`}
              onClick={() => handleSelectShelf('want_to_read')}
            >
              <BookmarkIcon />
              <span>Θέλω να διαβάσω</span>
              <span className="sidebar-count">{wantCount}</span>
            </button>

            <button
              className={`sidebar-link ${activeShelf === 'read' ? 'active' : ''}`}
              onClick={() => handleSelectShelf('read')}
            >
              <BookOpenIcon size={17} />
              <span>Διαβασμένα</span>
              <span className="sidebar-count">{readCount}</span>
            </button>

            <button
              className={`sidebar-link ${activeShelf === 'favorites' ? 'active' : ''}`}
              onClick={() => handleSelectShelf('favorites')}
            >
              <HeartIcon size={17} filled={activeShelf === 'favorites'} />
              <span>Αγαπημένα</span>
              {favCount > 0 && <span className="sidebar-count">{favCount}</span>}
            </button>

            <button
              className={`sidebar-link ${activeShelf === 'reviews' ? 'active' : ''}`}
              onClick={() => handleSelectShelf('reviews')}
            >
              <MessageIcon size={16} />
              <span>Σχόλια & Αστέρια</span>
              {reviewsCount > 0 && <span className="sidebar-count">{reviewsCount}</span>}
            </button>
          </nav>
        </div>

        <div className="sidebar-section sidebar-categories">
          <div className="sidebar-section-title">Κατηγορίες</div>
          <nav className="sidebar-nav" aria-label="Κατηγορίες βιβλίων">
            {categories.map((cat) => (
              <button
                key={cat.name}
                className={`sidebar-link sidebar-cat-link ${
                  activeCategory === cat.name ? 'active' : ''
                }`}
                onClick={() => handleSelectCategory(cat.name)}
              >
                <TagIcon size={14} />
                <span className="sidebar-cat-name">{cat.name}</span>
                <span className="sidebar-count">{cat.count}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-ornament">
            <RoseOrnament width={165} />
          </div>
        </div>
      </aside>

      <main className="main-workspace">
        <div className="ornament-divider" aria-hidden="true">
          <span className="ornament-line" />
          <RoseOrnament width={220} className="ornament-svg" />
          <span className="ornament-line reverse" />
        </div>

        <Catalog
          books={books}
          categories={categories}
          loading={loading}
          error={error}
          activeShelf={activeShelf}
          activeCategory={activeCategory}
          createTrigger={createTrigger}
          onSelectShelf={handleSelectShelf}
          onSelectCategory={handleSelectCategory}
          onRefresh={fetchLibrary}
          onNotify={notify}
        />

        <footer className="page-footer-embrace">
          <div className="ornament-divider" aria-hidden="true">
            <span className="ornament-line" />
            <RoseOrnament width={200} className="ornament-svg" />
            <span className="ornament-line reverse" />
          </div>
          <span className="page-footer-caption">bibliotheca · προσωπική ηλεκτρονική βιβλιοθήκη</span>
        </footer>
      </main>

      <ToastContainer toasts={toasts} />
    </div>
  );
}

export default App;
