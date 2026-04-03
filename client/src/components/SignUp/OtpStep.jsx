import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import OtpInput from "./OtpInput";
import ErrorMessage from "./ErrorMessage";
import { apiFetch } from "../../utils/api.js";

function OtpStep({ email, onBack }) {
  const { login } = useAuth();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) {
      document.getElementById(`otp-${idx + 1}`)?.focus();
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(""));
      document.getElementById("otp-5")?.focus();
    }
    e.preventDefault();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) return setError("Please enter all 6 digits.");
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed.");
      login(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResent(false);
    setError("");
    try {
      const res = await apiFetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend OTP.");
      setResent(true);
      setOtp(["", "", "", "", "", ""]);
      document.getElementById("otp-0")?.focus();
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-400">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--accent)] bg-transparent border-none cursor-pointer mb-6 transition-colors active:opacity-70"
      >
        ← Back
      </button>

      <h2 className="text-2xl font-bold text-[var(--text)] mb-1 sc-title">
        Check your email
      </h2>
      <p className="text-sm text-[var(--muted)] mb-2">
        We sent a 6-digit code to
      </p>
      <p className="text-sm font-semibold text-[var(--accent)] mb-6 truncate">
        {email}
      </p>

      <ErrorMessage error={error} />

      {resent && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-100 px-3 py-2.5 rounded-lg mb-4 animate-in fade-in duration-300">
          New code sent! Check your inbox.
        </div>
      )}

      <form onSubmit={handleVerify}>
        <OtpInput
          otp={otp}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
        />

        <button
          type="submit"
          disabled={loading}
          className="sc-btn-primary w-full py-3 rounded-xl text-sm font-semibold border-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <span className="sc-spinner" />}
          <span>{loading ? "Verifying…" : "Verify & create account"}</span>
        </button>
      </form>

      <p className="text-center text-xs text-[var(--muted)] mt-5">
        Didn&apos;t receive it?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="text-[var(--accent)] font-semibold hover:underline bg-transparent border-none cursor-pointer disabled:opacity-50 active:opacity-70"
        >
          {resending ? "Sending…" : "Resend code"}
        </button>
      </p>
    </div>
  );
}

export default OtpStep;
