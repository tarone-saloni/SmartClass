import { useNavigate } from "react-router-dom";
import BrandHeader from "./BrandHeader";
import SignInForm from "./SignInForm";

function SignInCard({ onSubmit, loading, error }) {
  const navigate = useNavigate();

  return (
    <div
      className="sc-card-premium glass-heavy rounded-2xl overflow-hidden p-8 sm:p-10 
                 animate-[slide-up_0.7s_cubic-bezier(0.16,1,0.3,1)_both]
                 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.15)]"
      style={{ animationDelay: "200ms" }}
    >
      {/* Mobile brand */}
      <div className="flex items-center gap-3 lg:hidden mb-8">
        <div
          className="h-11 w-11 rounded-xl flex items-center justify-center text-lg 
                        bg-gradient-to-br from-[var(--accent)] to-[color-mix(in_srgb,var(--accent)_60%,#7c3aed)] 
                        text-[var(--accent-contrast)] shadow-[0_8px_24px_-8px_var(--accent)]"
        >
          🎓
        </div>
        <div>
          <p className="sc-title text-xl font-extrabold text-[var(--text)]">
            SmartClass
          </p>
          <p className="text-[11px] text-[var(--muted)] font-medium">
            Sign in to your account
          </p>
        </div>
      </div>

      <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] mb-1 sc-title">
        Welcome back
      </h2>
      <p className="text-sm text-[var(--muted)] mb-8 font-medium">
        Sign in to continue your learning journey
      </p>

      <SignInForm onSubmit={onSubmit} loading={loading} error={error} />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border)]/30" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 glass text-[var(--muted)] font-medium rounded-full">
            or
          </span>
        </div>
      </div>

      <p className="text-center text-sm text-[var(--muted)]">
        Don&apos;t have an account?{" "}
        <button
          onClick={() => navigate("/signup")}
          className="text-[var(--accent)] font-bold hover:underline bg-transparent border-none cursor-pointer 
                     active:opacity-70 transition-all duration-200 hover:text-[var(--accent-light)]"
        >
          Create one →
        </button>
      </p>
    </div>
  );
}

export default SignInCard;
