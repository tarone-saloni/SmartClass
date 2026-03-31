import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const COOKIE_TYPES = [
  {
    type: "Essential",
    icon: "🔑",
    required: true,
    desc: "These cookies are strictly necessary for SmartClass to function. They manage your login session and keep you securely authenticated. They cannot be disabled.",
    examples: [
      "session_token — keeps you logged in",
      "csrf_token — prevents cross-site request forgery",
    ],
  },
  {
    type: "Preferences",
    icon: "🎨",
    required: false,
    desc: "These cookies remember your choices like selected theme, language preference, and notification settings so you don't have to set them again on each visit.",
    examples: [
      "smartclass_theme — your selected UI theme",
      "locale — your preferred language",
    ],
  },
  {
    type: "Analytics",
    icon: "📊",
    required: false,
    desc: "We use privacy-respecting analytics to understand how users interact with SmartClass. This helps us fix bugs and prioritise improvements. All data is aggregated and anonymised.",
    examples: [
      "_sc_session — anonymised session identifier",
      "_sc_referrer — page that referred you",
    ],
  },
  {
    type: "Marketing",
    icon: "📣",
    required: false,
    desc: "We currently do not use marketing or advertising cookies. If this changes, we will update this policy and ask for your consent.",
    examples: [],
  },
];

function Cookies() {
  const { themeName } = useContext(ThemeContext);

  return (
    <div
      data-theme={themeName}
      className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]"
    >
      <Navbar />

      <main className="flex-1 px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[var(--accent)]/10 text-[var(--accent)] mb-4">
              Legal
            </span>
            <h1 className="text-4xl font-extrabold text-[var(--text)] mb-2">
              Cookie Policy
            </h1>
            <p className="text-sm text-[var(--muted)]">
              Last updated: March 1, 2026
            </p>
          </div>

          <p className="text-sm text-[var(--muted)] leading-relaxed mb-10 p-5 rounded-xl border border-[var(--border)]/40 bg-[var(--card)]">
            Cookies are small text files stored on your device when you visit a
            website. SmartClass uses cookies to keep you signed in, remember
            your preferences, and understand how the platform is used. This page
            explains what cookies we use and how you can control them.
          </p>

          <div className="space-y-6 mb-12">
            {COOKIE_TYPES.map((c) => (
              <div
                key={c.type}
                className="p-6 rounded-2xl border border-[var(--border)]/40 bg-[var(--card)]"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{c.icon}</span>
                    <h3 className="font-bold text-[var(--text)]">
                      {c.type} Cookies
                    </h3>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      c.required
                        ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                        : "border border-[var(--border)]/50 text-[var(--muted)]"
                    }`}
                  >
                    {c.required ? "Always On" : "Optional"}
                  </span>
                </div>
                <p className="text-sm text-[var(--muted)] leading-relaxed mb-3">
                  {c.desc}
                </p>
                {c.examples.length > 0 && (
                  <ul className="space-y-1">
                    {c.examples.map((ex) => (
                      <li
                        key={ex}
                        className="text-xs text-[var(--muted)] font-mono bg-[var(--bg)] px-3 py-1.5 rounded-lg border border-[var(--border)]/30"
                      >
                        {ex}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-[var(--text)] mb-2">
                How to Control Cookies
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                You can manage cookie preferences through your browser settings.
                Note that disabling essential cookies will prevent SmartClass
                from working correctly. For Chrome, Firefox, Safari, and Edge,
                you'll find cookie controls under Privacy & Security settings.
              </p>
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text)] mb-2">
                Changes to This Policy
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                We may update this Cookie Policy to reflect changes in our
                practices. We will notify you of significant changes through a
                notice on the platform or via email.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Cookies;
