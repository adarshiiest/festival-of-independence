import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { toast } from "sonner";
import {
  Sparkles,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

const DEFAULT_COLLEGES_LIST = [
  // CC1 – Hariom Prabhu
  "NSHM Knowledge Campus",
  "Heritage Institute of Technology",
  "Surendranath College",
  "Bhawanipur Education Society College",
  "Heramba Chandra College",
  "Prafulla Chandra College",
  "Asutosh College",
  "SSKM Medical College (IPGMER)",
  // CC2 – Yash Prabhu
  "THK Jain College",
  "Ananda Mohan College",
  "Goenka College of Commerce & Business Administration",
  "Shyambazar Law College",
  "City College",
  // CC3 – Suvilas Nitai Chandra Prabhu
  "MCKV Institute of Engineering",
  "Swami Vivekananda College",
  "Scottish Church College",
  "South Calcutta Law College",
  "St. Thomas College of Engineering and Technology",
  "Indian Statistical Institute (ISI)",
  "Government College of Art & Craft",
  "Narula Institute of Technology",
  // CC4 – Swamynath Prabhu
  "Umesh Chandra College",
  "City College of Commerce (Evening - Umesh Chandra Campus)",
  "Seth Anandram Jaipuria College",
  "Bangabasi College",
  // CC5 – Arup Prabhu
  "Acharya Girish Chandra Bose College",
  "Chittaranjan College",
  "Sirish Chandra College",
  "Maharaja Manindra Chandra College",
  "Sir Gurudas Mahavidyalaya",
  "Shibpur Dinobundhoo Institution (College)",
  "Rabindra Bharati University",
  // CC6 – Sadkirti Nityananda Prabhu
  "A.J.C. Bose College",
  "Charuchandra College",
  "Bengal Music College",
  "Jogesh Chandra Chaudhuri College",
  "Vijaygarh Jyotish Ray College",
  "Netaji Nagar College",
  "Sammilani Mahavidyalaya",
  "K.K. Das College",
  "Dinabandhu Andrews College",
  "Dr. Kanai Lal Bhattacharya College",
  "NRS Medical College (Nilratan Sircar)",
  "Presidency University",
  // CC7 – Sandipan Prabhu
  "Behala College",
  "Rabin Mukherjee College",
  "Kishore Bharati Bhagini Nivedita College",
  "Vivekananda College (Thakurpukur)",
  "Shishuram Das College (Sarisha)",
  "Sarsuna College",
  "New Alipore College",
  // CC8 – Adarsh Prabhu
  "Indian Institute of Engineering Science and Technology (IIEST), Shibpur",
  // CC9 – Jay Prakash Prabhu
  "Brainware University",
  "Barasat Government College",
];

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [colleges, setColleges] = useState([]);
  const [form, setForm] = useState({
    fullName: "",
    gender: "",
    collegeId: "",
    customCollegeName: "",
    phoneNumber: "",
    address: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get("/colleges")
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setColleges(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const collegeOptions = colleges.length > 0 ? colleges : DEFAULT_COLLEGES_LIST.map((name) => ({ id: name, name }));
  const selectedCollegeObj = collegeOptions.find((c) => String(c.id) === String(form.collegeId));
  const isOtherCollege = selectedCollegeObj && selectedCollegeObj.name.toLowerCase().startsWith("other");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.fullName.trim()) return setError("Full Name is required.");
    if (!form.gender) return setError("Please select your gender.");
    if (!form.collegeId) return setError("Please select your college or institution.");
    if (isOtherCollege && !form.customCollegeName.trim()) return setError("Please enter your college or institution name.");
    
    // Legal Email Syntax Verification
    const trimmedEmail = form.email.trim().toLowerCase();
    if (!trimmedEmail) return setError("Email Address is required.");
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      return setError("Please enter a valid and legal email address (e.g. name@example.com).");
    }

    if (!form.phoneNumber.trim()) return setError("Phone Number is required.");
    if (!form.address.trim()) return setError("Address is required.");
    if (!form.username.trim()) return setError("Username is required.");
    if (!form.password) return setError("Password is required.");
    if (!form.confirmPassword) return setError("Confirm Password is required.");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match.");

    setSubmitting(true);
    try {
      const res = await api.post("/auth/student/register", {
        fullName: form.fullName.trim(),
        gender: form.gender,
        collegeId: form.collegeId,
        customCollegeName: isOtherCollege ? form.customCollegeName.trim() : "",
        phoneNumber: form.phoneNumber.trim(),
        address: form.address.trim(),
        email: trimmedEmail,
        username: form.username.trim(),
        password: form.password,
      });

      login({ token: res.data.token, role: "student", user: res.data.student });
      toast.success("Registration successful! Welcome to the Festival of Independence.");
      navigate("/student/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center bg-[#F4F4F8] p-3 sm:p-5 lg:p-6 font-sans">
      
      {/* Master Card Container - Fills the vertical screen area between navbar and footer */}
      <div className="w-full max-w-5xl lg:max-w-6xl flex-1 flex flex-col justify-center bg-white rounded-[28px] sm:rounded-[34px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] border border-gray-100/90 p-2.5 sm:p-4 lg:p-5 overflow-hidden my-auto">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-stretch flex-1 w-full">
          
          {/* LEFT COLUMN: Lighter Saffron Mesh Gradient Brand Art Panel */}
          <div className="lg:col-span-5 relative w-full h-full rounded-[22px] sm:rounded-[26px] overflow-hidden p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-gradient-to-br from-[#FFB877] via-[#FF8432] to-[#311D4E] text-white shadow-inner min-h-[220px] lg:min-h-[520px]">
            
            {/* Ambient Soft Lighter Glow Orbs */}
            <div className="absolute -top-16 -left-16 w-64 h-64 bg-[#FFE8B2]/45 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/3 -right-16 w-72 h-72 bg-[#E0AAFF]/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 left-1/4 w-64 h-64 bg-[#BAE6FD]/25 rounded-full blur-3xl pointer-events-none" />

            {/* Top Emblem Logo */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white text-2xl font-black shadow-xs">
                ✦
              </div>
              <span className="text-[11px] font-extrabold tracking-wider uppercase text-white/90 bg-black/15 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                1-Year Journey
              </span>
            </div>

            {/* Bottom Tagline Typography */}
            <div className="relative z-10 space-y-2.5 pt-8">
              <span className="text-[11px] font-bold text-amber-100 uppercase tracking-widest bg-white/15 backdrop-blur-xs px-3 py-1 rounded-full inline-block border border-white/20">
                Join Free
              </span>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight tracking-tight">
                Empower your character, clarity & leadership
              </h2>
              <p className="text-xs sm:text-sm text-white/90 font-medium leading-relaxed">
                Self-mastery modules, mentorship from IIT/IIM alumni, and networking with student leaders across 50+ colleges.
              </p>

              {/* Mini Highlights */}
              <div className="pt-2 space-y-1.5 text-xs text-amber-100/90 font-medium">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-300 font-bold">✓</span> 100% Free Online Course
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-300 font-bold">✓</span> Verified Completion Certificate
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Registration Form with Smooth Internal Scroll */}
          <div className="lg:col-span-7 flex flex-col justify-between px-4 sm:px-8 lg:px-10 py-3 sm:py-5 overflow-y-auto max-h-[calc(100vh-140px)] pr-1 sm:pr-2">
            
            <div>
              {/* Form Top Header */}
              <div className="space-y-1 mb-4">
                <div className="inline-flex items-center gap-1.5 text-saffron font-black">
                  <Sparkles className="w-5 h-5 text-saffron animate-pulse" />
                </div>
                
                <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
                  Create an account
                </h1>
                
                <p className="text-xs sm:text-sm text-gray-500 font-medium leading-snug">
                  Register for the Festival of Independence & unlock your student dashboard.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 text-xs sm:text-sm">
                
                {/* Row 1: Full Name & Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-7">
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      placeholder="e.g. Rahul Sharma"
                      required
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 font-semibold text-navy placeholder:text-gray-400 focus:outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/10 transition-all shadow-2xs"
                    />
                  </div>

                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      required
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 font-semibold text-navy focus:outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/10 transition-all shadow-2xs"
                    >
                      <option value="">-- Gender --</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: College / Institution Selection */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                    College / Institution <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="collegeId"
                    value={form.collegeId}
                    onChange={handleChange}
                    required
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 font-semibold text-navy focus:outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/10 transition-all shadow-2xs text-xs sm:text-sm"
                  >
                    <option value="">-- Select College / Institution --</option>
                    {[...collegeOptions]
                      .sort((a, b) => {
                        const aName = (a.name || "").trim();
                        const bName = (b.name || "").trim();
                        const aOther = aName.toLowerCase().startsWith("other");
                        const bOther = bName.toLowerCase().startsWith("other");
                        if (aOther && !bOther) return 1;
                        if (!aOther && bOther) return -1;
                        return aName.localeCompare(bName, undefined, { sensitivity: "base" });
                      })
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>

                  {/* Custom College Write-in Mode */}
                  {isOtherCollege && (
                    <div className="mt-2.5 p-3 bg-amber-50/80 border border-amber-300 rounded-xl space-y-1 animate-fadeIn">
                      <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                        ✍️ Enter Your College / University Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="customCollegeName"
                        value={form.customCollegeName}
                        onChange={handleChange}
                        placeholder="e.g. Heritage Institute of Technology"
                        required
                        className="w-full bg-white border border-amber-300 rounded-xl px-3.5 py-2 font-semibold text-navy placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-saffron"
                      />
                    </div>
                  )}
                </div>

                {/* Row 3: Email Address */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    required
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 font-semibold text-navy placeholder:text-gray-400 focus:outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/10 transition-all shadow-2xs text-xs sm:text-sm"
                  />
                </div>

                {/* Row 4: Phone & Address */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                      Phone / WhatsApp <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="phoneNumber"
                      value={form.phoneNumber}
                      onChange={handleChange}
                      placeholder="e.g. 9876543210"
                      required
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 font-semibold text-navy placeholder:text-gray-400 focus:outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/10 transition-all shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                      City / Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="e.g. Kolkata"
                      required
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 font-semibold text-navy placeholder:text-gray-400 focus:outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/10 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                {/* Row 5: Username & Passwords */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                      Choose Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="username"
                      value={form.username}
                      onChange={handleChange}
                      placeholder="Unique username"
                      required
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 font-semibold text-navy placeholder:text-gray-400 focus:outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/10 transition-all shadow-2xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={form.password}
                          onChange={handleChange}
                          placeholder="••••••••••••"
                          required
                          className="w-full bg-white border border-gray-200 rounded-xl pl-3.5 pr-10 py-2 font-semibold text-navy placeholder:text-gray-400 focus:outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/10 transition-all shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy p-1"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={form.confirmPassword}
                          onChange={handleChange}
                          placeholder="••••••••••••"
                          required
                          className="w-full bg-white border border-gray-200 rounded-xl pl-3.5 pr-10 py-2 font-semibold text-navy placeholder:text-gray-400 focus:outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/10 transition-all shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy p-1"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <p className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-xl text-center border border-red-200">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-saffron to-[#F57C00] text-navy font-black text-sm sm:text-base py-3 sm:py-3.5 rounded-xl hover:text-white transition-all shadow-[0_10px_25px_rgba(255,153,51,0.35)] hover:shadow-[0_12px_30px_rgba(255,153,51,0.5)] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                >
                  <span>{submitting ? "Registering…" : "Complete Registration"}</span>
                  {!submitting && <ArrowRight className="w-4 h-4" />}
                </button>

                {/* Consent / Legal Notice */}
                <p className="text-center text-[11px] text-gray-400 leading-relaxed px-2">
                  By submitting this form, you agree to our{" "}
                  <Link to="/terms" className="text-saffron font-semibold hover:underline underline-offset-2">
                    Terms &amp; Conditions
                  </Link>{" "}
                  and acknowledge our{" "}
                  <Link to="/privacy-policy" className="text-saffron font-semibold hover:underline underline-offset-2">
                    Privacy Policy
                  </Link>.
                </p>

              </form>
            </div>

            {/* Footer Sign In Link */}
            <div className="text-center pt-3 mt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-medium">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-saffron font-extrabold hover:underline"
                >
                  Sign In
                </Link>
              </p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
