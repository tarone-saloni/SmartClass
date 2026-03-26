import { useState } from "react";
import { useNavigate } from "react-router-dom";

function SignInForm({ onSubmit, loading, error }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const field =
    "w-full px-4 py-3 rounded-xl border border-[var(--border)]/60 glass text-sm " +
    "text-[var(--text)] placeholder:text-[var(--muted)]/50 outline-none transition-all duration-300 " +
    "focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/12 hover:border-[var(--accent)]/30 " +
    "focus:shadow-[0_4px_16px_-4px_var(--accent)]";

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2 sc-input-wrap">
        <label className="block text-xs font-bold text-[var(--text)] uppercase tracking-wider ml-1">
          Email
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] text-sm">📧</span>
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
          <label className="block text-xs font-bold text-[var(--text)] uppercase tracking-wider ml-1">
            Password
          </label>
          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            className="text-[11px] text-[var(--accent)] hover:underline bg-transparent border-none cursor-pointer 
                       active:opacity-70 font-semibold"
          >
            Forgot?
          </button>
        </div>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] text-sm">🔒</span>
          <input
            className={`${field} pl-10 pr-14`}
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] px-2 py-1 text-[var(--muted)] 
                       hover:text-[var(--accent)] bg-[var(--bg)]/50 rounded-md border border-[var(--border)]/30
                       cursor-pointer active:opacity-70 font-bold uppercase tracking-wider transition-all duration-200"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <ErrorMessage error={error} />

      <button
        type="submit"
        disabled={loading}
        className="sc-btn-glow w-full py-3.5 rounded-xl text-sm font-bold cursor-pointer 
                   disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
                   flex items-center justify-center gap-2.5 mt-2"
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
    <div className="text-sm text-red-500 bg-red-500/8 border border-red-500/20 px-4 py-3 rounded-xl 
                    animate-[scale-in_0.3s_cubic-bezier(0.16,1,0.3,1)_both] flex items-center gap-2 font-medium">
      <span>⚠️</span>
      {error}
    </div>
  );
}

export default SignInForm;