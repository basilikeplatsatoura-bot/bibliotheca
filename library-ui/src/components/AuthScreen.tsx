import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../api/client';
import { BookOpenIcon } from './Icons';
import { RoseOrnament } from './RoseOrnament';

interface AuthScreenProps {
  onSuccess: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const cleanUser = username.trim().toLowerCase().replace(/^@+/, '');
        if (!/^[a-z0-9_]{3,20}$/.test(cleanUser)) {
          throw new Error(
            'Το username πρέπει να έχει 3–20 λατινικούς χαρακτήρες, αριθμούς ή _ (π.χ. vasiliki).'
          );
        }
        if (password.length < 6) {
          throw new Error('Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.');
        }

        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              username: cleanUser,
              display_name: displayName.trim() || cleanUser,
            },
          },
        });

        if (signUpErr) {
          if (signUpErr.message.toLowerCase().includes('already registered')) {
            throw new Error('Αυτό το email έχει ήδη λογαριασμό. Δοκίμασε Σύνδεση!');
          }
          throw new Error(signUpErr.message);
        }

        if (!data.session || !data.user) {
          throw new Error(
            'Ο λογαριασμός φτιάχτηκε! Αν σου ζητάει επιβεβαίωση email, κλείσε το "Confirm email" στο Supabase Authentication → Providers → Email.'
          );
        }

        await api.createProfile(data.user.id, cleanUser, displayName.trim() || cleanUser);
        onSuccess();
      } else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInErr) {
          throw new Error('Λάθος email ή κωδικός πρόσβασης.');
        }
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Κάτι πήγε στραβά. Δοκίμασε ξανά.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark auth-brand-mark" aria-hidden="true">
            <BookOpenIcon size={24} />
          </span>
          <h1 className="auth-title">bibliotheca</h1>
          <p className="auth-subtitle">
            Η προσωπική σου βιβλιοθήκη & κοινότητα αναγνωστών
          </p>
        </div>

        <div className="auth-ornament">
          <RoseOrnament width={185} />
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login');
              setError(null);
            }}
          >
            Σύνδεση
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
          >
            Δημιουργία Λογαριασμού
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="auth-username">
                  Username (@)
                </label>
                <input
                  id="auth-username"
                  type="text"
                  className="input-field input-rect"
                  placeholder="π.χ. vasiliki"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="auth-display">
                  Όνομα προφίλ
                </label>
                <input
                  id="auth-display"
                  type="text"
                  className="input-field input-rect"
                  placeholder="π.χ. Βασιλική"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              className="input-field input-rect"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">
              Κωδικός πρόσβασης
            </label>
            <input
              id="auth-password"
              type="password"
              className="input-field input-rect"
              placeholder="Τουλάχιστον 6 χαρακτήρες"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn btn-white auth-submit" disabled={loading}>
            {loading
              ? 'Παρακαλώ περίμενε...'
              : mode === 'signup'
              ? 'Δημιουργία & Είσοδος'
              : 'Σύνδεση'}
          </button>
        </form>
      </div>
    </div>
  );
};
