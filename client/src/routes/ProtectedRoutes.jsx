import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TeacherDashboard from "../pages/TeacherDashboard";
import StudentDashboard from "../pages/StudentDashboard";
import CourseView from "../pages/CourseView";
import QuizView from "../pages/QuizView";
import LiveClassRoom from "../pages/LiveClassRoom";
import AiChat from "../pages/ai/AiChat";
import AiQuiz from "../pages/ai/AiQuiz";
import AiSummarize from "../pages/ai/AiSummarize";
import AiFeedback from "../pages/ai/AiFeedback";
import AiStudyPlan from "../pages/ai/AiStudyPlan";
import AiExplain from "../pages/ai/AiExplain";
import AiPerformance from "../pages/ai/AiPerformance";
import AiCourseOutline from "../pages/ai/AiCourseOutline";
import AiAgent from "../pages/ai/AiAgent";
import ProfilePage from "../pages/ProfilePage";
import Features from "../pages/Features";
import Security from "../pages/Security";
import Enterprise from "../pages/Enterprise";
import About from "../pages/About";
import TechArchitecture from "../pages/TechArchitecture";
import Blog from "../pages/Blog";
import Privacy from "../pages/Privacy";
import Terms from "../pages/Terms";

function CourseViewRedirect() {
  const { id } = useParams();
  return <Navigate to={`/course/${id}/materials`} replace />;
}

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
      <Route path="/live-classes" element={<Navigate to="/" replace />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/profile/:userId" element={<ProfilePage />} />

      {/* AI — each feature is its own page */}
      <Route
        path="/ai-playground"
        element={<Navigate to="/ai-playground/chat" replace />}
      />
      <Route path="/ai-playground/chat" element={<AiChat />} />
      <Route path="/ai-playground/quiz" element={<AiQuiz />} />
      <Route path="/ai-playground/summarize" element={<AiSummarize />} />
      <Route path="/ai-playground/feedback" element={<AiFeedback />} />
      <Route path="/ai-playground/study-plan" element={<AiStudyPlan />} />
      <Route path="/ai-playground/explain" element={<AiExplain />} />
      <Route path="/ai-playground/performance" element={<AiPerformance />} />
      <Route
        path="/ai-playground/course-outline"
        element={<AiCourseOutline />}
      />
      <Route path="/ai-playground/agent" element={<AiAgent />} />

      <Route path="/features" element={<Features />} />
      <Route path="/security" element={<Security />} />
      <Route path="/enterprise" element={<Enterprise />} />
      <Route path="/about" element={<About />} />
      <Route path="/about/architecture" element={<TechArchitecture />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default ProtectedRoutes;
