import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const VALUES = [
  {
    icon: "🎯",
    title: "Student-Centred",
    desc: "Every decision starts with what's best for learners.",
  },
  {
    icon: "💡",
    title: "Innovation",
    desc: "We embrace AI and emerging technology to unlock new possibilities.",
  },
  {
    icon: "🤝",
    title: "Collaboration",
    desc: "Great education is a team sport — we build tools that bring people together.",
  },
  {
    icon: "🔒",
    title: "Trust & Privacy",
    desc: "We handle student data with the utmost care and transparency.",
  },
];

const STATS = [
  { value: "50K+", label: "Students" },
  { value: "5K+", label: "Teachers" },
  { value: "120+", label: "Institutions" },
  { value: "99.9%", label: "Uptime" },
];

function About() {
  const { themeName } = useContext(ThemeContext);

  return (
    <div
      data-theme={themeName}
      className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]"
    >
      <Navbar />

      <main className="flex-1 px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[var(--accent)]/10 text-[var(--accent)] mb-4">
              About Us
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[var(--text)] mb-6">
              Our mission is to make{" "}
              <span className="text-[var(--accent)]">great education</span>{" "}
              accessible to everyone
            </h1>
            <p className="text-[var(--muted)] text-lg leading-relaxed">
              SmartClass was founded with a simple belief: the right tools can
              make teaching more effective and learning more engaging. We build
              intelligent software that empowers educators and inspires students
              every single day.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-16">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="p-6 rounded-2xl border border-[var(--border)]/40 bg-[var(--card)] text-center"
              >
                <div className="text-3xl font-extrabold text-[var(--accent)] mb-1">
                  {s.value}
                </div>
                <div className="text-xs text-[var(--muted)] font-medium uppercase tracking-wider">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Story */}
          <div className="rounded-2xl border border-[var(--border)]/40 bg-[var(--card)] p-8 mb-12">
            <h2 className="text-2xl font-bold text-[var(--text)] mb-4">
              Our Story
            </h2>
            <div className="space-y-4 text-sm text-[var(--muted)] leading-relaxed">
              <p>
                SmartClass started in 2023 when a group of educators and
                engineers came together, frustrated by clunky, outdated learning
                management systems. We set out to build something fundamentally
                different — a platform that feels modern, moves fast, and puts
                teachers in control.
              </p>
              <p>
                What began as a weekend project quickly grew into a full product
                used by thousands of classrooms worldwide. Today, SmartClass
                powers live classes, AI-generated quizzes, and data-driven
                decisions for teachers across the globe.
              </p>
              <p>
                We're a small, passionate team distributed across multiple
                countries, united by the belief that technology should serve
                education — not the other way around.
              </p>
            </div>
          </div>

          {/* Values */}
          <h2 className="text-2xl font-bold text-[var(--text)] mb-6 text-center">
            What we stand for
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="flex gap-4 p-6 rounded-2xl border border-[var(--border)]/40 bg-[var(--card)]"
              >
                <span className="text-2xl mt-0.5">{v.icon}</span>
                <div>
                  <h3 className="font-bold text-[var(--text)] mb-1">
                    {v.title}
                  </h3>
                  <p className="text-sm text-[var(--muted)]">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default About;
