import React, { useEffect, useState } from 'react';
import type { Book, BookPayload, BookStatus } from '../types';
import { STATUS_LABELS } from '../constants';
import { CloseIcon, EditIcon, HeartIcon, StarIcon, TrashIcon } from './Icons';

interface BookDetailModalProps {
  book: Book | null;
  saving: boolean;
  onClose: () => void;
  onSaveQuickUpdate: (bookId: number, payload: BookPayload) => Promise<void>;
  onOpenFullEdit: (book: Book) => void;
  onRequestDelete: (book: Book) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  saving,
  onClose,
  onSaveQuickUpdate,
  onOpenFullEdit,
  onRequestDelete,
}) => {
  const [status, setStatus] = useState<BookStatus>('want_to_read');
  const [rating, setRating] = useState<number>(0);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (book) {
      setStatus(book.status || 'want_to_read');
      setRating(book.rating || 0);
      setIsFavorite(Boolean(book.is_favorite));
      setNotes(book.notes || '');
    }
  }, [book]);

  if (!book) return null;

  const hasChanges =
    status !== book.status ||
    rating !== book.rating ||
    isFavorite !== book.is_favorite ||
    notes.trim() !== (book.notes || '').trim();

  const handleSave = async () => {
    await onSaveQuickUpdate(book.id, {
      title: book.title,
      author: book.author,
      category: book.category,
      status,
      rating,
      is_favorite: isFavorite,
      notes: notes.trim(),
      cover_url: '',
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-detail modal-scroll" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="category-pill">{book.category}</span>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              type="button"
              className={`btn btn-icon ${isFavorite ? 'fav-active' : ''}`}
              onClick={() => setIsFavorite((prev) => !prev)}
              title={isFavorite ? 'Αφαίρεση από αγαπημένα' : 'Προσθήκη στα αγαπημένα'}
              aria-label="Αγαπημένο"
            >
              <HeartIcon size={16} filled={isFavorite} />
            </button>
            <button
              type="button"
              className="btn btn-icon"
              onClick={() => {
                onClose();
                onOpenFullEdit(book);
              }}
              title="Επεξεργασία στοιχείων"
              aria-label="Επεξεργασία"
            >
              <EditIcon />
            </button>
            <button
              type="button"
              className="btn btn-icon btn-icon-danger"
              onClick={() => {
                onClose();
                onRequestDelete(book);
              }}
              title="Διαγραφή βιβλίου"
              aria-label="Διαγραφή"
            >
              <TrashIcon />
            </button>
            <button type="button" className="btn btn-icon" onClick={onClose} aria-label="Κλείσιμο">
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="detail-meta">
          <h2 className="detail-title">{book.title}</h2>
          <p className="detail-author">{book.author}</p>

          <div className="form-group" style={{ marginTop: '1.15rem' }}>
            <span className="form-label">Ράφι Ανάγνωσης</span>
            <div className="status-pills-row">
              {(Object.keys(STATUS_LABELS) as BookStatus[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`status-toggle-btn ${status === key ? 'active' : ''}`}
                  onClick={() => setStatus(key)}
                >
                  {STATUS_LABELS[key]}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <div className="label-row">
              <span className="form-label" style={{ marginBottom: 0 }}>Η Βαθμολογία μου</span>
              {rating > 0 && (
                <button
                  type="button"
                  className="btn btn-ghost btn-xs btn-clear-danger"
                  onClick={() => setRating(0)}
                >
                  Σβήσιμο βαθμολογίας
                </button>
              )}
            </div>
            <div className="star-picker">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star-btn ${star <= rating ? 'active' : ''}`}
                  onClick={() => setRating(rating === star ? 0 : star)}
                  aria-label={`${star} αστέρια`}
                >
                  <StarIcon size={22} filled={star <= rating} />
                </button>
              ))}
              <span className="star-label">
                {rating > 0 ? `${rating} / 5` : 'Χωρίς βαθμολογία'}
              </span>
            </div>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '1.25rem', marginBottom: 0 }}>
          <div className="label-row">
            <label className="form-label" htmlFor="detail-notes" style={{ marginBottom: 0 }}>
              Οι σκέψεις & τα σχόλιά μου για το βιβλίο
            </label>
            {notes.trim() !== '' && (
              <button
                type="button"
                className="btn btn-ghost btn-xs btn-clear-danger"
                onClick={() => setNotes('')}
              >
                <TrashIcon size={12} />
                <span>Διαγραφή σχολίου</span>
              </button>
            )}
          </div>
          <textarea
            id="detail-notes"
            className="input-field input-rect textarea-field"
            rows={4}
            placeholder="Πώς σου φάνηκε; Τι σου έμεινε από αυτό το βιβλίο; Γράψε εδώ τις σημειώσεις ή τα αγαπημένα σου αποσπάσματα..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Κλείσιμο
          </button>
          <button
            type="button"
            className="btn btn-violet"
            disabled={!hasChanges || saving}
            onClick={handleSave}
          >
            {saving ? 'Αποθήκευση...' : 'Αποθήκευση Σχολίου & Αλλαγών'}
          </button>
        </div>
      </div>
    </div>
  );
};
