import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import socket from '../socket';

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function Navbar({ user, onLogout, showBack }) {
  const navigate = useNavigate();
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
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 h-16 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-5">
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-lg">
            🎓
          </div>
          <span className="text-lg font-bold text-gray-900">SmartClass</span>
        </Link>
        {showBack && (
          <button
            onClick={() => navigate('/')}
            className="text-sm font-medium text-gray-500 hover:text-indigo-600 bg-transparent border-none cursor-pointer transition-colors"
          >
            ← Dashboard
          </button>
        )}
      </div>

      <div className="flex items-center gap-3.5">
        <span className="text-sm font-semibold text-gray-900">{user.name}</span>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          user.role === 'teacher' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'
        }`}>
          {user.role}
        </span>

        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(o => !o)}
            className="relative p-2 rounded-lg text-xl leading-none hover:bg-gray-100 bg-transparent border-none cursor-pointer transition-colors"
          >
            🔔
            {unread > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center px-1">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-[200] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-900">
                  Notifications{unread > 0 ? ` (${unread})` : ''}
                </span>
                {unread > 0 && (
                  <button onClick={markAll} className="text-xs text-indigo-600 font-medium hover:underline bg-transparent border-none cursor-pointer">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifs.length === 0
                  ? <div className="px-4 py-6 text-center text-sm text-gray-400">No notifications yet</div>
                  : notifs.map(n => (
                    <div key={n.id} className={`flex gap-2.5 px-4 py-3 border-b border-gray-50 last:border-0 ${!n.read ? 'bg-indigo-50/60' : ''}`}>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1 flex-shrink-0" />}
                      <div>
                        <p className="text-sm text-gray-700 leading-snug">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onLogout}
          className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold border-none cursor-pointer transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
