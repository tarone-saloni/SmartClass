import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const FEATURES = [
  {
    icon: "🤖",
    title: "AI-Powered Learning",
    desc: "Smart recommendations, automated quiz generation, and personalized learning paths powered by advanced AI.",
  },
  {
    icon: "📹",
    title: "Live Classes",
    desc: "Real-time interactive sessions with screen sharing, chat, hand-raise, and attendance tracking.",
  },
  {
    icon: "📝",
    title: "Quizzes & Assessments",
    desc: "Create timed quizzes, auto-grade responses, and get detailed analytics on student performance.",
  },
  {
    icon: "📚",
    title: "Course Management",
    desc: "Organize lessons, materials, and assignments in a structured, easy-to-navigate course interface.",
  },
  {
    icon: "📊",
    title: "Analytics Dashboard",
    desc: "Deep insights into enrollment trends, student progress, and content performance for informed decisions.",
  },
  {
    icon: "🔔",
    title: "Smart Notifications",
    desc: "Timely alerts for upcoming classes, quiz deadlines, and course updates to keep everyone on track.",
  },
  {
    icon: "🌙",
    title: "Theme Customization",
    desc: "Choose from multiple themes including light, dark, ocean, and more for a comfortable experience.",
  },
  {
    icon: "🔒",
    title: "Secure & Private",
    desc: "End-to-end encryption, role-based access control, and GDPR-compliant data handling.",
  },
  {
    icon: "📱",
    title: "Fully Responsive",
    desc: "Works seamlessly on desktop, tablet, and mobile so learning is never interrupted on the go.",
  },
];

function Features() {
  const { themeName } = useContext(ThemeContext);

  return (
    <div
      data-theme={themeName}
      className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]"
    >
      <Navbar />

      <main className="flex-1 px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[var(--accent)]/10 text-[var(--accent)] mb-4">
              Platform Features
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[var(--text)] mb-4 leading-tight">
              Everything you need to{" "}
              <span className="text-[var(--accent)]">teach & learn</span>
            </h1>
            <p className="text-[var(--muted)] text-lg max-w-2xl mx-auto">
              SmartClass brings together powerful tools for teachers and
              students in one seamless, intelligent platform.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl border border-[var(--border)]/40 bg-[var(--card)] hover:border-[var(--accent)]/40 hover:shadow-[0_8px_32px_-8px_var(--accent)] transition-all duration-300 group"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-base font-bold text-[var(--text)] mb-2 group-hover:text-[var(--accent)] transition-colors duration-300">
                  {f.title}
                </h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Features;
