import { useState, useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../utils/api.js";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import GlobalStyles from "../components/SignIn/GlobalStyles";
import BackgroundBlur from "../components/SignIn/BackgroundBlur";
import LeftSidebar from "../components/SignIn/LeftSidebar";
import SignInCard from "../components/SignIn/SignInCard";

function SignIn() {
  const themeContext = useContext(ThemeContext);
  const { login } = useAuth();
  const themeName = themeContext?.themeName || "light";

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (form) => {
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/login", {
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
    >
      <GlobalStyles />
      <BackgroundBlur />

      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-5xl grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center animate-in fade-in duration-500">
          <LeftSidebar />
          <SignInCard onSubmit={handleSubmit} loading={loading} error={error} />
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default SignIn;
