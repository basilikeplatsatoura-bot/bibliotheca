import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Book, Profile } from '../types';
import { STATUS_LABELS } from '../constants';
import {
  ArrowLeftIcon,
  MessageIcon,
  PlusIcon,
  SearchIcon,
  StarIcon,
} from '../components/Icons';

interface CommunityProps {
  myProfile: Profile;
  followingIds: string[];
  onFollowChange: () => Promise<void>;
  onCopyBookToMine: (book: Book) => Promise<void>;
  onNotify: (text: string, type?: 'success' | 'error') => void;
}

export const Community: React.FC<CommunityProps> = ({
  myProfile,
  followingIds,
  onFollowChange,
  onCopyBookToMine,
  onNotify,
}) => {
  const [tab, setTab] = useState<'feed' | 'discover'>('feed');
  const [feedBooks, setFeedBooks] = useState<Book[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [copyingBookId, setCopyingBookId] = useState<number | null>(null);

  // Viewing a specific friend's library
  const [viewingProfile, setViewingProfile] = useState<Profile | null>(null);
  const [viewingBooks, setViewingBooks] = useState<Book[]>([]);
  const [loadingProfileBooks, setLoadingProfileBooks] = useState(false);

  const loadFeed = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getFollowingFeed(followingIds);
      setFeedBooks(data);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Σφάλμα φόρτωσης feed', 'error');
    } finally {
      setLoading(false);
    }
  }, [followingIds, onNotify]);

  const loadProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.searchProfiles(searchQuery, myProfile.id);
      setProfiles(data);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Σφάλμα αναζήτησης χρηστών', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, myProfile.id, onNotify]);

  useEffect(() => {
    if (tab === 'feed') {
      loadFeed();
    } else {
      loadProfiles();
    }
  }, [tab, loadFeed, loadProfiles]);

  const handleToggleFollow = async (target: Profile) => {
    const isFollowing = followingIds.includes(target.id);
    try {
      setBusyUserId(target.id);
      if (isFollowing) {
        await api.unfollowUser(myProfile.id, target.id);
        onNotify(`Σταμάτησες να ακολουθείς τον/την @${target.username}.`);
      } else {
        await api.followUser(myProfile.id, target.id);
        onNotify(`Ακολουθείς πλέον τον/την @${target.username}!`);
      }
      await onFollowChange();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Σφάλμα ενέργειας', 'error');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleOpenProfile = async (profile: Profile) => {
    setViewingProfile(profile);
    try {
      setLoadingProfileBooks(true);
      const books = await api.getUserBooks(profile.id);
      setViewingBooks(books);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Αποτυχία φόρτωσης βιβλιοθήκης', 'error');
    } finally {
      setLoadingProfileBooks(false);
    }
  };

  const handleCopy = async (book: Book) => {
    try {
      setCopyingBookId(book.id);
      await onCopyBookToMine(book);
    } finally {
      setCopyingBookId(null);
    }
  };

  // ===== Friend's Library View =====
  if (viewingProfile) {
    const isFollowing = followingIds.includes(viewingProfile.id);
    return (
      <div>
        <div className="page-header">
          <div>
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              style={{ marginBottom: '0.75rem' }}
              onClick={() => setViewingProfile(null)}
            >
              <ArrowLeftIcon size={14} />
              <span>Πίσω στην Κοινότητα</span>
            </button>
            <h1 className="page-title">{viewingProfile.display_name || viewingProfile.username}</h1>
            <p className="page-subtitle">
              @{viewingProfile.username} · {viewingBooks.length} βιβλία στη συλλογή
            </p>
          </div>

          <button
            type="button"
            className={`btn ${isFollowing ? 'btn-ghost' : 'btn-violet'}`}
            disabled={busyUserId === viewingProfile.id}
            onClick={() => handleToggleFollow(viewingProfile)}
          >
            {isFollowing ? 'Ακολουθείς ✓' : '+ Follow'}
          </button>
        </div>

        {loadingProfileBooks && (
          <div className="empty-state">
            <p>Φόρτωση βιβλιοθήκης...</p>
          </div>
        )}

        {!loadingProfileBooks && viewingBooks.length === 0 && (
          <div className="empty-state">
            <p>Δεν έχει προσθέσει ακόμα βιβλία στη βιβλιοθήκη του/της.</p>
          </div>
        )}

        {!loadingProfileBooks && viewingBooks.length > 0 && (
          <div className="reviews-grid">
            {viewingBooks.map((book) => (
              <article key={book.id} className="review-card">
                <div className="review-card-top">
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
                    {book.rating > 0 && (
                      <div className="review-stars-row">
                        <div className="card-stars" style={{ marginBottom: 0 }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`card-star-btn ${star <= book.rating ? 'active' : ''}`}
                            >
                              <StarIcon size={15} filled={star <= book.rating} />
                            </span>
                          ))}
                        </div>
                        <span className="review-score">{book.rating} / 5</span>
                      </div>
                    )}
                  </div>
                </div>

                {book.notes && book.notes.trim() !== '' && (
                  <blockquote className="review-quote">
                    <MessageIcon size={15} />
                    <p>{book.notes}</p>
                  </blockquote>
                )}

                <div className="review-footer-actions">
                  <button
                    type="button"
                    className="btn btn-white btn-xs"
                    disabled={copyingBookId === book.id}
                    onClick={() => handleCopy(book)}
                  >
                    <PlusIcon size={13} />
                    <span>
                      {copyingBookId === book.id ? 'Προσθήκη...' : 'Στη βιβλιοθήκη μου'}
                    </span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ===== Main Community Tabs (Feed & Discover) =====
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Κοινότητα Αναγνωστών</h1>
          <p className="page-subtitle">
            Ακολούθησε φίλους, δες τι διαβάζουν και ανακάλυψε νέα βιβλία από τα σχόλιά τους.
          </p>
        </div>

        <div className="segmented">
          <button
            type="button"
            className={`segmented-btn ${tab === 'feed' ? 'active' : ''}`}
            onClick={() => setTab('feed')}
          >
            Feed ({followingIds.length})
          </button>
          <button
            type="button"
            className={`segmented-btn ${tab === 'discover' ? 'active' : ''}`}
            onClick={() => setTab('discover')}
          >
            Αναζήτηση Χρηστών
          </button>
        </div>
      </div>

      {tab === 'feed' && (
        <>
          {loading && (
            <div className="empty-state">
              <p>Φόρτωση δραστηριότητας...</p>
            </div>
          )}

          {!loading && followingIds.length === 0 && (
            <div className="empty-state">
              <p style={{ marginBottom: '1rem' }}>
                Δεν ακολουθείς ακόμα κανέναν! Πάτησε «Αναζήτηση Χρηστών» για να βρεις φίλους.
              </p>
              <button type="button" className="btn btn-violet" onClick={() => setTab('discover')}>
                Αναζήτηση Χρηστών
              </button>
            </div>
          )}

          {!loading && followingIds.length > 0 && feedBooks.length === 0 && (
            <div className="empty-state">
              <p>Οι χρήστες που ακολουθείς δεν έχουν προσθέσει ακόμα βιβλία.</p>
            </div>
          )}

          {!loading && feedBooks.length > 0 && (
            <div className="reviews-grid">
              {feedBooks.map((book) => (
                <article key={book.id} className="review-card">
                  {book.profile && (
                    <div className="feed-author-row">
                      <button
                        type="button"
                        className="feed-user-btn"
                        onClick={() => book.profile && handleOpenProfile(book.profile)}
                      >
                        <span className="user-avatar-mini">
                          {(book.profile.display_name || book.profile.username)[0]?.toUpperCase()}
                        </span>
                        <div>
                          <span className="feed-user-name">
                            {book.profile.display_name || book.profile.username}
                          </span>
                          <span className="feed-user-handle">@{book.profile.username}</span>
                        </div>
                      </button>
                      <span className={`status-chip status-chip-${book.status}`}>
                        {STATUS_LABELS[book.status]}
                      </span>
                    </div>
                  )}

                  <div className="review-card-top">
                    <div className="review-header-info">
                      <span className="book-cat-tag">{book.category}</span>
                      <h3 className="review-title">{book.title}</h3>
                      <p className="review-author">{book.author}</p>
                      {book.rating > 0 && (
                        <div className="review-stars-row">
                          <div className="card-stars" style={{ marginBottom: 0 }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`card-star-btn ${star <= book.rating ? 'active' : ''}`}
                              >
                                <StarIcon size={15} filled={star <= book.rating} />
                              </span>
                            ))}
                          </div>
                          <span className="review-score">{book.rating} / 5</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {book.notes && book.notes.trim() !== '' && (
                    <blockquote className="review-quote">
                      <MessageIcon size={15} />
                      <p>{book.notes}</p>
                    </blockquote>
                  )}

                  <div className="review-footer-actions">
                    <button
                      type="button"
                      className="btn btn-white btn-xs"
                      disabled={copyingBookId === book.id}
                      onClick={() => handleCopy(book)}
                    >
                      <PlusIcon size={13} />
                      <span>
                        {copyingBookId === book.id ? 'Προσθήκη...' : 'Θέλω να το διαβάσω'}
                      </span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'discover' && (
        <>
          <div className="toolbar">
            <div className="search-box">
              <span className="search-box-icon">
                <SearchIcon />
              </span>
              <input
                type="text"
                className="input-field input-search"
                placeholder="Αναζήτηση χρήστη με @username ή όνομα..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {loading && (
            <div className="empty-state">
              <p>Αναζήτηση αναγνωστών...</p>
            </div>
          )}

          {!loading && profiles.length === 0 && (
            <div className="empty-state">
              <p>
                Δεν βρέθηκαν άλλοι χρήστες ακόμα. Στείλε το link της εφαρμογής σε φίλους σου για να
                φτιάξουν λογαριασμό!
              </p>
            </div>
          )}

          {!loading && profiles.length > 0 && (
            <div className="profiles-grid">
              {profiles.map((profile) => {
                const isFollowing = followingIds.includes(profile.id);
                return (
                  <div key={profile.id} className="profile-card">
                    <div className="profile-card-left" onClick={() => handleOpenProfile(profile)}>
                      <span className="user-avatar-lg">
                        {(profile.display_name || profile.username)[0]?.toUpperCase()}
                      </span>
                      <div>
                        <div className="profile-card-name">
                          {profile.display_name || profile.username}
                        </div>
                        <div className="profile-card-handle">@{profile.username}</div>
                      </div>
                    </div>

                    <div className="profile-card-actions">
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={() => handleOpenProfile(profile)}
                      >
                        Βιβλιοθήκη
                      </button>
                      <button
                        type="button"
                        className={`btn btn-xs ${isFollowing ? 'btn-ghost' : 'btn-violet'}`}
                        disabled={busyUserId === profile.id}
                        onClick={() => handleToggleFollow(profile)}
                      >
                        {isFollowing ? 'Ακολουθείς ✓' : '+ Follow'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
