import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from './lib/supabase';
import { api, computeCategories } from './api/client';
import Catalog from './pages/Catalog';
import { Community } from './pages/Community';
import { AuthScreen } from './components/AuthScreen';
import { ToastContainer } from './components/Toast';
import {
  BookOpenIcon,
  BookmarkIcon,
  CompassIcon,
  HeartIcon,
  LogOutIcon,
  MessageIcon,
  PlusIcon,
  TagIcon,
  UsersIcon,
} from './components/Icons';
import { RoseOrnament } from './components/RoseOrnament';
import type { Book, Profile, ToastMessage } from './types';

export type ShelfFilter = 'all' | 'reading' | 'want_to_read' | 'read' | 'favorites' | 'reviews';

export function App() {
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importingCollection, setImportingCollection] = useState(false);

  const [mainView, setMainView] = useState<'library' | 'community'>('library');
  const [activeShelf, setActiveShelf] = useState<ShelfFilter>('all');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [createTrigger, setCreateTrigger] = useState<number>(0);

  // Social follow stats
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const notify = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, text, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const loadUserSession = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setProfile(null);
        setBooks([]);
        setAuthReady(true);
        return;
      }

      const meta = session.user.user_metadata || {};
      const hint =
        (meta.username as string) ||
        session.user.email?.split('@')[0] ||
        'reader';
      const displayName = (meta.display_name as string) || hint;

      const userProfile = await api.ensureProfile(session.user.id, hint, displayName);
      setProfile(userProfile);
      setAuthReady(true);
    } catch {
      setAuthReady(true);
    }
  }, []);

  useEffect(() => {
    loadUserSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUserSession();
    });
    return () => subscription.unsubscribe();
  }, [loadUserSession]);

  const fetchLibrary = useCallback(async () => {
    if (!profile) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getUserBooks(profile.id);
      setBooks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Αποτυχία φόρτωσης βιβλιοθήκης');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  const fetchFollowStats = useCallback(async () => {
    if (!profile) return;
    try {
      const stats = await api.getFollowStats(profile.id);
      setFollowingIds(stats.followingIds);
      setFollowersCount(stats.followersCount);
      setFollowingCount(stats.followingCount);
    } catch {
      // ignore follow stats error
    }
  }, [profile]);

  useEffect(() => {
    if (profile) {
      fetchLibrary();
      fetchFollowStats();
    }
  }, [profile, fetchLibrary, fetchFollowStats]);

  const categories = useMemo(() => computeCategories(books), [books]);

  const readingCount = books.filter((b) => b.status === 'reading').length;
  const wantCount = books.filter((b) => b.status === 'want_to_read').length;
  const readCount = books.filter((b) => b.status === 'read').length;
  const favCount = books.filter((b) => b.is_favorite).length;
  const reviewsCount = books.filter(
    (b) => b.rating > 0 || (b.notes && b.notes.trim().length > 0)
  ).length;

  const handleSelectShelf = (shelf: ShelfFilter) => {
    setMainView('library');
    setActiveShelf(shelf);
    setActiveCategory('');
  };

  const handleSelectCategory = (catName: string) => {
    setMainView('library');
    setActiveCategory((prev) => (prev === catName ? '' : catName));
    setActiveShelf('all');
  };

  const handleImportCollection = async () => {
    if (!profile) return;
    try {
      setImportingCollection(true);
      const count = await api.importMyCollection(profile.id);
      notify(`Εισήχθησαν και τα ${count} βιβλία σου στον λογαριασμό σου!`);
      await fetchLibrary();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Αποτυχία εισαγωγής', 'error');
    } finally {
      setImportingCollection(false);
    }
  };

  const handleCopyFriendBook = async (book: Book) => {
    if (!profile) return;
    try {
      await api.createBook(profile.id, {
        title: book.title,
        author: book.author,
        category: book.category,
        status: 'want_to_read',
        rating: 0,
        is_favorite: false,
        notes: '',
        cover_url: book.cover_url,
      });
      notify(`Το «${book.title}» προστέθηκε στο «Θέλω να διαβάσω» σου!`);
      await fetchLibrary();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Αποτυχία προσθήκης', 'error');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setBooks([]);
    setMainView('library');
  };

  if (!authReady) {
    return (
      <div className="auth-page">
        <div className="empty-state">Φόρτωση Bibliotheca...</div>
      </div>
    );
  }

  if (!profile) {
    return <AuthScreen onSuccess={loadUserSession} />;
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <BookOpenIcon size={20} />
          </span>
          <span className="brand-title">bibliotheca</span>
        </div>

        <button
          className="sidebar-cta"
          onClick={() => {
            setMainView('library');
            setCreateTrigger((c) => c + 1);
          }}
        >
          <PlusIcon size={17} />
          <span>Νέο Βιβλίο</span>
        </button>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Πλοήγηση</div>
          <nav className="sidebar-nav" aria-label="Κύρια πλοήγηση">
            <button
              className={`sidebar-link ${
                mainView === 'library' && activeShelf === 'all' && !activeCategory ? 'active' : ''
              }`}
              onClick={() => handleSelectShelf('all')}
            >
              <CompassIcon />
              <span>Όλα τα Βιβλία</span>
              <span className="sidebar-count">{books.length}</span>
            </button>

            <button
              className={`sidebar-link ${mainView === 'community' ? 'active' : ''}`}
              onClick={() => setMainView('community')}
            >
              <UsersIcon />
              <span>Κοινότητα & Φίλοι</span>
              {followingCount > 0 && <span className="sidebar-badge">{followingCount}</span>}
            </button>

            <button
              className={`sidebar-link ${
                mainView === 'library' && activeShelf === 'reading' ? 'active' : ''
              }`}
              onClick={() => handleSelectShelf('reading')}
            >
              <BookOpenIcon size={17} />
              <span>Διαβάζω τώρα</span>
              {readingCount > 0 && <span className="sidebar-badge">{readingCount}</span>}
            </button>

            <button
              className={`sidebar-link ${
                mainView === 'library' && activeShelf === 'want_to_read' ? 'active' : ''
              }`}
              onClick={() => handleSelectShelf('want_to_read')}
            >
              <BookmarkIcon />
              <span>Θέλω να διαβάσω</span>
              <span className="sidebar-count">{wantCount}</span>
            </button>

            <button
              className={`sidebar-link ${
                mainView === 'library' && activeShelf === 'read' ? 'active' : ''
              }`}
              onClick={() => handleSelectShelf('read')}
            >
              <BookOpenIcon size={17} />
              <span>Διαβασμένα</span>
              <span className="sidebar-count">{readCount}</span>
            </button>

            <button
              className={`sidebar-link ${
                mainView === 'library' && activeShelf === 'favorites' ? 'active' : ''
              }`}
              onClick={() => handleSelectShelf('favorites')}
            >
              <HeartIcon size={17} filled={mainView === 'library' && activeShelf === 'favorites'} />
              <span>Αγαπημένα</span>
              {favCount > 0 && <span className="sidebar-count">{favCount}</span>}
            </button>

            <button
              className={`sidebar-link ${
                mainView === 'library' && activeShelf === 'reviews' ? 'active' : ''
              }`}
              onClick={() => handleSelectShelf('reviews')}
            >
              <MessageIcon size={16} />
              <span>Σχόλια & Αστέρια</span>
              {reviewsCount > 0 && <span className="sidebar-count">{reviewsCount}</span>}
            </button>
          </nav>
        </div>

        {categories.length > 0 && (
          <div className="sidebar-section sidebar-categories">
            <div className="sidebar-section-title">Κατηγορίες</div>
            <nav className="sidebar-nav" aria-label="Κατηγορίες βιβλίων">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  className={`sidebar-link sidebar-cat-link ${
                    mainView === 'library' && activeCategory === cat.name ? 'active' : ''
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
        )}

        <div className="sidebar-footer">
          <div className="sidebar-ornament">
            <RoseOrnament width={165} />
          </div>
          <div className="account-card">
            <div className="account-card-top">
              <span className="user-avatar-mini">
                {(profile.display_name || profile.username)[0]?.toUpperCase()}
              </span>
              <div className="account-card-info">
                <div className="account-card-name">{profile.display_name || profile.username}</div>
                <div className="account-card-handle">@{profile.username}</div>
              </div>
              <button
                type="button"
                className="btn btn-icon"
                onClick={handleSignOut}
                title="Αποσύνδεση"
                aria-label="Αποσύνδεση"
              >
                <LogOutIcon size={15} />
              </button>
            </div>
            <div className="account-follow-stats">
              <span>
                <strong>{followersCount}</strong> Followers
              </span>
              <span>·</span>
              <span>
                <strong>{followingCount}</strong> Following
              </span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-workspace">
        <div className="ornament-divider" aria-hidden="true">
          <span className="ornament-line" />
          <RoseOrnament width={220} className="ornament-svg" />
          <span className="ornament-line reverse" />
        </div>

        {mainView === 'library' ? (
          <Catalog
            userId={profile.id}
            books={books}
            categories={categories}
            loading={loading}
            error={error}
            activeShelf={activeShelf}
            activeCategory={activeCategory}
            createTrigger={createTrigger}
            importingCollection={importingCollection}
            onImportCollection={handleImportCollection}
            onSelectShelf={handleSelectShelf}
            onSelectCategory={handleSelectCategory}
            onRefresh={fetchLibrary}
            onNotify={notify}
          />
        ) : (
          <Community
            myProfile={profile}
            followingIds={followingIds}
            onFollowChange={fetchFollowStats}
            onCopyBookToMine={handleCopyFriendBook}
            onNotify={notify}
          />
        )}

        <footer className="page-footer-embrace">
          <div className="ornament-divider" aria-hidden="true">
            <span className="ornament-line" />
            <RoseOrnament width={200} className="ornament-svg" />
            <span className="ornament-line reverse" />
          </div>
          <span className="page-footer-caption">bibliotheca · κοινότητα & προσωπική βιβλιοθήκη</span>
        </footer>
      </main>

      <ToastContainer toasts={toasts} />

      {/* Native-style Bottom Tab Bar for Mobile / iPhone */}
      <nav className="mobile-bottom-nav" aria-label="Κάτω πλοήγηση κινητού">
        <button
          type="button"
          className={`bottom-tab ${
            mainView === 'library' && activeShelf !== 'favorites' && activeShelf !== 'reviews'
              ? 'active'
              : ''
          }`}
          onClick={() => handleSelectShelf('all')}
        >
          <CompassIcon size={20} />
          <span>Βιβλιοθήκη</span>
        </button>

        <button
          type="button"
          className={`bottom-tab ${
            mainView === 'library' && activeShelf === 'favorites' ? 'active' : ''
          }`}
          onClick={() => handleSelectShelf('favorites')}
        >
          <HeartIcon size={20} filled={mainView === 'library' && activeShelf === 'favorites'} />
          <span>Αγαπημένα</span>
        </button>

        <button
          type="button"
          className="bottom-tab-add"
          onClick={() => {
            setMainView('library');
            setCreateTrigger((c) => c + 1);
          }}
          aria-label="Νέο Βιβλίο"
        >
          <PlusIcon size={22} />
        </button>

        <button
          type="button"
          className={`bottom-tab ${
            mainView === 'library' && activeShelf === 'reviews' ? 'active' : ''
          }`}
          onClick={() => handleSelectShelf('reviews')}
        >
          <MessageIcon size={20} />
          <span>Σχόλια</span>
        </button>

        <button
          type="button"
          className={`bottom-tab ${mainView === 'community' ? 'active' : ''}`}
          onClick={() => setMainView('community')}
        >
          <UsersIcon size={20} />
          <span>Κοινότητα</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
