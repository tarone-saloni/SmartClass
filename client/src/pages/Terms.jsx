import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    content: `By accessing or using SmartClass, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use the platform. These terms apply to all users including teachers, students, and institutional administrators.`,
  },
  {
    title: "2. Account Registration",
    content: `You must register for an account to access most features. You agree to provide accurate, current, and complete information and to update it as needed. You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account.`,
  },
  {
    title: "3. Acceptable Use",
    content: `You agree not to misuse SmartClass. Prohibited activities include uploading or sharing unlawful, harmful, or infringing content; attempting to gain unauthorised access to any part of the platform; reverse-engineering or scraping the service; and using SmartClass for any commercial purpose without prior written consent.`,
  },
  {
    title: "4. Teacher & Student Responsibilities",
    content: `Teachers are responsible for the content they create and share, for obtaining appropriate consents from students, and for ensuring course materials comply with applicable laws and institutional policies. Students are responsible for completing their own work honestly and not misrepresenting their progress.`,
  },
  {
    title: "5. Intellectual Property",
    content: `SmartClass and its original content, features, and functionality are owned by SmartClass Inc. and protected by copyright and other intellectual property laws. You retain ownership of content you create, but grant SmartClass a non-exclusive licence to host, display, and deliver that content as part of the service.`,
  },
  {
    title: "6. Payments & Refunds",
    content: `Paid plans are billed monthly or annually as selected. All fees are non-refundable except where required by law. You can cancel your subscription at any time; access continues until the end of the current billing period. We reserve the right to change pricing with 30 days' notice.`,
  },
  {
    title: "7. Service Availability",
    content: `We aim for 99.9% uptime but do not guarantee uninterrupted access. We may suspend the service for maintenance with reasonable advance notice. We are not liable for losses arising from service downtime unless caused by our gross negligence or wilful misconduct.`,
  },
  {
    title: "8. Limitation of Liability",
    content: `To the maximum extent permitted by law, SmartClass's total liability for any claim arising from use of the platform is limited to the amount you paid in the 12 months preceding the claim. We are not liable for indirect, incidental, special, or consequential damages.`,
  },
  {
    title: "9. Termination",
    content: `We may suspend or terminate your account if you violate these terms, if required by law, or if your account is inactive for more than 12 months. Upon termination, your right to use SmartClass ceases immediately and we may delete your data in accordance with our Privacy Policy.`,
  },
  {
    title: "10. Governing Law",
    content: `These terms are governed by the laws of the State of California, USA. Any disputes will be resolved in the courts of San Francisco County, California, unless otherwise required by applicable consumer protection laws in your jurisdiction.`,
  },
];

function Terms() {
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
              Terms of Service
            </h1>
            <p className="text-sm text-[var(--muted)]">
              Last updated: March 1, 2026
            </p>
          </div>

          <p className="text-sm text-[var(--muted)] leading-relaxed mb-10 p-5 rounded-xl border border-[var(--border)]/40 bg-[var(--card)]">
            Please read these Terms of Service carefully before using
            SmartClass. By using our platform, you agree to these terms. If you
            are using SmartClass on behalf of an institution, you represent that
            you have authority to bind that institution.
          </p>

          <div className="space-y-8">
            {SECTIONS.map((s) => (
              <div key={s.title}>
                <h2 className="text-base font-bold text-[var(--text)] mb-2">
                  {s.title}
                </h2>
                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  {s.content}
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

export default Terms;
