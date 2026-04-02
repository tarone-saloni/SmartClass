import { Routes, Route, Navigate } from "react-router-dom";
import Mainpage from "../pages/Mainpage";
import SignIn from "../pages/SignIn";
import SignUp from "../pages/SignUp";
import Features from "../pages/Features";
import Security from "../pages/Security";
import Enterprise from "../pages/Enterprise";
import About from "../pages/About";
import Blog from "../pages/Blog";
import Privacy from "../pages/Privacy";
import Terms from "../pages/Terms";

function PublicRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Mainpage />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/features" element={<Features />} />
      <Route path="/security" element={<Security />} />
      <Route path="/enterprise" element={<Enterprise />} />
      <Route path="/about" element={<About />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default PublicRoutes;
