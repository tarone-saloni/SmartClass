import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TeacherDashboard from "../pages/TeacherDashboard";
import StudentDashboard from "../pages/StudentDashboard";
import CourseView from "../pages/CourseView";
import QuizView from "../pages/QuizView";

function ProtectedRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route
        path="/"
        element={
          user.role === "teacher" ? <TeacherDashboard /> : <StudentDashboard />
        }
      />
      <Route path="/course/:id" element={<CourseView />} />
      <Route path="/quiz/:id" element={<QuizView />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default ProtectedRoutes;
