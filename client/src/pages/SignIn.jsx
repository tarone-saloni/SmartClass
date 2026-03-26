import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const FEATURES = [
  "Manage courses, assignments, and quizzes seamlessly",
  "Real-time feedback and progress tracking",
  "Stay informed with alerts and reminders",
  "Built for teachers and students alike",
];

const STATS = [
  { value: "12k+", label: "Active learners" },
  { value: "400+", label: "Courses live" },
  { value: "98%", label: "Satisfaction" },
];

function SignIn() {
  const navigate = useNavigate();
  const themeContext = useContext(ThemeContext);
  const { login } = useAuth();
  const themeName = themeContext?.themeName || "light";

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const field =
    "w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] text-sm " +
    "text-[var(--text)] placeholder:text-[var(--muted)] outline-none transition-all duration-200 " +
    "focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/12 hover:border-[var(--accent)]/40";


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      login(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-theme={themeName}
      className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] relative overflow-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@600;700;800&display=swap');
        .sc-title { font-family: 'Syne', sans-serif; letter-spacing: -0.02em; }
        .sc-card { position: relative; isolation: isolate; backdrop-filter: blur(8px); }
        .sc-card::before { content: ""; position: absolute; inset: -1px; border-radius: 1rem; background: conic-gradient(from 0deg, transparent, color-mix(in srgb, var(--accent) 45%, transparent), transparent 35%); filter: blur(10px); opacity: .22; z-index: -1; }
        .sc-btn-primary { position: relative; overflow: hidden; background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 72%, #7c3aed)); color: var(--accent-contrast); transition: opacity .15s, transform .1s, box-shadow .15s; box-shadow: 0 16px 30px -16px var(--accent); }
        .sc-btn-primary:hover:not(:disabled) { opacity: .96; transform: translateY(-1px); box-shadow: 0 18px 34px -16px var(--accent); }
        .sc-btn-ghost { background: color-mix(in srgb, var(--surface) 88%, transparent); border: 1px solid var(--border); color: var(--text); transition: background .15s, transform .1s, border-color .15s; }
        .sc-btn-ghost:hover { background: color-mix(in srgb, var(--surface) 78%, var(--accent) 8%); border-color: color-mix(in srgb, var(--accent) 45%, var(--border)); transform: translateY(-1px); }
        .sc-input-wrap { transition: transform .16s ease, box-shadow .16s ease; border-radius: .85rem; }
        .sc-input-wrap:focus-within { transform: translateY(-1px); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 14%, transparent); }
        .sc-spinner { width: 14px; height: 14px; border-radius: 9999px; border: 2px solid rgba(255,255,255,.45); border-top-color: #fff; animation: spin .8s linear infinite; }
      `}</style>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 -top-24 w-80 h-80 rounded-full bg-[var(--accent)]/15 blur-3xl animate-pulse" />
        <div className="absolute right-[-5rem] bottom-[-7rem] w-96 h-96 rounded-full bg-[var(--accent)]/10 blur-3xl animate-pulse" />
      </div>

      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-5xl grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center animate-in fade-in duration-500">

          {/* Left side - Features */}
          <div className="hidden lg:flex flex-col gap-6 animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_10px_30px_-10px_var(--accent)] animate-bounce">
                🎓
              </div>
              <div>
                <h1 className="sc-title text-3xl font-bold text-[var(--text)]">SmartClass</h1>
                <p className="text-xs text-[var(--muted)] mt-0.5">Modern learning management</p>
              </div>
            </div>

            <div className="rounded-2xl bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] border border-[var(--border)] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
              <div className="px-5 py-4 border-b border-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text)]">Why SmartClass?</p>
              </div>
              {FEATURES.map((f, i) => (
                <div
                  key={f}
                  className="flex items-start gap-3 px-5 py-3.5 border-b border-[var(--border)]/50 last:border-0 hover:bg-[var(--accent)]/6 transition-colors animate-in fade-in slide-in-from-left-8 duration-500"
                  style={{ animationDelay: `${120 + i * 60}ms` }}
                >
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 bg-[var(--accent)]" />
                  <span className="text-sm text-[var(--muted)]">{f}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {STATS.map(({ value, label }, i) => (
                <div
                  key={label}
                  className="rounded-xl bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] border border-[var(--border)] px-4 py-3.5 shadow-[0_1px_8px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all animate-in fade-in slide-in-from-left-8 duration-500"
                  style={{ animationDelay: `${240 + i * 80}ms` }}
                >
                  <p className="sc-title text-2xl font-bold text-[var(--accent)]">{value}</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Sign In Form */}
          <div
            className="rounded-2xl bg-[color-mix(in_srgb,var(--surface)_84%,transparent)] border border-[var(--border)] overflow-hidden shadow-[0_12px_44px_rgba(0,0,0,0.14)] sc-card p-8 animate-in fade-in slide-in-from-right-8 duration-700"
            style={{ animationDelay: "200ms" }}
          >
            <div className="flex items-center gap-3 lg:hidden mb-6">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center text-lg bg-[var(--accent)] text-[var(--accent-contrast)]">🎓</div>
              <div>
                <p className="sc-title text-xl font-bold text-[var(--text)]">SmartClass</p>
                <p className="text-xs text-[var(--muted)]">Sign in to your account</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-[var(--text)] mb-1 sc-title">Welcome back</h2>
            <p className="text-sm text-[var(--muted)] mb-6">Sign in to continue learning</p>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg mb-4 animate-in fade-in duration-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5 sc-input-wrap">
                <label className="block text-xs font-semibold text-[var(--muted)]">Email</label>
                <input
                  className={field}
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5 sc-input-wrap">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[var(--muted)]">Password</label>
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-xs text-[var(--accent)] hover:underline bg-transparent border-none cursor-pointer active:opacity-70"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <input
                    className={`${field} pr-12`}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 text-[var(--muted)] hover:text-[var(--accent)] bg-transparent border-none cursor-pointer active:opacity-70"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="sc-btn-primary w-full py-3 rounded-xl text-sm font-semibold border-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
              >
                {loading && <span className="sc-spinner" />}
                <span>{loading ? "Signing in…" : "Sign in"}</span>
              </button>
            </form>

            <p className="text-center text-xs text-[var(--muted)] mt-6">
              Don&apos;t have an account?{" "}
              <button
                onClick={() => navigate("/signup")}
                className="text-[var(--accent)] font-semibold hover:underline bg-transparent border-none cursor-pointer active:opacity-70"
              >
                Create one
              </button>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default SignIn;
