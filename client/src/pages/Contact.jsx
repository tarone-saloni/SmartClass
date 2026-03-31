import { useContext, useState } from "react";
import { ThemeContext } from "../context/ThemeContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const CONTACT_INFO = [
  { icon: "📧", label: "Email", value: "hello@smartclass.app" },
  { icon: "💬", label: "Live Chat", value: "Available Mon–Fri, 9am–6pm UTC" },
  { icon: "🐛", label: "Bug Reports", value: "support@smartclass.app" },
];

function Contact() {
  const { themeName } = useContext(ThemeContext);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

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
              Contact
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[var(--text)] mb-4">
              Get in touch
            </h1>
            <p className="text-[var(--muted)] text-lg max-w-lg mx-auto">
              Have a question, feedback, or a partnership idea? We'd love to
              hear from you.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-4">
              {CONTACT_INFO.map((c) => (
                <div
                  key={c.label}
                  className="flex gap-4 p-5 rounded-2xl border border-[var(--border)]/40 bg-[var(--card)]"
                >
                  <span className="text-2xl">{c.icon}</span>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                      {c.label}
                    </div>
                    <div className="text-sm text-[var(--text)] font-medium">
                      {c.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Form */}
            <div className="lg:col-span-3 p-8 rounded-2xl border border-[var(--border)]/40 bg-[var(--card)]">
              {submitted ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center gap-4">
                  <span className="text-5xl">🎉</span>
                  <h3 className="text-xl font-bold text-[var(--text)]">
                    Message sent!
                  </h3>
                  <p className="text-sm text-[var(--muted)]">
                    Thanks for reaching out. We'll get back to you within 1–2
                    business days.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setForm({
                        name: "",
                        email: "",
                        subject: "",
                        message: "",
                      });
                    }}
                    className="mt-2 px-6 py-2 rounded-xl border border-[var(--accent)]/40 text-sm font-semibold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] transition-all duration-300"
                  >
                    Send Another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5 uppercase tracking-wider">
                        Name
                      </label>
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        placeholder="Your name"
                        className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)]/50 bg-[var(--bg)] text-[var(--text)] text-sm placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5 uppercase tracking-wider">
                        Email
                      </label>
                      <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        placeholder="you@example.com"
                        className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)]/50 bg-[var(--bg)] text-[var(--text)] text-sm placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5 uppercase tracking-wider">
                      Subject
                    </label>
                    <input
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      required
                      placeholder="How can we help?"
                      className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)]/50 bg-[var(--bg)] text-[var(--text)] text-sm placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5 uppercase tracking-wider">
                      Message
                    </label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      placeholder="Tell us more..."
                      className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)]/50 bg-[var(--bg)] text-[var(--text)] text-sm placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold text-sm hover:opacity-90 transition-opacity shadow-[0_4px_16px_-4px_var(--accent)]"
                  >
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Contact;
