import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { Toaster } from "@/components/ui/sonner";

import Home from "./pages/Home.jsx";
import AboutUs from "./pages/AboutUs.jsx";
import SupportUs from "./pages/SupportUs.jsx";
import Gallery from "./pages/Gallery.jsx";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import ClusterDashboard from "./pages/ClusterDashboard.jsx";
import AllRegistrationsDashboard from "./pages/AllRegistrationsDashboard.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/events" element={<Home />} />
          <Route path="/support-us" element={<SupportUs />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/contact" element={<Home />} />
          <Route path="/faq" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute role="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          {/* Public token-gated cluster dashboard — no login required */}
          <Route path="/cluster" element={<ClusterDashboard />} />
          {/* Public token-gated all-registrations global view */}
          <Route path="/all-registrations" element={<AllRegistrationsDashboard />} />
          {/* Legal Pages */}
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<PrivacyPolicy />} />
        </Routes>
      </main>
      <Footer />
      <Toaster position="top-right" />
    </div>
  );
}
