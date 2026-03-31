import { useEffect, useMemo, useState } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import AnalyzerPage from './pages/AnalyzerPage';
import { getProfile, getStoredSession, getUser, hasSupabaseEnv, signInWithPassword, signOut, signUp } from './lib/supabase';

function NavLink({ to, icon, children }) {
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <Link to={to} className={active ? 'top-nav-link active' : 'top-nav-link'}>
      <i className={`bx ${icon}`} />
      <span>{children}</span>
    </Link>
  );
}

function initialsFromName(name = '', email = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return 'AI';
}

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');

    try {
      if (!hasSupabaseEnv) {
        throw new Error('Supabase environment variables are missing.');
      }

      if (mode === 'signup') {
        const data = await signUp({ email, password, fullName });
        if (data?.access_token) {
          const user = data.user || await getUser(data.access_token);
          onAuthenticated({ session: data, user });
          setNotice('Account created and signed in.');
        } else {
          setNotice('Account created. Check your email if confirmation is enabled, then sign in.');
          setMode('signin');
        }
      } else {
        const data = await signInWithPassword({ email, password });
        const user = data.user || await getUser(data.access_token);
        onAuthenticated({ session: data, user });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card auth-card-wide">
        <div className="auth-brand">
          <div className="brand-logo">AI</div>
          <div>
            <div className="brand-title">ApplyIQ</div>
            <div className="brand-tagline">Supabase connected career workspace</div>
          </div>
        </div>

        <div className="auth-copy">
          <span className="eyebrow auth-eyebrow">{mode === 'signin' ? 'Welcome back' : 'Create your workspace'}</span>
          <h1>Track your job search with real auth and real database storage.</h1>
          <p>Use your Supabase project to sign in, save applications, and keep your pipeline synced instead of stored locally.</p>
        </div>

        <div className="auth-toggle-row">
          <button type="button" className={mode === 'signin' ? 'auth-toggle active' : 'auth-toggle'} onClick={() => setMode('signin')}>Sign in</button>
          <button type="button" className={mode === 'signup' ? 'auth-toggle active' : 'auth-toggle'} onClick={() => setMode('signup')}>Create account</button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' ? (
            <label>
              <span>Full name</span>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" required={mode === 'signup'} />
            </label>
          ) : null}

          <label>
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </label>

          <label>
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters" minLength={6} required />
          </label>

          {error ? <div className="alert error"><i className="bx bx-error-circle" /> {error}</div> : null}
          {notice ? <div className="alert success"><i className="bx bx-check-circle" /> {notice}</div> : null}

          <button type="submit" className="primary-button auth-button" disabled={loading}>
            <i className={`bx ${loading ? 'bx-loader-alt bx-spin' : mode === 'signin' ? 'bx-log-in-circle' : 'bx-user-plus'}`} />
            {loading ? 'Please wait...' : mode === 'signin' ? 'Enter workspace' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const stored = getStoredSession();
        if (!stored?.access_token) {
          if (active) setInitializing(false);
          return;
        }

        const nextUser = stored.user || await getUser(stored.access_token);
        if (!active) return;
        setSession(stored);
        setUser(nextUser);
      } catch (err) {
        if (active) setAuthError(err.message || 'Could not initialize authentication.');
      } finally {
        if (active) setInitializing(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      if (!session?.access_token || !user?.id) {
        setProfile(null);
        return;
      }

      try {
        const nextProfile = await getProfile(user.id, session.access_token);
        if (!active) return;
        setProfile({
          full_name: nextProfile?.full_name || user.user_metadata?.full_name || user.email,
          email: nextProfile?.email || user.email
        });
      } catch {
        if (!active) return;
        setProfile({
          full_name: user.user_metadata?.full_name || user.email,
          email: user.email
        });
      }
    };

    loadProfile();
    return () => {
      active = false;
    };
  }, [session, user]);

  const handleAuthenticated = ({ session: nextSession, user: nextUser }) => {
    setSession(nextSession);
    setUser(nextUser);
    setAuthError('');
  };

  const handleLogout = async () => {
    await signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const initials = useMemo(
    () => initialsFromName(profile?.full_name || user?.user_metadata?.full_name || '', profile?.email || user?.email || ''),
    [profile, user]
  );

  if (initializing) {
    return (
      <div className="auth-shell">
        <div className="auth-card compact-loading-card">
          <div className="brand-logo">AI</div>
          <h2>Loading ApplyIQ…</h2>
          <p>Checking your Supabase session.</p>
        </div>
      </div>
    );
  }

  if (!session || !user) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="linkedin-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand-lockup">
            <div className="brand-logo">AI</div>
            <div>
              <div className="brand-title">ApplyIQ</div>
              <div className="brand-tagline">Supabase career workflow dashboard</div>
            </div>
          </div>

          <nav className="top-nav">
            <NavLink to="/" icon="bx-home-alt-2">Dashboard</NavLink>
            <NavLink to="/analyzer" icon="bx-analyse">Analyzer</NavLink>
          </nav>

          <div className="topbar-actions">
            <div className="topbar-profile card-lite">
              <div className="avatar-chip">{initials}</div>
              <div>
                <strong>{profile?.full_name || user.email}</strong>
                <p>{profile?.email || user.email}</p>
              </div>
            </div>
            <button className="ghost-button logout-button" onClick={handleLogout}>
              <i className="bx bx-log-out-circle" /> Log out
            </button>
          </div>
        </div>
      </header>

      <main className="page-shell">
        <aside className="left-rail">
          <div className="rail-card profile-rail-card">
            <div className="cover-strip" />
            <div className="rail-card-body">
              <div className="profile-avatar-large">{initials}</div>
              <h3>{profile?.full_name || user.email}</h3>
              <p className="muted-text">Track roles, tailor applications, and keep your job search organized in a real authenticated product dashboard.</p>
              <div className="rail-metrics">
                <div>
                  <span>Database</span>
                  <strong>Supabase</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>Signed in</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="rail-card quick-links-card">
            <h4>Workspace</h4>
            <div className="quick-link-list">
              <Link to="/" className="quick-link-item"><i className="bx bx-briefcase-alt-2" /> Applications</Link>
              <Link to="/analyzer" className="quick-link-item"><i className="bx bx-search-alt-2" /> Keyword matching</Link>
              <div className="quick-link-item static"><i className="bx bx-lock-alt" /> Auth protected</div>
            </div>
          </div>
        </aside>

        <section className="center-feed">
          {authError ? <div className="alert error"><i className="bx bx-error-circle" /> {authError}</div> : null}
          <Routes>
            <Route path="/" element={<DashboardPage session={session} user={user} />} />
            <Route path="/analyzer" element={<AnalyzerPage />} />
          </Routes>
        </section>

      </main>
    </div>
  );
}
