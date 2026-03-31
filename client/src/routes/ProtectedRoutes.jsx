import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TeacherDashboard from "../pages/TeacherDashboard";
import StudentDashboard from "../pages/StudentDashboard";
import CourseView from "../pages/CourseView";
import QuizView from "../pages/QuizView";
import LiveClassRoom from "../pages/LiveClassRoom";

function CourseViewRedirect() {
  const { id } = useParams();
  return <Navigate to={`/course/${id}/materials`} replace />;
}
import AIPlayground from "../pages/AIPlayground";
import Features from "../pages/Features";
import Pricing from "../pages/Pricing";
import Security from "../pages/Security";
import Enterprise from "../pages/Enterprise";
import About from "../pages/About";
import Blog from "../pages/Blog";
import Careers from "../pages/Careers";
import Contact from "../pages/Contact";
import Privacy from "../pages/Privacy";
import Terms from "../pages/Terms";
import Cookies from "../pages/Cookies";
import License from "../pages/License";

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
      <Route path="/course/:id" element={<CourseViewRedirect />} />
      <Route path="/course/:id/:tab" element={<CourseView />} />
      <Route path="/quiz/:id" element={<QuizView />} />
      <Route path="/live-class/:id" element={<LiveClassRoom />} />
      <Route path="/ai-playground" element={<AIPlayground />} />
      <Route path="/features" element={<Features />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/security" element={<Security />} />
      <Route path="/enterprise" element={<Enterprise />} />
      <Route path="/about" element={<About />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/careers" element={<Careers />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/cookies" element={<Cookies />} />
      <Route path="/license" element={<License />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default ProtectedRoutes;
