import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ThemeContext, themes as themeMap } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../socket";
import { apiFetch } from "../utils/api.js";

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const THEME_META = {
  [themeMap.light]: {
    label: "Light",
    icon: "☀️",
    color: "from-amber-400 to-orange-400",
  },
  [themeMap.dark]: {
    label: "Dark",
    icon: "🌙",
    color: "from-indigo-500 to-purple-600",
  },
  [themeMap.custom]: {
    label: "Cosmic",
    icon: "✨",
    color: "from-violet-500 to-fuchsia-500",
  },
};

const AI_TABS = [
  { id: "chat", label: "Chat", icon: "💬" },
  { id: "quiz", label: "Quiz Generator", icon: "📝" },
  { id: "summarize", label: "Summarize", icon: "📋" },
  { id: "feedback", label: "Feedback", icon: "✅" },
  { id: "study-plan", label: "Study Plan", icon: "📅" },
  { id: "explain", label: "Explain", icon: "💡" },
  { id: "performance", label: "Performance", icon: "📊" },
  { id: "course-outline", label: "Course Outline", icon: "🎓" },
  { id: "agent", label: "Agent", icon: "🤖" },
];

const NAV_LINKS = [
  { label: "Dashboard", icon: "🏠", path: "/" },
  {
    label: "AI Playground",
    icon: "🤖",
    path: "/ai-playground/chat",
    matchPrefix: "/ai-playground",
    dropdown: AI_TABS.map((t) => ({
      label: t.label,
      icon: t.icon,
      path: `/ai-playground/${t.id}`,
    })),
  },
  { label: "Live Classes", icon: "📹", path: "/live-classes" },
];

