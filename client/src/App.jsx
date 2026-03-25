import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import CourseView from './pages/CourseView';
import QuizView from './pages/QuizView';
import socket from './socket';

function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('smartclass_user')); }
    catch { return null; }
  });

  useEffect(() => {
    if (user) socket.emit('authenticate', { userId: user.id });
  }, [user]);

  const handleLogin = userData => {
    localStorage.setItem('smartclass_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('smartclass_user');
    setUser(null);
  };

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            user.role === 'teacher'
              ? <TeacherDashboard user={user} onLogout={handleLogout} />
              : <StudentDashboard user={user} onLogout={handleLogout} />
          }
        />
        <Route path="/course/:id" element={<CourseView user={user} onLogout={handleLogout} />} />
        <Route path="/quiz/:id" element={<QuizView user={user} onLogout={handleLogout} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
