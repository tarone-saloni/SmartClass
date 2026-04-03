import SignInForm from "./SignInForm";

function SignInCard({ onSubmit, loading, error }) {
  return (
    <div
      className="lg:flex-1 flex flex-col justify-center px-10 py-10 sm:px-14 sm:py-12
                 bg-[var(--surface)] animate-[slide-up_0.6s_cubic-bezier(0.16,1,0.3,1)_both]"
      style={{ animationDelay: "120ms" }}
    >
      <h2 className="text-2xl font-extrabold text-emerald-500 mb-1 sc-title">
        Welcome back
      </h2>
      <p className="text-sm text-[var(--muted)] mb-8 font-medium">
        Sign in to continue your learning journey
      </p>

      <SignInForm onSubmit={onSubmit} loading={loading} error={error} />
    </div>
  );
}

export default SignInCard;
