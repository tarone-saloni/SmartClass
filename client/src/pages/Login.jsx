import { useState } from 'react';

function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const url = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister ? { ...form, role } : { email: form.email, password: form.password };
      const res = await fetch(url, {
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

  const inputCls = 'w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500 transition-colors';

  return (
    <div className="flex min-h-screen">
      {/* Brand side */}
      <div className="hidden md:flex flex-1 flex-col items-center justify-center px-16 bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
        <div className="text-6xl mb-5">🎓</div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-3">SmartClass</h1>
        <p className="text-lg opacity-80 text-center max-w-xs leading-relaxed">
          Your modern learning management platform
        </p>
        <ul className="mt-10 w-full max-w-xs">
          {[
            'Video lectures & study materials',
            'Assignments & submissions',
            'Interactive quizzes',
            'Progress tracking',
            'Real-time notifications',
          ].map(f => (
            <li key={f} className="flex items-center gap-3 py-3 border-b border-white/15 last:border-0 text-sm">
              <span className="w-2 h-2 rounded-full bg-white/80 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Form side */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-10 py-16">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-1.5">
            {isRegister ? 'Create account' : 'Welcome back'}
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            {isRegister ? 'Join SmartClass today' : 'Sign in to continue learning'}
          </p>

          {isRegister && (
            <div className="flex gap-3 mb-6">
              {[['student', '🎒 Student'], ['teacher', '👨‍🏫 Teacher']].map(([r, label]) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    role === r
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                      : 'border-gray-200 text-gray-500 bg-white hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-3.5 py-2.5 rounded-lg mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Full Name</label>
                <input className={inputCls} type="text" placeholder="Your full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
              <input className={inputCls} type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
              <input className={inputCls} type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg text-sm font-semibold border-none cursor-pointer disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-500">
            {isRegister ? 'Already have an account? ' : "Don't have an account? "}
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-indigo-600 font-semibold hover:underline bg-transparent border-none cursor-pointer text-sm"
            >
              {isRegister ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
