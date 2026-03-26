import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RoleSelector from "./RoleSelector";
import ErrorMessage from "./ErrorMessage";

function SignUpForm({ onSubmit, loading, error, role, setRole }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const field =
    "w-full px-4 py-3 rounded-xl border border-[var(--border)]/60 glass text-sm " +
    "text-[var(--text)] placeholder:text-[var(--muted)]/50 outline-none transition-all duration-300 " +
    "focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/12 hover:border-[var(--accent)]/30 " +
    "focus:shadow-[0_4px_16px_-4px_var(--accent)]";

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ form, role });
  };

  return (
    <>
      <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] mb-1 sc-title">
        Get started
      </h2>
      <p className="text-sm text-[var(--muted)] mb-8 font-medium">Join thousands of learners today</p>

      <RoleSelector role={role} setRole={setRole} />

      <ErrorMessage error={error} />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2 sc-input-wrap">
          <label className="block text-xs font-bold text-[var(--text)] uppercase tracking-wider ml-1">Full name</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] text-sm">👤</span>
            <input
              className={`${field} pl-10`}
              type="text"
              placeholder="Your full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="space-y-2 sc-input-wrap">
          <label className="block text-xs font-bold text-[var(--text)] uppercase tracking-wider ml-1">Email</label>
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
          <label className="block text-xs font-bold text-[var(--text)] uppercase tracking-wider ml-1">Password</label>
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

        <button
          type="submit"
          disabled={loading}
          className="sc-btn-glow w-full py-3.5 rounded-xl text-sm font-bold cursor-pointer 
                     disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
                     flex items-center justify-center gap-2.5 mt-2"
        >
          {loading && <span className="sc-spinner" />}
          <span>{loading ? "Sending code…" : "Create account"}</span>
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border)]/30" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 glass text-[var(--muted)] font-medium rounded-full">or</span>
        </div>
      </div>

      <p className="text-center text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <button
          onClick={() => navigate("/signin")}
          className="text-[var(--accent)] font-bold hover:underline bg-transparent border-none cursor-pointer 
                     active:opacity-70 transition-all duration-200"
        >
          Sign in →
        </button>
      </p>

      <p className="text-center text-[10px] text-[var(--muted)] mt-4 leading-relaxed">
        By signing up you agree to our{" "}
        <button
          onClick={() => navigate("/terms")}
          className="text-[var(--accent)]/80 hover:underline bg-transparent border-none cursor-pointer active:opacity-70"
        >
          Terms
        </button>{" "}
        and{" "}
        <button
          onClick={() => navigate("/privacy")}
          className="text-[var(--accent)]/80 hover:underline bg-transparent border-none cursor-pointer active:opacity-70"
        >
          Privacy Policy
        </button>
      </p>
    </>
  );
}

export default SignUpForm;