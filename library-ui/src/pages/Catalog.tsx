import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Book, BookPayload, CategoryCount } from '../types';
import type { ShelfFilter } from '../App';
import { BookModal } from '../components/BookModal';
import { BookDetailModal } from '../components/BookDetailModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { STATUS_LABELS } from '../constants';
import {
  BookOpenIcon,
  EditIcon,
  GridIcon,
  HeartIcon,
  ListIcon,
  MessageIcon,
  PlusIcon,
  SearchIcon,
  StarIcon,
  TrashIcon,
} from '../components/Icons';

interface CatalogProps {
  userId: string;
  books: Book[];
  categories: CategoryCount[];
  loading: boolean;
  error: string | null;
  activeShelf: ShelfFilter;
  activeCategory: string;
  createTrigger: number;
  importingCollection: boolean;
  onImportCollection: () => Promise<void>;
  onSelectShelf: (shelf: ShelfFilter) => void;
  onSelectCategory: (catName: string) => void;
  onRefresh: () => Promise<void>;
  onNotify: (text: string, type?: 'success' | 'error') => void;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'newest' | 'title' | 'rating';

const SHELF_TITLES: Record<ShelfFilter, string> = {
  all: 'Η Βιβλιοθήκη μου',
  reading: 'Διαβάζω Τώρα',
  want_to_read: 'Θέλω να Διαβάσω',
  read: 'Διαβασμένα Βιβλία',
  favorites: 'Αγαπημένα Βιβλία',
  reviews: 'Σχόλια & Βαθμολογίες',
};

export const Catalog: React.FC<CatalogProps> = ({
  userId,
  books,
  categories,
  loading,
  error,
  activeShelf,
  activeCategory,
  createTrigger,
  importingCollection,
  onImportCollection,
  onSelectShelf,
  onSelectCategory,
  onRefresh,
  onNotify,
}) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (createTrigger > 0) {
      setEditingBook(null);
      setBookModalOpen(true);
    }
  }, [createTrigger]);

  // Keep open detail modal synced with latest book data
  useEffect(() => {
    if (selectedBook) {
      const fresh = books.find((b) => b.id === selectedBook.id) || null;
      setSelectedBook(fresh);
    }
  }, [books]); // eslint-disable-line react-hooks/exhaustive-deps

  const readCount = books.filter((b) => b.status === 'read').length;
  const readingCount = books.filter((b) => b.status === 'reading').length;
  const wantCount = books.filter((b) => b.status === 'want_to_read').length;
  const reviewsCount = books.filter(
    (b) => b.rating > 0 || (b.notes && b.notes.trim().length > 0)
  ).length;

  const filteredBooks = books
    .filter((book) => {
      if (activeCategory && book.category !== activeCategory) return false;
      if (activeShelf === 'favorites' && !book.is_favorite) return false;
      if (activeShelf === 'reviews' && book.rating === 0 && !(book.notes && book.notes.trim())) {
        return false;
      }
      if (
        (activeShelf === 'reading' ||
          activeShelf === 'want_to_read' ||
          activeShelf === 'read') &&
        book.status !== activeShelf
      ) {
        return false;
      }

      const query = search.toLowerCase().trim();
      if (!query) return true;
      return (
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.category.toLowerCase().includes(query) ||
        (book.notes || '').toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title, 'el');
      if (sortBy === 'rating') return b.rating - a.rating || b.id - a.id;
      return b.id - a.id;
    });

  const handleOpenCreate = () => {
    setEditingBook(null);
    setBookModalOpen(true);
  };

  const handleOpenEdit = (book: Book) => {
    setEditingBook(book);
    setBookModalOpen(true);
  };

  const handleSaveBook = async (payload: BookPayload) => {
    try {
      setSubmitting(true);
      if (editingBook) {
        await api.updateBook(editingBook.id, payload);
        onNotify(`Το βιβλίο «${payload.title}» ενημερώθηκε.`);
      } else {
        await api.createBook(userId, payload);
        onNotify(`Το βιβλίο «${payload.title}» προστέθηκε στη βιβλιοθήκη σου.`);
      }
      setBookModalOpen(false);
      setEditingBook(null);
      await onRefresh();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Σφάλμα αποθήκευσης βιβλίου', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickUpdate = async (bookId: number, payload: BookPayload) => {
    try {
      setSubmitting(true);
      await api.updateBook(bookId, payload);
      onNotify('Οι αλλαγές αποθηκεύτηκαν.');
      setSelectedBook(null);
      await onRefresh();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Αποτυχία ενημέρωσης', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, book: Book) => {
    e.stopPropagation();
    try {
      await api.updateBook(book.id, {
        title: book.title,
        author: book.author,
        category: book.category,
        status: book.status,
        rating: book.rating,
        is_favorite: !book.is_favorite,
        notes: book.notes,
        cover_url: book.cover_url,
      });
      await onRefresh();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Σφάλμα ενημέρωσης', 'error');
    }
  };

  const handleQuickRate = async (e: React.MouseEvent, book: Book, star: number) => {
    e.stopPropagation();
    const nextRating = book.rating === star ? 0 : star;
    try {
      await api.updateBook(book.id, {
        title: book.title,
        author: book.author,
        category: book.category,
        status: book.status,
        rating: nextRating,
        is_favorite: book.is_favorite,
        notes: book.notes,
        cover_url: book.cover_url,
      });
      await onRefresh();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Σφάλμα βαθμολογίας', 'error');
    }
  };

  const handleClearNote = async (e: React.MouseEvent, book: Book) => {
    e.stopPropagation();
    try {
      await api.updateBook(book.id, {
        title: book.title,
        author: book.author,
        category: book.category,
        status: book.status,
        rating: book.rating,
        is_favorite: book.is_favorite,
        notes: '',
        cover_url: book.cover_url,
      });
      onNotify(`Το σχόλιο για το «${book.title}» διαγράφηκε.`);
      await onRefresh();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Σφάλμα διαγραφής σχολίου', 'error');
    }
  };

  const handleClearRating = async (e: React.MouseEvent, book: Book) => {
    e.stopPropagation();
    try {
      await api.updateBook(book.id, {
        title: book.title,
        author: book.author,
        category: book.category,
        status: book.status,
        rating: 0,
        is_favorite: book.is_favorite,
        notes: book.notes,
        cover_url: book.cover_url,
      });
      onNotify(`Η βαθμολογία για το «${book.title}» διαγράφηκε.`);
      await onRefresh();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Σφάλμα διαγραφής βαθμολογίας', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingBook) return;
    try {
      setSubmitting(true);
      await api.deleteBook(deletingBook.id);
      onNotify(`Το βιβλίο «${deletingBook.title}» αφαιρέθηκε.`);
      setDeletingBook(null);
      await onRefresh();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Σφάλμα διαγραφής', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const headingTitle = activeCategory || SHELF_TITLES[activeShelf];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{headingTitle}</h1>
          <p className="page-subtitle">
            Πάτησε σε οποιοδήποτε βιβλίο για να το βαθμολογήσεις ή να γράψεις τις σκέψεις σου.
          </p>
        </div>
        <button className="btn btn-white" onClick={handleOpenCreate}>
          <PlusIcon size={16} />
          <span>Νέο Βιβλίο</span>
        </button>
      </div>

      {/* Διαδραστικά Στατιστικά */}
      <div className="stats-row stats-row-5">
        <button
          type="button"
          className={`stat-card stat-btn ${activeShelf === 'all' && !activeCategory ? 'active' : ''}`}
          onClick={() => onSelectShelf('all')}
        >
          <span className="stat-label">Σύνολο Βιβλίων</span>
          <span className="stat-value">{books.length}</span>
        </button>

        <button
          type="button"
          className={`stat-card stat-btn ${activeShelf === 'read' ? 'active' : ''}`}
          onClick={() => onSelectShelf('read')}
        >
          <span className="stat-label">Διαβασμένα</span>
          <span className="stat-value accent-cyan">{readCount}</span>
        </button>

        <button
          type="button"
          className={`stat-card stat-btn ${activeShelf === 'reading' ? 'active' : ''}`}
          onClick={() => onSelectShelf('reading')}
        >
          <span className="stat-label">Διαβάζω Τώρα</span>
          <span className="stat-value accent-violet">{readingCount}</span>
        </button>

        <button
          type="button"
          className={`stat-card stat-btn ${activeShelf === 'want_to_read' ? 'active' : ''}`}
          onClick={() => onSelectShelf('want_to_read')}
        >
          <span className="stat-label">Θέλω να Διαβάσω</span>
          <span className="stat-value">{wantCount}</span>
        </button>

        <button
          type="button"
          className={`stat-card stat-btn ${activeShelf === 'reviews' ? 'active' : ''}`}
          onClick={() => onSelectShelf('reviews')}
        >
          <span className="stat-label">Σχόλια & Αστέρια</span>
          <span className="stat-value">{reviewsCount}</span>
        </button>
      </div>

      {/* Κατηγορίες (pills για γρήγορη εναλλαγή και σε κινητά) */}
      <div className="category-bar">
        <button
          className={`cat-chip ${!activeCategory ? 'active' : ''}`}
          onClick={() => activeCategory && onSelectCategory(activeCategory)}
        >
          Όλες οι κατηγορίες
        </button>
        {categories.map((cat) => (
          <button
            key={cat.name}
            className={`cat-chip ${activeCategory === cat.name ? 'active' : ''}`}
            onClick={() => onSelectCategory(cat.name)}
          >
            <span>{cat.name}</span>
            <span className="cat-chip-num">{cat.count}</span>
          </button>
        ))}
      </div>

      {/* Αναζήτηση, Ταξινόμηση & Grid/List */}
      <div className="toolbar">
        <div className="search-box">
          <span className="search-box-icon">
            <SearchIcon />
          </span>
          <input
            type="text"
            className="input-field input-search"
            placeholder="Αναζήτηση σε τίτλο, συγγραφέα ή σχόλια..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          aria-label="Ταξινόμηση"
        >
          <option value="newest">Πρόσφατες προσθήκες</option>
          <option value="title">Αλφαβητικά (Α–Ω)</option>
          <option value="rating">Υψηλότερη βαθμολογία</option>
        </select>

        <div className="segmented" role="group" aria-label="Τρόπος προβολής">
          <button
            className={`segmented-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Προβολή πλέγματος"
            aria-label="Προβολή πλέγματος"
          >
            <GridIcon />
          </button>
          <button
            className={`segmented-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="Προβολή λίστας"
            aria-label="Προβολή λίστας"
          >
            <ListIcon />
          </button>
        </div>
      </div>

      {loading && (
        <div className="empty-state">
          <p>Φόρτωση βιβλιοθήκης...</p>
        </div>
      )}

      {!loading && error && (
        <div className="empty-state">
          <p style={{ marginBottom: '1rem' }}>{error}</p>
          <button className="btn btn-white" onClick={onRefresh}>
            Δοκιμή ξανά
          </button>
        </div>
      )}

      {!loading && !error && filteredBooks.length === 0 && (
        <div className="empty-state">
          <p style={{ marginBottom: books.length === 0 ? '1.15rem' : 0 }}>
            {books.length === 0
              ? 'Η βιβλιοθήκη σου είναι ακόμα άδεια! Πρόσθεσε το πρώτο σου βιβλίο ή εισήγαγε την αρχική συλλογή.'
              : activeShelf === 'reviews'
              ? 'Δεν έχεις γράψει ακόμα κάποιο σχόλιο ή βαθμολογία. Πάτησε πάνω σε ένα βιβλίο για να ξεκινήσεις!'
              : 'Δεν βρέθηκαν βιβλία σε αυτή την κατηγορία ή αναζήτηση.'}
          </p>
          {books.length === 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-white" onClick={handleOpenCreate}>
                <PlusIcon size={15} />
                <span>Προσθήκη Βιβλίου</span>
              </button>
              <button
                type="button"
                className="btn btn-violet"
                disabled={importingCollection}
                onClick={onImportCollection}
              >
                {importingCollection
                  ? 'Εισαγωγή...'
                  : 'Εισαγωγή της αρχικής συλλογής (67 βιβλία)'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Ειδική προβολή Σχολίων & Βαθμολογιών */}
      {!loading && !error && filteredBooks.length > 0 && activeShelf === 'reviews' && (
        <div className="reviews-grid">
          {filteredBooks.map((book) => {
            return (
              <article
                key={book.id}
                className="review-card clickable"
                onClick={() => setSelectedBook(book)}
              >
                <div className="review-card-top">
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="review-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="review-cover review-cover-empty" aria-hidden="true">
                      <BookOpenIcon size={22} />
                    </div>
                  )}
                  <div className="review-header-info">
                    <div className="review-badges">
                      <span className="book-cat-tag" style={{ marginBottom: 0 }}>
                        {book.category}
                      </span>
                      <span className={`status-chip status-chip-${book.status}`}>
                        {STATUS_LABELS[book.status]}
                      </span>
                    </div>
                    <h3 className="review-title">{book.title}</h3>
                    <p className="review-author">{book.author}</p>

                    <div className="review-stars-row" onClick={(e) => e.stopPropagation()}>
                      <div className="card-stars" style={{ marginBottom: 0 }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            className={`card-star-btn ${star <= book.rating ? 'active' : ''}`}
                            onClick={(e) => handleQuickRate(e, book, star)}
                            aria-label={`Βαθμολογία ${star}`}
                          >
                            <StarIcon size={17} filled={star <= book.rating} />
                          </button>
                        ))}
                      </div>
                      <span className="review-score">
                        {book.rating > 0 ? `${book.rating} / 5` : 'Χωρίς αστέρια'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.35rem' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="btn btn-icon"
                      onClick={() => setSelectedBook(book)}
                      title="Επεξεργασία σχολίου"
                      aria-label="Επεξεργασία σχολίου"
                    >
                      <EditIcon />
                    </button>
                    <button
                      type="button"
                      className="btn btn-icon btn-icon-danger"
                      onClick={() => setDeletingBook(book)}
                      title="Διαγραφή βιβλίου"
                      aria-label={`Διαγραφή ${book.title}`}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>

                {book.notes && book.notes.trim() !== '' ? (
                  <blockquote className="review-quote">
                    <MessageIcon size={15} />
                    <p>{book.notes}</p>
                  </blockquote>
                ) : (
                  <div className="review-no-note">
                    <span>Δεν υπάρχει ακόμα γραπτό σχόλιο — πάτησε για να προσθέσεις μια σκέψη.</span>
                  </div>
                )}

                <div className="review-footer-actions" onClick={(e) => e.stopPropagation()}>
                  {book.notes && book.notes.trim() !== '' && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs btn-clear-danger"
                      onClick={(e) => handleClearNote(e, book)}
                    >
                      <TrashIcon size={13} />
                      <span>Διαγραφή σχολίου</span>
                    </button>
                  )}
                  {book.rating > 0 && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs btn-clear-danger"
                      onClick={(e) => handleClearRating(e, book)}
                    >
                      <span>Σβήσιμο βαθμολογίας</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!loading && !error && filteredBooks.length > 0 && activeShelf !== 'reviews' && viewMode === 'grid' && (
        <div className="books-grid">
          {filteredBooks.map((book) => {
            return (
              <article
                key={book.id}
                className="book-card clickable"
                onClick={() => setSelectedBook(book)}
              >
                <div className="book-cover-wrap">
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="book-cover-img"
                      loading="lazy"
                    />
                  ) : (
                    <div className="book-cover-empty" aria-hidden="true">
                      <BookOpenIcon size={28} />
                      <span className="book-cover-empty-title">{book.title}</span>
                      <span className="book-cover-empty-author">{book.author}</span>
                    </div>
                  )}
                  <span className={`status-badge-overlay status-${book.status}`}>
                    {STATUS_LABELS[book.status]}
                  </span>
                  <button
                    type="button"
                    className={`fav-float-btn ${book.is_favorite ? 'active' : ''}`}
                    onClick={(e) => handleToggleFavorite(e, book)}
                    title={book.is_favorite ? 'Αφαίρεση από αγαπημένα' : 'Αγαπημένο'}
                    aria-label="Αγαπημένο"
                  >
                    <HeartIcon size={15} filled={book.is_favorite} />
                  </button>
                </div>

                <div className="book-body">
                  <span className="book-cat-tag">{book.category}</span>
                  <h3 className="book-title">{book.title}</h3>
                  <p className="book-author">{book.author}</p>

                  {/* 5-star quick rating */}
                  <div className="card-stars" onClick={(e) => e.stopPropagation()}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`card-star-btn ${star <= book.rating ? 'active' : ''}`}
                        onClick={(e) => handleQuickRate(e, book, star)}
                        title={`Βαθμολογία ${star}/5`}
                        aria-label={`Βαθμολογία ${star}`}
                      >
                        <StarIcon size={14} filled={star <= book.rating} />
                      </button>
                    ))}
                  </div>

                  {/* Personal reading thought preview */}
                  {book.notes && book.notes.trim() !== '' && (
                    <div className="card-note-preview">
                      <MessageIcon size={13} />
                      <span>«{book.notes}»</span>
                    </div>
                  )}

                  <div className="book-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-note-cta"
                      onClick={() => setSelectedBook(book)}
                    >
                      <MessageIcon size={14} />
                      <span>{book.notes ? 'Προβολή σχολίου' : 'Γράψε σχόλιο'}</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-icon"
                      onClick={() => handleOpenEdit(book)}
                      title="Επεξεργασία"
                      aria-label={`Επεξεργασία ${book.title}`}
                    >
                      <EditIcon />
                    </button>

                    <button
                      type="button"
                      className="btn btn-icon btn-icon-danger"
                      onClick={() => setDeletingBook(book)}
                      title="Διαγραφή"
                      aria-label={`Διαγραφή ${book.title}`}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!loading && !error && filteredBooks.length > 0 && activeShelf !== 'reviews' && viewMode === 'list' && (
        <div className="books-list">
          {filteredBooks.map((book) => {
            return (
              <div
                key={book.id}
                className="book-row clickable"
                onClick={() => setSelectedBook(book)}
              >
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="book-row-thumb"
                    loading="lazy"
                  />
                ) : (
                  <div className="book-row-thumb book-row-thumb-empty" aria-hidden="true">
                    <BookOpenIcon size={18} />
                  </div>
                )}
                <div className="book-row-info">
                  <div className="book-row-title">{book.title}</div>
                  <div className="book-row-author">
                    {book.author} · <span className="book-row-cat">{book.category}</span>
                  </div>
                  {book.notes && <div className="book-row-note">«{book.notes}»</div>}
                </div>

                <div className="card-stars" onClick={(e) => e.stopPropagation()}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`card-star-btn ${star <= book.rating ? 'active' : ''}`}
                      onClick={(e) => handleQuickRate(e, book, star)}
                      aria-label={`Βαθμολογία ${star}`}
                    >
                      <StarIcon size={14} filled={star <= book.rating} />
                    </button>
                  ))}
                </div>

                <span className={`status-chip status-chip-${book.status}`}>
                  {STATUS_LABELS[book.status]}
                </span>

                <div style={{ display: 'flex', gap: '0.35rem' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className={`btn btn-icon ${book.is_favorite ? 'fav-active' : ''}`}
                    onClick={(e) => handleToggleFavorite(e, book)}
                    aria-label="Αγαπημένο"
                  >
                    <HeartIcon size={15} filled={book.is_favorite} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-icon"
                    onClick={() => handleOpenEdit(book)}
                    aria-label={`Επεξεργασία ${book.title}`}
                  >
                    <EditIcon />
                  </button>
                  <button
                    type="button"
                    className="btn btn-icon btn-icon-danger"
                    onClick={() => setDeletingBook(book)}
                    aria-label={`Διαγραφή ${book.title}`}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BookModal
        open={bookModalOpen}
        editingBook={editingBook}
        submitting={submitting}
        onClose={() => {
          setBookModalOpen(false);
          setEditingBook(null);
        }}
        onSubmit={handleSaveBook}
      />

      <BookDetailModal
        book={selectedBook}
        saving={submitting}
        onClose={() => setSelectedBook(null)}
        onSaveQuickUpdate={handleQuickUpdate}
        onOpenFullEdit={handleOpenEdit}
        onRequestDelete={setDeletingBook}
      />

      <ConfirmModal
        open={deletingBook !== null}
        title="Αφαίρεση Βιβλίου"
        message={
          deletingBook
            ? `Είστε σίγουροι ότι θέλετε να αφαιρέσετε το βιβλίο «${deletingBook.title}» από τη βιβλιοθήκη σας;`
            : ''
        }
        confirmLabel="Αφαίρεση"
        submitting={submitting}
        onCancel={() => setDeletingBook(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default Catalog;
