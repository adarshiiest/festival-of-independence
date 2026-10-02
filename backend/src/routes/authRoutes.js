const express = require("express");
const router = express.Router();
const {
  sendOtp,
  verifyOtp,
  registerStudent,
  loginStudent,
  loginAdmin,
  verifyAdminOtp,
  forgotPassword,
  resetPassword,
  verifyIdentity,
  registrationStatus,
} = require("../controllers/authController");

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/student/register", registerStudent);
router.post("/student/login", loginStudent);
router.post("/admin/login", loginAdmin);
router.post("/admin/verify-otp", verifyAdminOtp);

// Password reset via email + phone identity verification (no email OTP needed)
router.post("/verify-identity", verifyIdentity);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Public endpoint: check if registration is currently open
router.get("/registration-status", registrationStatus);

module.exports = router;
