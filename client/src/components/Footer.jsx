import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

const SOCIAL = [
  { icon: "𝕏", label: "Twitter", href: "#" },
  { icon: "f", label: "Facebook", href: "#" },
  { icon: "in", label: "LinkedIn", href: "#" },
  { icon: "▶", label: "YouTube", href: "#" },
];

const LINKS = {
  Product: ["Features", "Pricing", "Security", "Enterprise"],
  Company: ["About", "Blog", "Careers", "Contact"],
  Legal: ["Privacy", "Terms", "Cookies", "License"],
};

function Footer() {
  const { themeName } = useContext(ThemeContext);
  const currentYear = new Date().getFullYear();

  return (
    <footer
      data-theme={themeName}
      className="relative border-t border-[var(--border)]/40 glass-heavy overflow-hidden"
    >
      {/* Subtle gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/40 to-transparent" />

      <div className="w-full px-4 sm:px-6 py-10 sm:py-14">
        <div className="max-w-7xl mx-auto">
          {/* Grid Layout */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 lg:gap-12 mb-8 sm:mb-12">
            {/* Brand Section */}
            <div className="col-span-2 flex flex-col gap-4 text-center sm:text-left">
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl 
                                bg-gradient-to-br from-[var(--accent)] to-[color-mix(in_srgb,var(--accent)_60%,#7c3aed)] 
                                text-[var(--accent-contrast)] shadow-[0_8px_24px_-8px_var(--accent)]">
                  🎓
                </div>
                <div>
                  <span className="text-lg font-extrabold text-[var(--text)] tracking-tight">
                    SmartClass
                  </span>
                  <p className="text-[10px] text-[var(--muted)] font-semibold uppercase tracking-wider">
                    Learn · Manage · Grow
                  </p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed max-w-xs mx-auto sm:mx-0">
                Modern learning management platform empowering teachers and students with intelligent tools for the future of education.
              </p>

              {/* Social Icons */}
              <div className="flex items-center gap-2 justify-center sm:justify-start mt-2">
                {SOCIAL.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    title={social.label}
                    className="w-9 h-9 rounded-xl border border-[var(--border)]/50 glass 
                              flex items-center justify-center text-xs font-bold text-[var(--muted)] 
                              hover:text-[var(--accent)] hover:border-[var(--accent)]/40 
                              hover:bg-[var(--accent)]/8 hover:shadow-[0_4px_16px_-4px_var(--accent)]
                              hover:-translate-y-1 transition-all duration-300 active:scale-95"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Link Columns */}
            {Object.entries(LINKS).map(([title, items]) => (
              <div key={title} className="col-span-1 text-center sm:text-left">
                <h4 className="text-[10px] sm:text-xs font-bold text-[var(--text)] mb-3 sm:mb-5 uppercase tracking-wider">
                  {title}
                </h4>
                <ul className="space-y-2 sm:space-y-3 text-[11px] sm:text-sm">
                  {items.map((item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-[var(--muted)] hover:text-[var(--accent)] transition-all duration-300 inline-block
                                   hover:translate-x-1 relative group"
                      >
                        <span>{item}</span>
                        <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-[var(--accent)] transition-all duration-300 group-hover:w-full" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-[var(--border)]/30 pt-6 sm:pt-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[10px] sm:text-xs text-[var(--muted)] font-medium">
                © {currentYear} SmartClass. All rights reserved. Built with 💜
              </p>
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs text-[var(--muted)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                  <span className="font-medium">All systems operational</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
