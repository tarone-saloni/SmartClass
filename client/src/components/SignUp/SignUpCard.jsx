import { useNavigate } from "react-router-dom";
import SignUpForm from "./SignUpForm";
import OtpStep from "./OtpStep";

function SignUpCard({ form, role, setRole, error, loading, otpEmail, setOtpEmail, onSubmit }) {
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
        <div className="h-11 w-11 rounded-xl flex items-center justify-center text-lg 
                        bg-gradient-to-br from-[var(--accent)] to-[color-mix(in_srgb,var(--accent)_60%,#7c3aed)]
                        text-[var(--accent-contrast)] shadow-[0_8px_24px_-8px_var(--accent)]">
          🎓
        </div>
        <div>
          <p className="sc-title text-xl font-extrabold text-[var(--text)]">SmartClass</p>
          <p className="text-[11px] text-[var(--muted)] font-medium">
            {otpEmail ? "Verify your email" : "Create your account"}
          </p>
        </div>
      </div>

      {otpEmail ? (
        <OtpStep email={otpEmail} role={role} onBack={() => setOtpEmail(null)} />
      ) : (
        <SignUpForm
          onSubmit={onSubmit}
          loading={loading}
          error={error}
          role={role}
          setRole={setRole}
        />
      )}
    </div>
  );
}

export default SignUpCard;