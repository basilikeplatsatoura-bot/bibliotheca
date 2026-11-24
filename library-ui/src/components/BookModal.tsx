import React, { useState, useEffect, useMemo } from 'react';
import type { Book, BookPayload, BookStatus } from '../types';
import { BOOK_CATEGORIES, STATUS_LABELS } from '../constants';
import { POPULAR_BOOKS, type PopularBookSuggestion } from '../data/popularBooks';
import { CloseIcon, StarIcon } from './Icons';

interface BookModalProps {
  open: boolean;
  editingBook: Book | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: BookPayload) => void;
}

function normalizeGreek(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

async function searchOnlineSuggestions(query: string): Promise<PopularBookSuggestion[]> {
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=ebook&country=gr&limit=5`
    );
    if (!res.ok) return [];
    const data = await res.json();
    const results: PopularBookSuggestion[] = [];
    for (const item of data.results || []) {
      if (!item.trackName || !item.artistName) continue;
      results.push({
        title: item.trackName,
        author: item.artistName,
        category: BOOK_CATEGORIES[0],
      });
    }
    return results;
  } catch {
    return [];
  }
}

export const BookModal: React.FC<BookModalProps> = ({
  open,
  editingBook,
  submitting,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState<string>(BOOK_CATEGORIES[0]);
  const [status, setStatus] = useState<BookStatus>('want_to_read');
  const [rating, setRating] = useState<number>(0);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [notes, setNotes] = useState('');

  // Autocomplete suggestions state (non-blocking inline box)
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [onlineSuggestions, setOnlineSuggestions] = useState<PopularBookSuggestion[]>([]);
  const [loadingOnline, setLoadingOnline] = useState(false);

  useEffect(() => {
    setShowSuggestions(false);
    setOnlineSuggestions([]);
    if (editingBook) {
      setTitle(editingBook.title);
      setAuthor(editingBook.author);
      setCategory(editingBook.category || BOOK_CATEGORIES[0]);
      setStatus(editingBook.status || 'want_to_read');
      setRating(editingBook.rating || 0);
      setIsFavorite(Boolean(editingBook.is_favorite));
      setNotes(editingBook.notes || '');
    } else {
      setTitle('');
      setAuthor('');
      setCategory(BOOK_CATEGORIES[0]);
      setStatus('want_to_read');
      setRating(0);
      setIsFavorite(false);
      setNotes('');
    }
  }, [editingBook, open]);

  // Instant local matches from curated popular books database
  const localSuggestions = useMemo(() => {
    if (editingBook) return [];
    const q = normalizeGreek(title);
    if (q.length < 2) return [];
    return POPULAR_BOOKS.filter(
      (b) => normalizeGreek(b.title).includes(q) || normalizeGreek(b.author).includes(q)
    ).slice(0, 5);
  }, [title, editingBook]);

  // Live online suggestions (debounced)
  useEffect(() => {
    if (!open || editingBook || !showSuggestions) return;
    const trimmed = title.trim();
    if (trimmed.length < 3) {
      setOnlineSuggestions([]);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoadingOnline(true);
      const found = await searchOnlineSuggestions(trimmed);
      if (!cancelled) {
        setOnlineSuggestions(found);
        setLoadingOnline(false);
      }
    }, 380);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [title, open, editingBook, showSuggestions]);

  // Merge local + online suggestions without duplicates
  const mergedSuggestions = useMemo(() => {
    const seen = new Set(localSuggestions.map((b) => normalizeGreek(b.title)));
    const extra = onlineSuggestions.filter((b) => !seen.has(normalizeGreek(b.title))).slice(0, 3);
    return [...localSuggestions, ...extra];
  }, [localSuggestions, onlineSuggestions]);

  if (!open) return null;

  const handleSelectSuggestion = (item: PopularBookSuggestion) => {
    setTitle(item.title);
    setAuthor(item.author);
    if (item.category) setCategory(item.category);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;
    onSubmit({
      title: title.trim(),
      author: author.trim(),
      category: category.trim() || BOOK_CATEGORIES[0],
      status,
      rating,
      is_favorite: isFavorite,
      notes: notes.trim(),
      cover_url: '',
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-scroll" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {editingBook ? 'Επεξεργασία Βιβλίου' : 'Προσθήκη Νέου Βιβλίου'}
          </h2>
          <button type="button" className="btn btn-icon" onClick={onClose} aria-label="Κλείσιμο">
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="book-title">
              Τίτλος Βιβλίου *{' '}
              {!editingBook && <span className="label-sub">(γράψε δικό σου ή διάλεξε πρόταση)</span>}
            </label>
            <input
              id="book-title"
              type="text"
              className="input-field input-rect"
              placeholder="π.χ. 1984, Έγκλημα και Τιμωρία ή όποιο βιβλίο θέλεις..."
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!editingBook) setShowSuggestions(true);
              }}
              onFocus={() => {
                if (!editingBook && title.trim().length >= 2) setShowSuggestions(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setShowSuggestions(false);
              }}
              autoComplete="off"
              required
              autoFocus
            />

            {/* Inline non-blocking suggestions panel (never overlaps Author field!) */}
            {!editingBook && showSuggestions && (mergedSuggestions.length > 0 || loadingOnline) && (
              <div className="suggestions-inline" role="listbox">
                <div className="suggestions-inline-header">
                  <span>Προτάσεις βιβλίων</span>
                  <button
                    type="button"
                    className="suggestions-close-btn"
                    onClick={() => setShowSuggestions(false)}
                  >
                    Συνέχεια με δικό μου ✕
                  </button>
                </div>

                {mergedSuggestions.map((item, idx) => (
                  <button
                    key={`${item.title}-${item.author}-${idx}`}
                    type="button"
                    className="suggestion-item"
                    onClick={() => handleSelectSuggestion(item)}
                  >
                    <div className="suggestion-info">
                      <span className="suggestion-title">{item.title}</span>
                      <span className="suggestion-author">{item.author}</span>
                    </div>
                    <span className="suggestion-cat">{item.category}</span>
                  </button>
                ))}
                {loadingOnline && (
                  <div className="suggestion-loading">Αναζήτηση επιπλέον βιβλίων...</div>
                )}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="book-author">
              Συγγραφέας *
            </label>
            <input
              id="book-author"
              type="text"
              className="input-field input-rect"
              placeholder="π.χ. Κώστας Ταχτσής"
              value={author}
              onFocus={() => setShowSuggestions(false)}
              onChange={(e) => setAuthor(e.target.value)}
              required
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="book-category">
                Κατηγορία
              </label>
              <select
                id="book-category"
                className="input-field input-rect"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {BOOK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="book-status">
                Κατάσταση Ανάγνωσης
              </label>
              <select
                id="book-status"
                className="input-field input-rect"
                value={status}
                onChange={(e) => setStatus(e.target.value as BookStatus)}
              >
                {(Object.keys(STATUS_LABELS) as BookStatus[]).map((key) => (
                  <option key={key} value={key}>
                    {STATUS_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Βαθμολογία</label>
            <div className="star-picker">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star-btn ${star <= rating ? 'active' : ''}`}
                  onClick={() => setRating(rating === star ? 0 : star)}
                  title={`${star} αστέρια`}
                  aria-label={`${star} αστέρια`}
                >
                  <StarIcon size={20} filled={star <= rating} />
                </button>
              ))}
              {rating > 0 && <span className="star-label">{rating} / 5</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="book-notes">
              Σχόλιο / Σκέψη από την ανάγνωση (προαιρετικό)
            </label>
            <textarea
              id="book-notes"
              className="input-field input-rect textarea-field"
              rows={3}
              placeholder="Γράψε μια σκέψη, ένα αγαπημένο απόσπασμα ή την εντύπωσή σου από το βιβλίο..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Ακύρωση
            </button>
            <button type="submit" className="btn btn-violet" disabled={submitting}>
              {submitting ? 'Αποθήκευση...' : editingBook ? 'Αποθήκευση Αλλαγών' : 'Προσθήκη Βιβλίου'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
