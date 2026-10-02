const express = require("express");
const router = express.Router();
const { protect, requireRole, requireSuperAdmin } = require("../middleware/authMiddleware");
const {
  listStudents,
  deleteStudent,
  exportStudents,
  listPayments,
  createNotification,
  listNotifications,
  deleteNotification,
  listAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getSettings,
  updateSettings,
} = require("../controllers/adminController");

router.use(protect, requireRole("admin"));

router.get("/students", listStudents);
router.delete("/students/:id", requireSuperAdmin, deleteStudent);
router.get("/students/export", exportStudents);
router.get("/payments", listPayments);

router.get("/notifications", listNotifications);
router.post("/notifications", createNotification);
router.delete("/notifications/:id", deleteNotification);

router.get("/team", listAdmins);
router.post("/team", requireSuperAdmin, createAdmin);
router.put("/team/:id", requireSuperAdmin, updateAdmin);
router.delete("/team/:id", requireSuperAdmin, deleteAdmin);

router.get("/settings", getSettings);
router.put("/settings", requireSuperAdmin, updateSettings);

module.exports = router;
