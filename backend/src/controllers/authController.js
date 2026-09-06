const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { Student, Admin, OtpVerification, College, Cluster } = require("../models");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");
const { Op } = require("sequelize");

/**
 * Resolve the target cluster for a brand-new unknown college.
 * Alternates between CC10 and CC11 based on how many colleges are already
 * in those two clusters combined (student-wise round-robin).
 * Even count → CC10, Odd count → CC11.
 */
async function resolveOverflowClusterId() {
  const cc10 = await Cluster.findOne({ where: { code: "CC10" } }).catch(() => null);
  const cc11 = await Cluster.findOne({ where: { code: "CC11" } }).catch(() => null);

  // If CC11 doesn't exist yet, fall back to CC10 as before
  if (!cc10) return null;
  if (!cc11) return cc10.id;

  // Count total colleges assigned to either CC10 or CC11
  const totalInBoth = await College.count({
    where: { clusterId: { [Op.in]: [cc10.id, cc11.id] } },
  });

  // Even → CC10, Odd → CC11
  return totalInBoth % 2 === 0 ? cc10.id : cc11.id;
}

/** POST /api/auth/send-otp */
async function sendOtp(req, res, next) {
  try {
    const { type, target } = req.body;
    if (!type || !target || !["email", "phone"].includes(type)) {
      return res.status(400).json({ message: "Valid type ('email' or 'phone') and target are required." });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete older OTP entries for this target & type
    await OtpVerification.destroy({ where: { target, type } });

    await OtpVerification.create({
      target,
      code,
      type,
      expiresAt,
      isVerified: false,
    });

    if (type === "email") {
      await sendEmail({
        to: target,
        subject: "Your OTP Verification Code - Festival of Independence",
        text: `Your OTP code for verification is: ${code}. It will expire in 10 minutes.`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #1E293B;">Festival of Independence</h2>
            <p>Your OTP verification code is:</p>
            <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #4F46E5; margin: 20px 0;">${code}</div>
            <p style="font-size: 13px; color: #64748B;">This code will expire in 10 minutes. Do not share this OTP with anyone.</p>
          </div>
        `,
      });
      console.log(`[EMAIL OTP DISPATCH] Target: ${target} Code: ${code}`);
    } else {
      console.log(`\n======================================================================`);
      console.log(`📱 [SMS PHONE OTP DISPATCH] Target Phone: ${target} | Code: ${code}`);
      console.log(`======================================================================\n`);
    }

    res.json({ message: `OTP code sent successfully to ${target}.`, devOtp: process.env.NODE_ENV !== "production" ? code : undefined });
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/verify-otp */
async function verifyOtp(req, res, next) {
  try {
    const { type, target, code } = req.body;
    if (!type || !target || !code) {
      return res.status(400).json({ message: "Type, target, and code are required." });
    }

    const record = await OtpVerification.findOne({
      where: {
        target,
        type,
        code,
        expiresAt: { [Op.gt]: new Date() },
      },
    });

    if (!record) {
      return res.status(400).json({ message: "Invalid or expired OTP code." });
    }

    record.isVerified = true;
    await record.save();

    res.json({ message: `${type === "email" ? "Email" : "Phone number"} verified successfully!`, verified: true });
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/student/register */
async function registerStudent(req, res, next) {
  try {
    const { fullName, collegeId, customCollegeName, gender, phoneNumber, address, email, username, password } = req.body;

    if (!fullName || (!collegeId && !customCollegeName) || !phoneNumber || !address || !email || !username || !password) {
      return res.status(400).json({ message: "All required fields must be filled." });
    }

    // 1. Legal Email Syntax Validation (RFC 5322 compliant regex)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ message: "Please provide a valid and legal email address (e.g. name@example.com)." });
    }

    // 2. Check if email is already registered in the system
    const existingStudentByEmail = await Student.findOne({ where: { email: normalizedEmail } });
    if (existingStudentByEmail) {
      return res.status(400).json({ message: "An account with this email is already registered. Please log in instead." });
    }

    // 3. Check if username is already taken
    const existingStudentByUsername = await Student.findOne({ where: { username: username.trim() } });
    if (existingStudentByUsername) {
      return res.status(400).json({ message: "This username is already taken. Please choose a different username." });
    }

    // Resolve College
    // For NEW (unknown) colleges: alternate assignment between CC10 and CC11
    // using a student-wise round-robin (total colleges in both clusters as counter).
    // Even count → CC10, Odd count → CC11.
    let finalCollegeId = collegeId;

    if (customCollegeName && customCollegeName.trim().length > 0) {
      const trimmedName = customCollegeName.trim();
      // Check if this college already exists
      const existing = await College.findOne({ where: { name: trimmedName } });
      if (existing) {
        // College already exists — keep its current cluster assignment
        finalCollegeId = existing.id;
      } else {
        // Brand-new college: resolve which cluster it goes to (CC10 or CC11)
        const overflowClusterId = await resolveOverflowClusterId();
        const newCollege = await College.create({
          name: trimmedName,
          clusterId: overflowClusterId,
          isPending: false,
        });
        finalCollegeId = newCollege.id;
        console.log(`[OVERFLOW COLLEGE] "${trimmedName}" → cluster ID ${overflowClusterId}`);
      }
    } else if (collegeId) {
      // If collegeId is a college name string rather than a UUID, find or create it
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(collegeId);
      if (!isUuid) {
        const existing = await College.findOne({ where: { name: collegeId } });
        if (existing) {
          finalCollegeId = existing.id;
        } else {
          // Brand-new college by name: alternate between CC10 and CC11
          const overflowClusterId = await resolveOverflowClusterId();
          const newCollege = await College.create({
            name: collegeId,
            clusterId: overflowClusterId,
            isPending: false,
          });
          finalCollegeId = newCollege.id;
          console.log(`[OVERFLOW COLLEGE] "${collegeId}" → cluster ID ${overflowClusterId}`);
        }
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const student = await Student.create({
      fullName: fullName.trim(),
      gender: gender || null,
      collegeId: finalCollegeId,
      phoneNumber: phoneNumber.trim(),
      address: address.trim(),
      email: normalizedEmail,
      username: username.trim(),
      passwordHash,
    });

    // Send Welcome & Congratulation Email asynchronously (non-blocking)
    const collegeRecord = finalCollegeId ? await College.findByPk(finalCollegeId, { include: ["Cluster"] }).catch(() => null) : null;
    const collegeName = collegeRecord?.name || "Your College";
    const clusterCode = collegeRecord?.Cluster?.code || "";
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    sendEmail({
      to: student.email,
      subject: "🎉 Registration Confirmed — Welcome to Festival of Independence 2026!",
      text: `Dear ${student.fullName},\n\nCongratulations! Your registration for Festival of Independence (IYF Kolkata) has been successfully confirmed.\n\nRegistration ID: ${student.id}\nUsername: ${student.username}\nCollege: ${collegeName}${clusterCode ? ` (${clusterCode})` : ""}\n\nYou can access your student dashboard here:\n${clientUrl}/login\n\nWarm regards,\nIYF Kolkata Team`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; background-color: #ffffff; border: 1px solid #f0f0f0; border-radius: 16px; color: #1e293b;">
          
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #FF9933 0%, #FF6600 100%); padding: 28px; border-radius: 12px; text-align: center; color: #ffffff;">
            <span style="font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; background: rgba(255,255,255,0.25); padding: 4px 12px; border-radius: 20px;">
              IYF Kolkata Presents
            </span>
            <h1 style="margin: 12px 0 6px; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">
              Festival of Independence
            </h1>
            <p style="margin: 0; font-size: 14px; opacity: 0.95;">Youth Enlightenment & Cultural Fest</p>
          </div>

          <!-- Body Content -->
          <div style="padding: 24px 8px 8px;">
            <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">
              🎉 Congratulations, ${student.fullName}!
            </h2>
            <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px;">
              Your registration for the <strong>Festival of Independence</strong> is officially confirmed. We are thrilled to welcome you to this transformative experience.
            </p>

            <!-- Registration Info Box -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
              <h3 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-top: 0; margin-bottom: 12px;">
                Registration Details
              </h3>
              <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 4px 0; color: #64748b; font-weight: 600; width: 35%;">Registration ID:</td>
                  <td style="padding: 4px 0; font-family: monospace; font-weight: 700; color: #0f172a;">${student.id}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Username:</td>
                  <td style="padding: 4px 0; font-weight: 700; color: #0f172a;">${student.username}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748b; font-weight: 600;">College:</td>
                  <td style="padding: 4px 0; font-weight: 600; color: #0f172a;">${collegeName}${clusterCode ? ` (${clusterCode})` : ""}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Phone:</td>
                  <td style="padding: 4px 0; font-weight: 600; color: #0f172a;">${student.phoneNumber}</td>
                </tr>
              </table>
            </div>

            <!-- Call to Action Button -->
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${clientUrl}/login" style="display: inline-block; background: linear-gradient(135deg, #FF9933 0%, #F57C00 100%); color: #ffffff; text-decoration: none; font-weight: 800; font-size: 14px; padding: 12px 28px; border-radius: 10px; box-shadow: 0 4px 12px rgba(255, 153, 51, 0.3);">
                Sign In to Student Dashboard →
              </a>
            </div>

            <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; text-align: center; margin: 0;">
              If you have any questions or need assistance, feel free to reply to this email or contact the IYF Kolkata team.
            </p>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 20px; text-align: center; font-size: 11px; color: #94a3b8;">
            © Festival of Independence · ISKCON Youth Forum (IYF) Kolkata
          </div>
        </div>
      `,
    }).catch((err) => {
      console.warn("Failed to dispatch welcome email:", err.message);
    });

    const token = generateToken({ id: student.id, role: "student" });
    res.status(201).json({
      token,
      student: { id: student.id, fullName: student.fullName, email: student.email, gender: student.gender },
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/student/login  (body: { identifier, password } — identifier = username or email) */
async function loginStudent(req, res, next) {
  try {
    const { identifier, password } = req.body;

    const student = await Student.findOne({
      where: { [Op.or]: [{ username: identifier }, { email: identifier }] },
    });
    if (!student) return res.status(401).json({ message: "Invalid credentials." });

    const isMatch = await bcrypt.compare(password, student.passwordHash);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials." });

    const token = generateToken({ id: student.id, role: "student" });
    res.json({
      token,
      student: {
        id: student.id,
        fullName: student.fullName,
        email: student.email,
        paymentStatus: student.paymentStatus,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/admin/login */
async function loginAdmin(req, res, next) {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ where: { email } });
    if (!admin) return res.status(401).json({ message: "Invalid credentials." });

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials." });

    // Direct login for both SuperAdmin and VolunteerAdmin (2FA OTP verification disabled)
    const token = generateToken({ id: admin.id, role: "admin", adminRole: admin.role });
    return res.json({
      requireOtp: false,
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/admin/verify-otp */
async function verifyAdminOtp(req, res, next) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP code are required." });
    }

    const admin = await Admin.findOne({ where: { email } });
    if (!admin) return res.status(404).json({ message: "Admin account not found." });

    const record = await OtpVerification.findOne({
      where: {
        target: email,
        type: "email",
        code: otp,
        expiresAt: { [Op.gt]: new Date() },
      },
    });

    if (!record) {
      return res.status(400).json({ message: "Invalid or expired OTP code." });
    }

    record.isVerified = true;
    await record.save();

    const token = generateToken({ id: admin.id, role: "admin", adminRole: admin.role });
    res.json({
      token,
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/forgot-password */
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    let user = await Student.findOne({ where: { email } });
    if (!user) {
      user = await Admin.findOne({ where: { email } });
    }

    if (!user) {
      return res.status(200).json({
        message: "If that email is registered, a password reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: "Password Reset Request - Festival of Independence",
      text: `Click link to reset password: ${resetUrl}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Please click the button below to reset your password within 1 hour:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p style="word-break: break-all; color: #4F46E5;">${resetUrl}</p>
        </div>
      `,
    });

    res.status(200).json({
      message: "If that email is registered, a password reset link has been sent.",
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/reset-password */
async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: "Token and password are required." });
    }

    let user = await Student.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      user = await Admin.findOne({
        where: {
          resetPasswordToken: token,
          resetPasswordExpires: { [Op.gt]: new Date() },
        },
      });
    }

    if (!user) {
      return res.status(400).json({ message: "Password reset token is invalid or has expired." });
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ message: "Password has been reset successfully. You can now log in." });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  sendOtp,
  verifyOtp,
  registerStudent,
  loginStudent,
  loginAdmin,
  verifyAdminOtp,
  forgotPassword,
  resetPassword,
};
