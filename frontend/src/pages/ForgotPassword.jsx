import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import { Mail, Phone, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!email.trim()) return setError("Please enter your registered email address.");
    if (!phoneNumber.trim()) return setError("Please enter your registered phone number.");

    setSubmitting(true);
    try {
      const res = await api.post("/auth/verify-identity", {
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
      });

      // Identity verified — backend returns a reset token. Redirect immediately.
      setSuccessMessage(res.data.message || "Identity verified! Redirecting…");
      setTimeout(() => {
        navigate(`/reset-password?token=${res.data.resetToken}`);
      }, 1000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Verification failed. Please check your email and phone number and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-16 bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-navy via-[#1e2d5e] to-navy px-8 py-7 text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="w-12 h-12 bg-saffron/20 rounded-full flex items-center justify-center border-2 border-saffron/40">
                <ShieldCheck className="w-6 h-6 text-saffron" />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight mb-1">
              Verify Your Identity
            </h1>
            <p className="text-sm text-white/60 font-medium">
              Enter your registered email &amp; phone to reset your password
            </p>
          </div>

          {/* Body */}
          <div className="px-8 py-8">
            {successMessage ? (
              /* Success State */
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center border-2 border-green-200">
                  <ShieldCheck className="w-7 h-7 text-green-500" />
                </div>
                <div>
                  <p className="font-bold text-navy text-base mb-1">Identity Confirmed!</p>
                  <p className="text-sm text-gray-500">{successMessage}</p>
                  <p className="text-xs text-gray-400 mt-1">Redirecting to password reset page…</p>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden mt-2">
                  <div className="bg-saffron h-1 rounded-full animate-[widthGrow_1s_ease-in-out]" style={{ width: "100%", transition: "width 1s" }} />
                </div>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="space-y-5">
                <p className="text-xs text-gray-500 text-center leading-relaxed mb-1">
                  We'll match your email and phone number with our records.
                  If they match, you'll be taken directly to the password reset page — <strong>no email needed</strong>.
                </p>

                {/* Email Field */}
                <div>
                  <label htmlFor="fp-email" className="block text-xs font-bold text-navy mb-1.5 uppercase tracking-wide">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="fp-email"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                      className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron transition-all bg-gray-50/60 hover:bg-white"
                    />
                  </div>
                </div>

                {/* Phone Field */}
                <div>
                  <label htmlFor="fp-phone" className="block text-xs font-bold text-navy mb-1.5 uppercase tracking-wide">
                    Registered Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="fp-phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => { setPhoneNumber(e.target.value); setError(""); }}
                      placeholder="Enter the phone number used during registration"
                      required
                      autoComplete="tel"
                      className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron transition-all bg-gray-50/60 hover:bg-white"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    Use the exact phone number you entered when you registered.
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-medium rounded-xl px-4 py-3">
                    ⚠️ {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  id="fp-submit-btn"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-saffron text-navy font-bold px-6 py-3.5 rounded-xl hover:opacity-90 disabled:opacity-60 transition-all shadow-md shadow-saffron/20 text-sm"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    <>
                      Verify &amp; Reset Password
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Footer Links */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <Link to="/login" className="text-xs text-gray-500 hover:text-navy font-medium transition-colors">
                    ← Back to Login
                  </Link>
                  <Link to="/register" className="text-xs text-saffron hover:underline font-semibold">
                    Create Account
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Note below card */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Your identity is verified securely. No emails required.
        </p>
      </div>
    </div>
  );
}
