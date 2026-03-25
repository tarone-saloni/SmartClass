import { useState, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

const FEATURES = [
  'Manage courses, assignments, and quizzes seamlessly',
  'Real-time feedback and progress tracking',
  'Stay informed with alerts and reminders',
  'Built for teachers and students alike',
];

const STATS = [
  { value: '12k+', label: 'Active learners' },
  { value: '400+', label: 'Courses live' },
  { value: '98%',  label: 'Satisfaction' },
];

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function Login({ onLogin }) {
  const { themeName } = useContext(ThemeContext);
  const [tab, setTab]   = useState('login');
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const isRegister = tab === 'register';

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const url  = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister
        ? { ...form, role }
        : { email: form.email, password: form.password };
      const res  = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const field =
    'w-full px-3.5 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm ' +
    'text-[var(--text)] placeholder:text-[var(--muted)] outline-none transition-all ' +
    'focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10';

  return (
    <div
      data-theme={themeName}
      className="min-h-screen flex items-center justify-center px-4 py-10 bg-[var(--bg)] text-[var(--text)] relative overflow-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@600;700&display=swap');
        @keyframes scFadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scBlob { 0%, 100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(6px,-8px,0) scale(1.05); } }
        .sc-title { font-family: 'Syne', sans-serif; }
        .sc-tab-active { color: var(--accent); border-bottom: 2px solid var(--accent); }
        .sc-tab { color: var(--muted); border-bottom: 2px solid transparent; transition: all .15s; }
        .sc-tab:hover { color: var(--accent); }
        .sc-role-active { border-color: var(--accent) !important; background: color-mix(in srgb, var(--accent) 12%, transparent) !important; color: var(--accent) !important; }
        .sc-btn-primary { background: var(--accent); color: var(--accent-contrast); transition: opacity .15s, transform .1s, box-shadow .15s; box-shadow: 0 10px 24px -12px var(--accent); }
        .sc-btn-primary:hover:not(:disabled) { opacity: .93; transform: translateY(-1px); box-shadow: 0 12px 26px -12px var(--accent); }
        .sc-btn-primary:active { transform: translateY(0); }
        .sc-btn-ghost { background: var(--surface); border: 1px solid var(--border); color: var(--text); transition: background .15s, transform .1s; }
        .sc-btn-ghost:hover { background: color-mix(in srgb, var(--surface) 80%, var(--accent) 8%); transform: translateY(-1px); }
        .sc-feature-item + .sc-feature-item { border-top: 1px solid var(--border); }
        .sc-fade { animation: scFade .35s ease-out both; }
        .sc-fade-up { animation: scFadeUp .45s ease-out both; }
      `}</style>

      {/* animated blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 -top-20 w-72 h-72 rounded-full bg-[var(--accent)]/12 blur-3xl animate-[scBlob_14s_ease-in-out_infinite]" />
        <div className="absolute right-[-4rem] bottom-[-6rem] w-80 h-80 rounded-full bg-[var(--accent)]/10 blur-3xl animate-[scBlob_16s_ease-in-out_infinite]" />
      </div>

      <div className="w-full max-w-5xl grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center relative z-10 sc-fade">
        {/* Brand side */}
        <div className="hidden lg:flex flex-col gap-6 sc-fade-up" style={{ animationDelay: '60ms' }}>
          <div className="flex items-center gap-3.5">
            <div
              className="rounded-2xl flex items-center justify-center text-2xl shadow-md"
              style={{ background: 'var(--accent)', width: 52, height: 52, boxShadow: '0 6px 20px rgba(0,0,0,.12)' }}
            >
              🎓
            </div>
            <div>
              <h1 className="sc-title text-3xl text-[var(--text)]" style={{ letterSpacing: '-0.02em' }}>SmartClass</h1>
              <p className="text-xs text-[var(--muted)] mt-0.5">Modern learning management platform</p>
            </div>
          </div>

          <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.08)] sc-fade-up" style={{ animationDelay: '120ms' }}>
            <div className="px-5 py-4 border-b border-[var(--border)]">
              <p className="text-sm font-semibold text-[var(--text)]">Why SmartClass?</p>
            </div>
            {FEATURES.map((f, i) => (
              <div key={f} className="sc-feature-item flex items-start gap-3 px-5 py-3.5 sc-fade-up" style={{ animationDelay: `${160 + i * 40}ms` }}>
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--accent)' }} />
                <span className="text-sm text-[var(--muted)]">{f}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {STATS.map(({ value, label }, i) => (
              <div
                key={label}
                className="rounded-xl bg-[var(--surface)] border border-[var(--border)] px-4 py-3.5 shadow-[0_1px_6px_rgba(0,0,0,0.06)] sc-fade-up"
                style={{ animationDelay: `${220 + i * 60}ms` }}
              >
                <p className="sc-title text-2xl font-bold" style={{ color: 'var(--accent)' }}>{value}</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Form card */}
        <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.12)] sc-fade-up" style={{ animationDelay: '90ms' }}>
          <div className="flex border-b border-[var(--border)]">
            {[['login', 'Sign in'], ['register', 'Create account']].map(([t, label]) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                className={`flex-1 py-4 text-sm font-semibold bg-transparent cursor-pointer outline-none sc-tab ${tab === t ? 'sc-tab-active' : ''}`}
                style={{ marginBottom: -1, transition: 'color .15s, border-color .15s' }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="p-8 space-y-5">
            <div className="flex items-center gap-3 lg:hidden sc-fade-up" style={{ animationDelay: '140ms' }}>
              <div className="h-10 w-10 rounded-xl flex items-center justify-center text-lg" style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}>🎓</div>
              <div>
                <p className="sc-title text-xl font-bold text-[var(--text)]">SmartClass</p>
                <p className="text-xs text-[var(--muted)]">Learn, manage, and collaborate</p>
              </div>
            </div>

            {isRegister && (
              <div className="grid grid-cols-2 gap-2.5 sc-fade-up" style={{ animationDelay: '170ms' }}>
                {[['student', '📚', 'Student'], ['teacher', '🏫', 'Teacher']].map(([r, icon, label]) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-3 rounded-xl border border-[var(--border)] text-sm font-semibold flex flex-col items-center gap-1 cursor-pointer transition-all outline-none ${role === r ? 'sc-role-active' : 'bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)]/70'}`}
                  >
                    <span style={{ fontSize: 20 }}>{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            )}

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg sc-fade-up" style={{ animationDelay: '190ms' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div className="space-y-1.5 sc-fade-up" style={{ animationDelay: '200ms' }}>
                  <label className="block text-xs font-semibold text-[var(--muted)]">Full name</label>
                  <input
                    className={field}
                    type="text"
                    placeholder="Your full name"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
              )}
              <div className="space-y-1.5 sc-fade-up" style={{ animationDelay: '220ms' }}>
                <label className="block text-xs font-semibold text-[var(--muted)]">Email</label>
                <input
                  className={field}
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5 sc-fade-up" style={{ animationDelay: '240ms' }}>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[var(--muted)]">Password</label>
                  {!isRegister && (
                    <span className="text-xs cursor-pointer text-[var(--accent)]">Forgot password?</span>
                  )}
                </div>
                <input
                  className={field}
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="sc-btn-primary w-full py-3 rounded-xl text-sm font-semibold border-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed sc-fade-up"
                style={{ animationDelay: '260ms' }}
              >
                {loading ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
              </button>
            </form>

            {!isRegister && (
              <>
                <div className="flex items-center gap-3 text-xs text-[var(--muted)] sc-fade-up" style={{ animationDelay: '280ms' }}>
                  <span className="flex-1 h-px bg-[var(--border)]" />
                  or
                  <span className="flex-1 h-px bg-[var(--border)]" />
                </div>
                <button className="sc-btn-ghost w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer sc-fade-up" style={{ animationDelay: '300ms' }}>
                  <GoogleIcon />
                  Continue with Google
                </button>
              </>
            )}

            {isRegister && (
              <p className="text-center text-xs text-[var(--muted)] sc-fade-up" style={{ animationDelay: '300ms' }}>
                By signing up you agree to our{' '}
                <span className="cursor-pointer text-[var(--accent)]">Terms</span>
                {' '}and{' '}
                <span className="cursor-pointer text-[var(--accent)]">Privacy Policy</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;