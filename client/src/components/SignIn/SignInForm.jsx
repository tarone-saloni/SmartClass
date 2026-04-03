import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

function SignInForm({ onSubmit, loading, error }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const field =
    "w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-sm " +
    "text-[var(--text)] placeholder:text-[var(--muted)] outline-none transition-all duration-300 " +
    "focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10 hover:border-[var(--accent)]/60 " +
    "focus:shadow-[0_4px_16px_-4px_color-mix(in_srgb,var(--accent)_15%,transparent)]";

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2 sc-input-wrap">
        <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider ml-1">
          Email
        </label>
        <div className="relative">
          <Mail
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
          />
          <input
            className={`${field} pl-10`}
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2 sc-input-wrap">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider ml-1">
            Password
          </label>
          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            className="text-xs text-[var(--accent)] hover:underline bg-transparent border-none
                       cursor-pointer active:opacity-70 font-semibold hover:text-[var(--accent-light)] transition-colors duration-200"
          >
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <Lock
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
          />
          <input
            className={`${field} pl-10 pr-11`}
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]
                       hover:text-[var(--accent)] cursor-pointer active:opacity-70 transition-colors duration-200 p-0.5"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <ErrorMessage error={error} />

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-xl text-sm font-bold cursor-pointer text-white
                   bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]
                   disabled:opacity-60 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2.5 mt-2
                   transition-all duration-300 shadow-[0_8px_24px_-8px_rgba(5,150,105,0.5)]
                   hover:shadow-[0_12px_32px_-8px_rgba(5,150,105,0.6)] hover:-translate-y-0.5"
      >
        {loading && <span className="sc-spinner" />}
        <span>{loading ? "Signing in…" : "Sign in"}</span>
      </button>
    </form>
  );
}

function ErrorMessage({ error }) {
  if (!error) return null;
  return (
    <div
      className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-4 py-3 rounded-xl
                    animate-[scale-in_0.3s_cubic-bezier(0.16,1,0.3,1)_both] flex items-center gap-2 font-medium"
    >
      <span>⚠️</span>
      {error}
    </div>
  );
}

export default SignInForm;
