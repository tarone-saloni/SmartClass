import { Routes, Route, Navigate } from 'react-router-dom';
import TeacherDashboard from '../pages/TeacherDashboard';
import StudentDashboard from '../pages/StudentDashboard';
import CourseView from '../pages/CourseView';
import QuizView from '../pages/QuizView';

function ProtectedRoutes({ user, onLogout }) {
  return (
    <Routes>
      <Route
        path="/"
        element={
          user.role === 'teacher'
            ? <TeacherDashboard user={user} onLogout={onLogout} />
            : <StudentDashboard user={user} onLogout={onLogout} />
        }
      />
      <Route path="/course/:id" element={<CourseView user={user} onLogout={onLogout} />} />
      <Route path="/quiz/:id" element={<QuizView user={user} onLogout={onLogout} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default ProtectedRoutes;