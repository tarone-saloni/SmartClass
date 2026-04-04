import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const features = [
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        width="28"
        height="28"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    title: "Manage courses, assignments and quizzes seamlessly",
    desc: "Empower students to efficiently handle all academic tasks.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        width="28"
        height="28"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
    title: "Real time feedback and progress tracking",
    desc: "Monitor student growth and provide timely guidance and correction.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        width="28"
        height="28"
      >
        <rect x="3" y="3" width="18" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
    title: "Access a vast library of digital resources",
    desc: "Never miss deadlines with proactive notifications.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        width="28"
        height="28"
      >
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
      </svg>
    ),
    title: "Get certified and build your bright career",
    desc: "Designed to simplify instructional workflows and classroom.",
  },
];

const detailedFeatures = [
  {
    icon: "🎓",
    title: "Interactive Learning Platform",
    desc: "Learn at your own pace with interactive courses, videos, and quizzes designed by industry experts.",
  },
  {
    icon: "👨‍🏫",
    title: "Expert Instructors",
    desc: "Learn from experienced professionals and industry leaders who bring real-world knowledge to every lesson.",
  },
  {
    icon: "📊",
    title: "Performance Analytics",
    desc: "Track your progress with detailed analytics and get personalized recommendations to improve.",
  },
  {
    icon: "🏆",
    title: "Certificates & Recognition",
    desc: "Earn recognized certificates upon course completion to boost your professional profile.",
  },
  {
    icon: "💬",
    title: "Community Support",
    desc: "Connect with peers, ask questions, and share knowledge in our vibrant learning community.",
  },
  {
    icon: "🔐",
    title: "Secure & Private",
    desc: "Your data is encrypted and protected. We prioritize your privacy and security at all times.",
  },
];

export default function LearningHero() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-500 flex flex-col">
        {/* ── HERO SECTION ── */}
        <section className="flex flex-col lg:flex-row items-center justify-between gap-10 px-6 sm:px-10 lg:px-20 py-16 lg:py-24 flex-1">
          {/* LEFT: Text Content */}
          <div
            className={`w-full lg:max-w-xl transition-all duration-700 ease-out
              ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"}`}
          >
            {/* Eyebrow label */}
            <p className="text-emerald-600 dark:text-emerald-500 text-xs sm:text-sm font-semibold uppercase tracking-widest mb-4">
              Start your favourite course
            </p>

            {/* Main heading */}
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--text)] leading-snug mb-6">
              Now learning from anywhere, and build your{" "}
              <span className="text-emerald-600 dark:text-emerald-400 relative inline-block">
                bright career.
                {/* SVG underline decoration */}
                <svg
                  viewBox="0 0 200 18"
                  className="absolute -bottom-2 left-0 w-full h-4"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M4 12 C 50 4, 150 4, 196 12"
                    stroke="#3a7d44"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            {/* Body copy */}
            <p className="text-[var(--text-secondary)] text-base sm:text-lg leading-relaxed mb-8 max-w-md">
              It has survived not only five centuries but also the leap into
              electronic typesetting.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/signup")}
                className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-semibold text-sm sm:text-base px-7 py-3 rounded-lg transition-colors duration-200 cursor-pointer"
              >
                Get Started
              </button>
              <button className="border-2 border-emerald-600 dark:border-emerald-500 text-[var(--text)] hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 font-semibold text-sm sm:text-base px-7 py-3 rounded-lg transition-all duration-200 cursor-pointer">
                Explore Courses
              </button>
            </div>
          </div>

          {/* RIGHT: Decorative visual */}
          <div
            className={`w-full lg:flex-1 relative flex items-center justify-center
              h-80 sm:h-96 lg:h-[420px]
              transition-all duration-700 ease-out delay-150
              ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}
          >
            {/* Organic green blob */}
            <div className="absolute right-1/4 top-1/4 w-56 h-56 sm:w-72 sm:h-72 bg-gradient-to-br from-green-100 to-green-300 opacity-50 -z-10 rounded-[60%_40%_70%_30%/50%_60%_40%_50%]" />

            {/* Floating stats card */}
            <div className="absolute top-4 left-0 sm:left-4 z-20 flex items-center gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-4 py-3 shadow-xl">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-[var(--text)] leading-none">
                  125k+ Students
                </p>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  enrolled this month
                </p>
              </div>
            </div>

            {/* Avatar SVG illustration */}
            <div className="relative z-10 w-full sm:w-full lg:w-[600px] text-center">
              <img
                src="/student.png"
                alt="Online Learner"
                className="w-full h-auto object-cover border-transparent"
              />
              <p className="mt-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                Online Learner
              </p>
            </div>
          </div>
        </section>

        {/* —— FEATURES BAR —— */}
        <section className="bg-[var(--surface-elevated)] border-y border-[var(--border)] transition-colors duration-300">
          <div className="flex flex-col sm:flex-row sm:flex-wrap">
            {features.map((f, i) => (
              <div
                key={i}
                className={`
                  flex items-start gap-4 px-6 py-8 sm:flex-1 sm:min-w-[180px]
                  ${
                    i < features.length - 1
                      ? "border-b border-[var(--border)] sm:border-b-0 sm:border-r sm:border-[var(--border)]"
                      : ""
                  }
                `}
              >
                {/* Feature icon */}
                <div className="text-[var(--accent)] shrink-0 mt-0.5">
                  {f.icon}
                </div>

                {/* Feature text */}
                <div>
                  <p className="text-[var(--text)] text-sm font-bold leading-snug mb-1.5">
                    {f.title}
                  </p>
                  <p className="text-[var(--muted)] text-xs leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── DETAILED FEATURES SECTION ── */}
        <section className="px-6 sm:px-10 lg:px-20 py-20 lg:py-28 bg-[var(--bg)]">
          <div className="max-w-6xl mx-auto">
            {/* Section header */}
            <div className="text-center mb-16">
              <p className="text-emerald-600 dark:text-emerald-500 text-sm font-semibold uppercase tracking-widest mb-3">
                Why Choose SmartClass
              </p>
              <h2 className="text-4xl lg:text-5xl font-bold text-[var(--text)] mb-4">
                Everything You Need to Succeed
              </h2>
              <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
                Comprehensive tools and features designed to enhance your
                learning experience and help you achieve your goals.
              </p>
            </div>

            {/* Features grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {detailedFeatures.map((feature, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-emerald-600/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-600/10"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-bold text-[var(--text)] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}