function Navbar({ showBack }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { themeName, setThemeName } = useContext(ThemeContext);
  const { user, logout } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navDropdown, setNavDropdown] = useState(null); // label of open dropdown
  const [scrolled, setScrolled] = useState(false);
  const ref = useRef(null);
  const mobileMenuRef = useRef(null);
  const navDropdownRef = useRef(null);

  const themeKeys = Object.keys(themeMap || {});
  const unread = notifs.filter((n) => !n.read).length;
  const isAuthenticated = user && user.role !== "guest";

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    apiFetch(`/api/notifications/${user.id}`)
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setNotifs(d));

    const socket = getSocket(user.id);
    socket.on("new-course", (notif) => {
      setNotifs((prev) => [
        {
          id: notif.id || Date.now(),
          message: notif.message,
          createdAt: notif.createdAt,
          read: false,
        },
        ...prev,
      ]);
    });
    socket.on("live-class-scheduled", (data) => {
      setNotifs((prev) => [
        {
          id: `lc_${Date.now()}`,
          message: `📹 Live class scheduled: "${data.title}"`,
          createdAt: new Date().toISOString(),
          read: false,
        },
        ...prev,
      ]);
    });
    socket.on("live-class-status", (data) => {
      if (data.status === "live") {
        setNotifs((prev) => [
          {
            id: `lcs_${Date.now()}`,
            message: `🔴 A live class just started!`,
            createdAt: new Date().toISOString(),
            read: false,
          },
          ...prev,
        ]);
      }
    });
    socket.on("student-enrolled", (data) => {
      setNotifs((prev) => [
        {
          id: `enroll_${Date.now()}`,
          message: data.message || "A student enrolled in your course",
          createdAt: new Date().toISOString(),
          read: false,
        },
        ...prev,
      ]);
    });

    return () => {
      socket.off("new-course");
      socket.off("live-class-scheduled");
      socket.off("live-class-status");
      socket.off("student-enrolled");
    };
  }, [user?.id, isAuthenticated]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target))
        setMobileMenuOpen(false);
      if (navDropdownRef.current && !navDropdownRef.current.contains(e.target))
        setNavDropdown(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAll = async () => {
    await apiFetch(`/api/notifications/read-all/${user.id}`, {
      method: "PATCH",
    });
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const cycleTheme = () => {
    const i = themeKeys.indexOf(themeName);
    const next = themeKeys[(i + 1) % themeKeys.length];
    setThemeName(next);
  };

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  return (
    <nav
      data-theme={themeName}
      className={`sticky top-0 z-50 h-auto sm:h-16 px-4 sm:px-6 py-3 sm:py-0 flex items-center justify-between
                 text-[var(--text)] transition-all duration-500 ease-out
                 ${
                   scrolled
                     ? "glass-heavy border-b border-[var(--border)]/60 shadow-[0_4px_30px_-8px_rgba(0,0,0,0.25)]"
                     : "bg-transparent border-b border-transparent"
                 }`}
    >
      {/* Left Section - Logo & Brand */}
      <div className="flex items-center gap-2 sm:gap-5 min-w-0 flex-1">
        <button
          onClick={() =>
            navigate(
              isAuthenticated
                ? user.role === "teacher"
                  ? "/teacher-dashboard"
                  : "/student-dashboard"
                : "/",
            )
          }
          className="flex items-center gap-2 sm:gap-3 no-underline min-w-0 group bg-transparent border-none cursor-pointer 
                     p-1.5 rounded-xl hover:bg-[var(--accent)]/8 transition-all duration-300 active:scale-95"
        >
          <div
            className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl flex items-center justify-center text-lg sm:text-xl flex-shrink-0
                       bg-gradient-to-br from-[var(--accent)] to-[color-mix(in_srgb,var(--accent)_65%,#7c3aed)]
                       text-[var(--accent-contrast)]
                       shadow-[0_8px_24px_-8px_var(--accent)]
                       group-hover:scale-110 group-hover:shadow-[0_12px_32px_-8px_var(--accent)]
                       group-hover:rotate-[-5deg]
                       transition-all duration-500 ease-out"
          >
            🎓
          </div>
          <div className="leading-tight min-w-0 hidden xs:block">
            <span
              className="block text-base sm:text-lg font-extrabold tracking-tight text-[var(--text)] truncate
                           group-hover:text-[var(--accent)] transition-colors duration-300"
            >
              SmartClass
            </span>
            <span className="hidden sm:block text-[10px] text-[var(--muted)] font-semibold tracking-wider uppercase">
              Learn · Manage · Grow
            </span>
          </div>
        </button>

        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="text-xs sm:text-sm font-semibold text-[var(--muted)] hover:text-[var(--accent)]
                       bg-transparent border-none cursor-pointer transition-all duration-300 ml-2 sm:ml-4 pl-2 sm:pl-4
                       border-l border-[var(--border)]/50 active:opacity-70 hover:-translate-x-0.5
                       flex items-center gap-1"
            title="Go back"
          >
            <span className="transition-transform group-hover:-translate-x-1">
              ←
            </span>{" "}
            Back
          </button>
        )}

        {/* Desktop Nav Links — authenticated only */}
        {isAuthenticated && (
          <nav
            ref={navDropdownRef}
            className="hidden lg:flex items-center gap-1 ml-2 pl-4 border-l border-[var(--border)]/40"
          >
            {NAV_LINKS.map((link) => {
              const active = link.matchPrefix
                ? location.pathname.startsWith(link.matchPrefix)
                : location.pathname === link.path;
              const isOpen = navDropdown === link.label;

              return (
                <div key={link.label} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      if (link.dropdown) {
                        setNavDropdown(isOpen ? null : link.label);
                      } else {
                        navigate(link.path);
                        setNavDropdown(null);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-300 active:scale-95 border-none cursor-pointer
                      ${
                        active
                          ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_4px_16px_-4px_var(--accent)]"
                          : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--accent)]/8"
                      }`}
                  >
                    <span>{link.icon}</span>
                    <span>{link.label}</span>
                    {link.dropdown && (
                      <span
                        className={`text-xs transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      >
                        ▾
                      </span>
                    )}
                  </button>

                  {/* Dropdown panel */}
                  {link.dropdown && isOpen && (
                    <div className="absolute left-0 top-full mt-2 w-48 rounded-2xl border border-[var(--border)]/50 glass-heavy shadow-[0_20px_40px_-8px_rgba(0,0,0,0.25)] overflow-hidden z-[300] animate-[scale-in_0.2s_cubic-bezier(0.16,1,0.3,1)_both] origin-top-left">
                      {link.dropdown.map((item) => {
                        const itemActive = location.pathname === item.path;
                        return (
                          <button
                            key={item.path}
                            type="button"
                            onClick={() => {
                              navigate(item.path);
                              setNavDropdown(null);
                            }}
                            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-all duration-200 border-none cursor-pointer text-left
                              ${
                                itemActive
                                  ? "bg-[var(--accent)]/15 text-[var(--accent)] font-semibold"
                                  : "text-[var(--text)] hover:bg-[var(--accent)]/8"
                              }`}
                          >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Desktop theme switch */}
        <div
          className="hidden lg:flex items-center gap-0.5 p-1 rounded-xl border border-[var(--border)]/50
                     glass shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
        >
          {themeKeys.map((key) => {
            const active = themeName === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setThemeName(key)}
                title={THEME_META[key]?.label || key}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                  active
                    ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_4px_16px_-4px_var(--accent)] scale-105"
                    : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--accent)]/8"
                } active:scale-95`}
              >
                <span className="mr-1">{THEME_META[key]?.icon || "🎨"}</span>
                <span className="hidden xl:inline">
                  {THEME_META[key]?.label || key}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mobile theme switch */}
        <button
          type="button"
          onClick={cycleTheme}
          className="lg:hidden h-9 w-9 rounded-xl border border-[var(--border)]/50
                     glass text-sm cursor-pointer hover:bg-[var(--accent)]/12 
                     transition-all duration-300 active:scale-90 flex items-center justify-center
                     hover:border-[var(--accent)]/40 hover:shadow-[0_4px_16px_-4px_var(--accent)]"
          title="Change theme"
          aria-label="Change theme"
        >
          {THEME_META[themeName]?.icon || "🎨"}
        </button>

        {/* AUTHENTICATED USER SECTION */}
        {isAuthenticated ? (
          <>
            {/* User Info - Desktop Only */}
            <div
              className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl
                           border border-[var(--accent)]/20 bg-[var(--accent)]/6
                           hover:bg-[var(--accent)]/10 transition-all duration-300"
            >
              <div className="text-right">
                <p className="text-sm font-bold text-[var(--text)] leading-tight">
                  {user.name}
                </p>
                <p className="text-[10px] text-[var(--muted)] font-medium">
                  {user.email}
                </p>
              </div>
              <div
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[color-mix(in_srgb,var(--accent)_60%,#ec4899)] 
                             flex items-center justify-center text-[var(--accent-contrast)] text-xs font-bold
                             shadow-[0_4px_12px_-4px_var(--accent)] ring-2 ring-[var(--accent)]/20"
              >
                {user.name?.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Notifications */}
            <div className="relative" ref={ref}>
              <button
                onClick={() => setOpen((o) => !o)}
                className="relative h-9 w-9 rounded-xl text-lg leading-none flex items-center justify-center
                           hover:bg-[var(--accent)]/12 border border-transparent hover:border-[var(--border)]/60
                           bg-transparent cursor-pointer transition-all duration-300 active:scale-90"
                aria-label="Notifications"
              >
                🔔
                {unread > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] rounded-full
                               bg-gradient-to-br from-red-500 to-rose-600 text-white text-[10px] font-bold
                               flex items-center justify-center px-1 notify-pulse
                               shadow-[0_4px_12px_-2px_rgba(239,68,68,0.5)]
                               ring-2 ring-[var(--bg)]"
                  >
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {open && (
                <div
                  className="absolute right-0 top-12 w-[360px] sm:w-96 rounded-2xl border border-[var(--border)]/60
                             glass-heavy shadow-[0_20px_60px_-12px_rgba(0,0,0,0.3)] overflow-hidden z-[200] 
                             animate-[scale-in_0.3s_cubic-bezier(0.16,1,0.3,1)_both]
                             origin-top-right"
                >
                  <div
                    className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]/40
                                  bg-gradient-to-r from-[var(--accent)]/8 to-transparent"
                  >
                    <div>
                      <span className="text-sm font-bold text-[var(--text)]">
                        Notifications
                      </span>
                      {unread > 0 && (
                        <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--accent)]/15 text-[var(--accent)]">
                          {unread} new
                        </span>
                      )}
                    </div>
                    {unread > 0 && (
                      <button
                        onClick={markAll}
                        className="text-xs text-[var(--accent)] font-semibold hover:underline bg-transparent border-none cursor-pointer active:opacity-70
                                   hover:bg-[var(--accent)]/8 px-2 py-1 rounded-lg transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifs.length === 0 ? (
                      <div className="px-4 py-12 text-center text-sm text-[var(--muted)]">
                        <div className="text-4xl mb-3 opacity-40">🔔</div>
                        <p className="font-medium">No notifications yet</p>
                        <p className="text-xs mt-1 opacity-70">
                          You're all caught up!
                        </p>
                      </div>
                    ) : (
                      notifs.map((n, i) => (
                        <div
                          key={n.id}
                          className={`flex gap-3 px-5 py-3.5 border-b border-[var(--border)]/20 last:border-0 
                                     transition-all duration-300 hover:bg-[var(--accent)]/6 cursor-pointer group ${
                                       !n.read ? "bg-[var(--accent)]/6" : ""
                                     }`}
                          style={{ animationDelay: `${i * 30}ms` }}
                        >
                          {!n.read && (
                            <div
                              className="w-2 h-2 rounded-full bg-[var(--accent)] mt-2 flex-shrink-0 
                                          group-hover:scale-125 transition-transform shadow-[0_0_8px_var(--accent)]"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[var(--text)] leading-snug font-medium">
                              {n.message}
                            </p>
                            <p className="text-[11px] text-[var(--muted)] mt-1 font-medium">
                              {timeAgo(n.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden h-9 w-9 rounded-xl border border-[var(--border)]/50 
                         glass flex items-center justify-center text-lg
                         hover:bg-[var(--accent)]/12 transition-all duration-300 active:scale-90"
              aria-label="Menu"
            >
              <div className="flex flex-col gap-1 items-center">
                <span
                  className={`block w-4 h-0.5 bg-[var(--text)] rounded-full transition-all duration-300 ${mobileMenuOpen ? "rotate-45 translate-y-1.5" : ""}`}
                />
                <span
                  className={`block w-4 h-0.5 bg-[var(--text)] rounded-full transition-all duration-300 ${mobileMenuOpen ? "opacity-0 scale-0" : ""}`}
                />
                <span
                  className={`block w-4 h-0.5 bg-[var(--text)] rounded-full transition-all duration-300 ${mobileMenuOpen ? "-rotate-45 -translate-y-1.5" : ""}`}
                />
              </div>
            </button>

            {/* Logout Button - Desktop */}
            <button
              onClick={handleLogout}
              className="hidden lg:flex px-4 py-2 rounded-xl text-sm font-semibold border border-[var(--border)]/50
                         text-[var(--accent)] glass hover:bg-[var(--accent)]/12
                         hover:border-[var(--accent)]/40 hover:shadow-[0_4px_16px_-4px_var(--accent)]
                         transition-all duration-300 cursor-pointer active:scale-95 items-center gap-2"
            >
              <span>Logout</span>
            </button>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
              <div
                ref={mobileMenuRef}
                className="absolute right-4 top-16 w-60 rounded-2xl border border-[var(--border)]/50
                           glass-heavy shadow-[0_20px_60px_-12px_rgba(0,0,0,0.3)] overflow-hidden z-[200]
                           animate-[scale-in_0.3s_cubic-bezier(0.16,1,0.3,1)_both]
                           origin-top-right lg:hidden"
              >
                <div className="p-4 border-b border-[var(--border)]/40 bg-gradient-to-r from-[var(--accent)]/8 to-transparent">
                  <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-1">
                    Account
                  </p>
                  <p className="text-sm font-bold text-[var(--text)]">
                    {user.name}
                  </p>
                  <div
                    className="inline-block mt-2 px-2.5 py-0.5 rounded-lg text-[10px] font-bold 
                                bg-[var(--accent)]/14 text-[var(--accent)] capitalize tracking-wide"
                  >
                    {user.role}
                  </div>
                </div>
                <div className="p-2 border-b border-[var(--border)]/30">
                  {NAV_LINKS.map((link) => {
                    const active = location.pathname === link.path;
                    return (
                      <button
                        key={link.path}
                        type="button"
                        onClick={() => {
                          navigate(link.path);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2.5
                          transition-all duration-300 active:scale-95 border-none cursor-pointer
                          ${
                            active
                              ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                              : "text-[var(--text)] hover:bg-[var(--accent)]/8"
                          }`}
                      >
                        <span>{link.icon}</span>
                        <span>{link.label}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="p-2">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold
                               text-red-500 hover:bg-red-500/10
                               transition-all duration-300 active:scale-95 border-none bg-transparent cursor-pointer
                               flex items-center gap-2"
                  >
                    <span>🚪</span> Logout
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* GUEST / NOT AUTHENTICATED SECTION */
          <>
            <button
              onClick={() => navigate("/")}
              className="hidden sm:flex px-4 py-2 rounded-xl text-sm font-semibold 
                         border border-[var(--border)]/50 text-[var(--text)] glass
                         hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/8
                         hover:shadow-[0_4px_16px_-4px_var(--accent)]
                         transition-all duration-300 cursor-pointer active:scale-95"
            >
              Home
            </button>

            <button
              onClick={() => navigate("/signup")}
              className="px-4 py-2 rounded-xl text-sm font-bold border-none
                         text-[var(--accent-contrast)] sc-btn-glow
                         cursor-pointer active:scale-95"
            >
              <span className="hidden xs:inline">Sign Up</span>
              <span className="xs:hidden">Join</span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
