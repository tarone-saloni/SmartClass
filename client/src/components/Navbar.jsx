import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeContext, themes as themeMap } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../socket";

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const THEME_META = {
  [themeMap.light]: { label: "Light", icon: "☀️" },
  [themeMap.dark]: { label: "Dark", icon: "🌙" },
  [themeMap.custom]: { label: "Custom", icon: "✨" },
};

function Navbar({ showBack }) {
  const navigate = useNavigate();
  const { themeName, setThemeName } = useContext(ThemeContext);
  const { user, logout } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const ref = useRef(null);
  const mobileMenuRef = useRef(null);

  const themeKeys = Object.keys(themeMap || {});
  const unread = notifs.filter((n) => !n.read).length;

  // Check if user is authenticated (not guest)
  const isAuthenticated = user && user.role !== "guest";

  useEffect(() => {
    if (!isAuthenticated) return;

    fetch(`/api/notifications/${user.id}`)
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setNotifs(d));

    const socket = getSocket(user.id);
    socket.on("new-course", (notif) => {
      setNotifs((prev) => [
        { id: notif.id || Date.now(), message: notif.message, createdAt: notif.createdAt, read: false },
        ...prev,
      ]);
    });

    return () => {
      socket.off("new-course");
    };
  }, [user?.id, isAuthenticated]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target))
        setMobileMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAll = async () => {
    await fetch(`/api/notifications/read-all/${user.id}`, { method: "PATCH" });
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
      className="sticky top-0 z-50 h-auto sm:h-16 px-4 sm:px-6 py-3 sm:py-0 flex items-center justify-between
                 bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] backdrop-blur-md
                 border-b border-[var(--border)]/60 text-[var(--text)]
                 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.35)]"
    >
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .notify-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      `}</style>

      {/* Left Section - Logo & Brand */}
      <div className="flex items-center gap-2 sm:gap-5 min-w-0 flex-1">
        <button
          onClick={() =>
            navigate(
              isAuthenticated
                ? user.role === "teacher"
                  ? "/teacher-dashboard"
                  : "/student-dashboard"
                : "/signin",
            )
          }
          className="flex items-center gap-2 sm:gap-3 no-underline min-w-0 group bg-transparent border-none cursor-pointer 
                     p-1 rounded-lg hover:bg-[var(--accent)]/8 transition-all active:scale-95"
        >
          <div
            className="w-9 sm:w-10 h-9 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-lg sm:text-xl flex-shrink-0
                       bg-gradient-to-br from-[var(--accent)] to-[color-mix(in_srgb,var(--accent)_72%,#7c3aed)]
                       text-[var(--accent-contrast)]
                       shadow-[0_8px_20px_-10px_var(--accent)]
                       group-hover:scale-110 group-hover:shadow-[0_12px_24px_-10px_var(--accent)]
                       transition-all duration-300"
          >
            🎓
          </div>
          <div className="leading-tight min-w-0 hidden xs:block">
            <span
              className="block text-base sm:text-lg font-bold tracking-tight text-[var(--text)] truncate
                           group-hover:text-[var(--accent)] transition-colors duration-300"
            >
              SmartClass
            </span>
            <span className="hidden sm:block text-xs text-[var(--muted)] font-medium">
              Learn · Manage · Grow
            </span>
          </div>
        </button>

        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="text-xs sm:text-sm font-semibold text-[var(--muted)] hover:text-[var(--accent)]
                       bg-transparent border-none cursor-pointer transition-colors ml-2 sm:ml-4 pl-2 sm:pl-4 
                       border-l border-[var(--border)]/50 active:opacity-70"
            title="Go back"
          >
            ← Back
          </button>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1 sm:gap-3">
        {/* Desktop theme switch */}
        <div
          className="hidden lg:flex items-center gap-1 p-1.5 rounded-xl border border-[var(--border)]/70
                     bg-[color-mix(in_srgb,var(--surface)_92%,transparent)]
                     shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
        >
          {themeKeys.map((key) => {
            const active = themeName === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setThemeName(key)}
                title={THEME_META[key]?.label || key}
                className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  active
                    ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_4px_12px_-4px_var(--accent)]"
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
          className="lg:hidden h-9 w-9 rounded-lg border border-[var(--border)]/60
                     bg-[var(--surface)] text-sm cursor-pointer hover:bg-[var(--accent)]/12 
                     transition-all active:scale-95 flex items-center justify-center
                     hover:border-[var(--accent)]/40"
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
              className="hidden lg:flex items-center gap-3 px-3 py-1 rounded-lg 
                           border border-[var(--border)]/50 bg-[var(--accent)]/6"
            >
              <div className="text-right">
                <p className="text-sm font-semibold text-[var(--text)] leading-tight">
                  {user.name}
                </p>
                <p className="text-xs text-[var(--muted)]">{user.email}</p>
              </div>
              <div
                className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center 
                             text-[var(--accent-contrast)] text-xs font-bold"
              >
                {user.name?.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Notifications */}
            <div className="relative" ref={ref}>
              <button
                onClick={() => setOpen((o) => !o)}
                className="relative h-9 w-9 rounded-lg text-lg leading-none flex items-center justify-center
                           hover:bg-[var(--accent)]/12 border border-transparent hover:border-[var(--border)]/60
                           bg-transparent cursor-pointer transition-all active:scale-95"
                aria-label="Notifications"
              >
                🔔
                {unread > 0 && (
                  <span
                    className="absolute -top-2 -right-2 min-w-[20px] h-[20px] rounded-full
                               bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] font-bold
                               flex items-center justify-center px-0.5 notify-pulse
                               shadow-[0_4px_12px_-4px_rgba(239,68,68,0.4)]"
                  >
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {open && (
                <div
                  className="absolute right-0 top-12 w-96 rounded-xl border border-[var(--border)]/60
                             bg-[color-mix(in_srgb,var(--surface)_96%,transparent)] backdrop-blur-xl
                             shadow-[0_12px_40px_-8px_rgba(0,0,0,0.2)] overflow-hidden z-[200] 
                             animate-in fade-in slide-in-from-top-2 duration-300"
                >
                  <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border)]/50 bg-[var(--accent)]/4">
                    <div>
                      <span className="text-sm font-bold text-[var(--text)]">
                        Notifications
                      </span>
                      {unread > 0 && (
                        <span className="ml-2 text-xs text-[var(--accent)] font-semibold">
                          ({unread} new)
                        </span>
                      )}
                    </div>
                    {unread > 0 && (
                      <button
                        onClick={markAll}
                        className="text-xs text-[var(--accent)] font-semibold hover:underline bg-transparent border-none cursor-pointer active:opacity-70"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifs.length === 0 ? (
                      <div className="px-4 py-12 text-center text-sm text-[var(--muted)]">
                        <div className="text-4xl mb-2">🔔</div>
                        No notifications yet
                      </div>
                    ) : (
                      notifs.map((n) => (
                        <div
                          key={n.id}
                          className={`flex gap-3 px-4 py-3.5 border-b border-[var(--border)]/30 last:border-0 
                                     transition-all hover:bg-[var(--accent)]/6 cursor-pointer group ${
                                       !n.read ? "bg-[var(--accent)]/8" : ""
                                     }`}
                        >
                          {!n.read && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] mt-1.5 flex-shrink-0 group-hover:scale-125 transition-transform" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[var(--text)] leading-snug font-medium">
                              {n.message}
                            </p>
                            <p className="text-xs text-[var(--muted)] mt-1">
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
              className="lg:hidden h-9 w-9 rounded-lg border border-[var(--border)]/60 
                         bg-[var(--surface)] flex items-center justify-center text-lg
                         hover:bg-[var(--accent)]/12 transition-all active:scale-95"
              aria-label="Menu"
            >
              ⋮
            </button>

            {/* Logout Button - Desktop */}
            <button
              onClick={handleLogout}
              className="hidden lg:flex px-4 py-2 rounded-lg text-sm font-semibold border border-[var(--border)]/70
                         text-[var(--accent)] bg-[var(--accent)]/10 hover:bg-[var(--accent)]/18
                         transition-all cursor-pointer active:scale-95 items-center gap-2"
            >
              <span>Logout</span>
            </button>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
              <div
                ref={mobileMenuRef}
                className="absolute right-4 top-16 w-56 rounded-lg border border-[var(--border)]/60
                           bg-[color-mix(in_srgb,var(--surface)_96%,transparent)] backdrop-blur-xl
                           shadow-[0_12px_40px_-8px_rgba(0,0,0,0.2)] overflow-hidden z-[200]
                           animate-in fade-in slide-in-from-top-2 duration-300 lg:hidden"
              >
                <div className="p-3 border-b border-[var(--border)]/50 bg-[var(--accent)]/4">
                  <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wide">
                    Account
                  </p>
                  <p className="text-sm font-semibold text-[var(--text)] mt-1">
                    {user.name}
                  </p>
                  <div
                    className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold 
                                bg-[var(--accent)]/14 text-[var(--accent)] capitalize"
                  >
                    {user.role}
                  </div>
                </div>
                <div className="p-2">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold 
                               text-[var(--accent)] hover:bg-[var(--accent)]/12 
                               transition-all active:scale-95 border border-[var(--border)]/50"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* GUEST / NOT AUTHENTICATED SECTION */
          <>
            {/* Guest Sign In Button - Mobile hidden */}
            <button
              onClick={() => navigate("/signin")}
              className="hidden sm:flex px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold 
                         border border-[var(--border)]/70 text-[var(--text)] bg-[var(--surface)]
                         hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/8
                         transition-all cursor-pointer active:scale-95"
            >
              Sign In
            </button>

            {/* Guest Sign Up Button */}
            <button
              onClick={() => navigate("/signup")}
              className="px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold border-none
                         text-[var(--accent-contrast)] bg-gradient-to-r from-[var(--accent)] to-[color-mix(in_srgb,var(--accent)_72%,#7c3aed)]
                         hover:opacity-90 transition-all shadow-[0_8px_16px_-6px_var(--accent)]
                         cursor-pointer active:scale-95 font-bold"
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
