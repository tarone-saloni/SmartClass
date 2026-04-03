import { useState, useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { apiFetch } from "../utils/api.js";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import GlobalStyles from "../components/SignUp/GlobalStyles";
import BackgroundBlur from "../components/SignUp/BackgroundBlur";
import LeftSidebar from "../components/SignUp/LeftSidebar";
import SignUpCard from "../components/SignUp/SignUpCard";

function SignUp() {
  const { themeName } = useContext(ThemeContext);
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpEmail, setOtpEmail] = useState(null);

  const handleSubmit = async ({ form, role }) => {
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setOtpEmail(form.email);
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
    >
      <GlobalStyles />
      <BackgroundBlur />

      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-5xl grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center animate-in fade-in duration-500">
          <LeftSidebar />
          <SignUpCard
            role={role}
            setRole={setRole}
            error={error}
            loading={loading}
            otpEmail={otpEmail}
            setOtpEmail={setOtpEmail}
            onSubmit={handleSubmit}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default SignUp;
