import { useState, useEffect, useRef, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import socket from '../socket';
import { ThemeContext } from '../context/ThemeContext';

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function Navbar({ user, onLogout, showBack }) {
  const navigate = useNavigate();
  const { themeName, setThemeName, themes } = useContext(ThemeContext);
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const unread = notifs.filter(n => !n.read).length;

  useEffect(() => {
    fetch(`/api/notifications/${user.id}`)
      .then(r => r.json())
      .then(d => Array.isArray(d) && setNotifs(d));
    const onNotif = n => setNotifs(prev => [n, ...prev]);
    socket.on('notification', onNotif);
    return () => socket.off('notification', onNotif);
  }, [user.id]);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAll = async () => {
    await fetch(`/api/notifications/read-all/${user.id}`, { method: 'PATCH' });
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <nav
      data-theme={themeName}
      className="sticky top-0 z-50 h-16 px-5 sm:px-7 flex items-center justify-between
                 bg-[var(--surface)]/92 backdrop-blur-md border-b border-[var(--border)]
                 shadow-[0_12px_34px_-20px_rgba(0,0,0,0.5)] text-[var(--text)]"
    >
      <div className="flex items-center gap-4 sm:gap-5">
        <Link to="/" className="flex items-center gap-3 no-underline group">
          <div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent)]
                       flex items-center justify-center text-xl text-[var(--accent-contrast)]
                       shadow-md shadow-[var(--accent)]/30 transition-transform duration-200 group-hover:-translate-y-[2px] group-active:translate-y-[1px]"
          >
            🎓
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xl font-bold tracking-tight text-[var(--text)]">SmartClass</span>
            <span className="text-xs font-medium text-[var(--muted)] hidden sm:block">Learn · Manage · Grow</span>
          </div>
        </Link>
        {showBack && (
          <button
            onClick={() => navigate('/')}
            className="text-sm font-semibold text-[var(--muted)] hover:text-[var(--accent)]
                       bg-transparent border-none cursor-pointer transition-colors"
          >
            ← Dashboard
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)]
                        bg-[var(--surface)]/85 shadow-sm">
          <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)] font-semibold">Theme</span>
          <select
            value={themeName}
            onChange={e => setThemeName(e.target.value)}
            className="text-xs px-2 py-1 rounded-md border border-[var(--border)]
                       bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
          >
            {Object.keys(themes || {}).map(key => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
        </div>

        <div className="hidden md:flex items-center gap-2 pr-3 border-r border-[var(--border)]/60">
          <span className="text-sm font-semibold text-[var(--text)]">{user.name}</span>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--accent)]/14 text-[var(--accent)] capitalize">
            {user.role}
          </span>
        </div>

        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(o => !o)}
            className="relative p-2 rounded-lg text-2xl leading-none hover:bg-[var(--surface)]/80
                       bg-transparent border-none cursor-pointer transition-all duration-150
                       hover:-translate-y-[1px] active:translate-y-[1px]"
          >
            🔔
            {unread > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] rounded-full
                               bg-[var(--accent)] text-[var(--accent-contrast)] text-[11px] font-bold
                               flex items-center justify-center px-1 shadow-sm shadow-[var(--accent)]/40">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {open && (
            <div
              className="absolute right-0 top-12 w-80 bg-[var(--surface)]/98 backdrop-blur-lg rounded-xl
                         shadow-2xl border border-[var(--border)] z-[200] overflow-hidden
                         animate-[fadeSlideDown_180ms_ease-out]"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]/60">
                <span className="text-sm font-semibold text-[var(--text)]">
                  Notifications{unread > 0 ? ` (${unread})` : ''}
                </span>
                {unread > 0 && (
                  <button
                    onClick={markAll}
                    className="text-xs text-[var(--accent)] font-semibold hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifs.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-[var(--muted)]">No notifications yet</div>
                ) : (
                  notifs.map(n => (
                    <div
                      key={n.id}
                      className={`flex gap-2.5 px-4 py-3 border-b border-[var(--border)]/50 last:border-0 ${!n.read ? 'bg-[var(--accent)]/6' : ''}`}
                    >
                      {!n.read && <div className="w-2 h-2 rounded-full bg-[var(--accent)] mt-1 flex-shrink-0" />}
                      <div>
                        <p className="text-sm text-[var(--text)] leading-snug">{n.message}</p>
                        <p className="text-xs text-[var(--muted)] mt-0.5">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onLogout}
          className="px-3.5 py-1.75 bg-[var(--accent)]/14 hover:bg-[var(--accent)]/20
                     text-[var(--accent)] rounded-lg text-sm font-semibold border-none cursor-pointer
                     transition-all duration-150 hover:-translate-y-[1px] active:translate-y-[1px]"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;

/* Add a tiny keyframe (if using Tailwind, extend in config; otherwise a global CSS):
@keyframes fadeSlideDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
*/
