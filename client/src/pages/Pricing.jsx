import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Perfect for individual teachers getting started.",
    features: [
      "Up to 30 students",
      "5 courses",
      "Basic quizzes",
      "Community support",
      "1 GB storage",
    ],
    cta: "Get Started Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "per month",
    desc: "Ideal for growing classrooms and active educators.",
    features: [
      "Unlimited students",
      "Unlimited courses",
      "AI quiz generation",
      "Live classes",
      "Analytics dashboard",
      "Priority support",
      "20 GB storage",
    ],
    cta: "Start Pro Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "contact us",
    desc: "For schools, colleges, and large organisations.",
    features: [
      "Everything in Pro",
      "SSO & LDAP integration",
      "Custom branding",
      "Dedicated account manager",
      "SLA guarantee",
      "Unlimited storage",
      "On-premise option",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

function Pricing() {
  const { themeName } = useContext(ThemeContext);

  return (
    <div
      data-theme={themeName}
      className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]"
    >
      <Navbar />

      <main className="flex-1 px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[var(--accent)]/10 text-[var(--accent)] mb-4">
              Pricing
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[var(--text)] mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-[var(--muted)] text-lg max-w-xl mx-auto">
              No hidden fees. Start free and upgrade when you need more power.
            </p>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col p-8 rounded-2xl border transition-all duration-300 ${
                  plan.highlighted
                    ? "border-[var(--accent)] shadow-[0_0_40px_-8px_var(--accent)] bg-[var(--accent)]/5"
                    : "border-[var(--border)]/40 bg-[var(--card)]"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full text-xs font-bold bg-[var(--accent)] text-[var(--accent-contrast)] shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-bold text-[var(--text)] mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-[var(--muted)] mb-4">
                    {plan.desc}
                  </p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-[var(--text)]">
                      {plan.price}
                    </span>
                    <span className="text-sm text-[var(--muted)] pb-1">
                      / {plan.period}
                    </span>
                  </div>
                </div>

                <ul className="flex-1 space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-sm text-[var(--muted)]"
                    >
                      <span className="text-[var(--accent)] font-bold">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    plan.highlighted
                      ? "bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 shadow-[0_4px_16px_-4px_var(--accent)]"
                      : "border border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Pricing;
