import { BrowserRouter } from 'react-router-dom';
import { useState, useEffect, useMemo, useCallback } from 'react';
import socket from './socket';
import { ThemeContext, themes } from './context/ThemeContext';
import ProtectedRoutes from './routes/ProtectedRoutes';
import PublicRoutes from './routes/PublicRoutes';
import ThemeApplier from './theme/ThemeApplier';
import ThemeSelector from './theme/ThemeSelector';

function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('smartclass_user')); }
    catch { return null; }
  });
  const [themeName, setThemeName] = useState(() => localStorage.getItem('smartclass_theme') || 'light');

  useEffect(() => {
    if (user) socket.emit('authenticate', { userId: user.id });
  }, [user]);

  const handleLogin = useCallback(userData => {
    localStorage.setItem('smartclass_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('smartclass_user');
    setUser(null);
  }, []);

  const themeContextValue = useMemo(
    () => ({ themeName, setThemeName, themes }),
    [themeName]
  );

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <ThemeApplier themeName={themeName} />
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors">
        <ThemeSelector themeName={themeName} setThemeName={setThemeName} />
        <BrowserRouter>
          {user ? (
            <ProtectedRoutes user={user} onLogout={handleLogout} />
          ) : (
            <PublicRoutes onLogin={handleLogin} />
          )}
        </BrowserRouter>
      </div>
    </ThemeContext.Provider>
  );
}

export default App;