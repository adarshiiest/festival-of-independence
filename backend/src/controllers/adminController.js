const bcrypt = require("bcryptjs");
const { Student, Admin, College, Payment, Notification, EventRegistration, AppSetting } = require("../models");
const exportToExcel = require("../utils/excelExport");

/** GET /api/admin/students?college=&paymentStatus=&search=&date=&startDate=&endDate=&gender= */
async function listStudents(req, res, next) {
  try {
    const { college, paymentStatus, search, date, startDate, endDate, gender } = req.query;
    const { Op } = require("sequelize");
    const where = {};

    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (gender) where.gender = { [Op.iLike]: gender };
    if (search) {
      where[Op.or] = [
        { fullName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phoneNumber: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (date) {
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      where.createdAt = { [Op.between]: [startOfDay, endOfDay] };
    } else if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(`${startDate}T00:00:00.000Z`);
      if (endDate) where.createdAt[Op.lte] = new Date(`${endDate}T23:59:59.999Z`);
    }

    const collegeWhere = {};
    if (college) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(college);
      if (isUuid) {
        collegeWhere[Op.or] = [{ id: college }, { name: college }];
      } else {
        collegeWhere.name = college;
      }
    }

    const students = await Student.findAll({
      where,
      attributes: { exclude: ["passwordHash"] },
      include: [
        {
          model: College,
          attributes: ["id", "name"],
          where: college ? collegeWhere : undefined,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(students);
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/admin/students/:id — delete registered student account */
async function deleteStudent(req, res, next) {
  try {
    if (req.user.adminRole !== "SuperAdmin") {
      return res.status(403).json({ message: "Only Super Admins can delete student registrations." });
    }

    const studentId = req.params.id;
    const student = await Student.findByPk(studentId);
    if (!student) return res.status(404).json({ message: "Student account not found." });

    await Payment.destroy({ where: { studentId } });
    await EventRegistration.destroy({ where: { studentId } });
    await student.destroy();

    res.json({ message: "Student account deleted successfully." });
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/students/export — download filtered list as Excel */
async function exportStudents(req, res, next) {
  try {
    const { college, paymentStatus, search, date, startDate, endDate, gender } = req.query;
    const { Op } = require("sequelize");
    const where = {};

    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (gender) where.gender = { [Op.iLike]: gender };
    if (search) {
      where[Op.or] = [
        { fullName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phoneNumber: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (date) {
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      where.createdAt = { [Op.between]: [startOfDay, endOfDay] };
    } else if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(`${startDate}T00:00:00.000Z`);
      if (endDate) where.createdAt[Op.lte] = new Date(`${endDate}T23:59:59.999Z`);
    }

    const collegeWhere = {};
    if (college) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(college);
      if (isUuid) {
        collegeWhere[Op.or] = [{ id: college }, { name: college }];
      } else {
        collegeWhere.name = college;
      }
    }

    const students = await Student.findAll({
      where,
      attributes: ["id", "fullName", "gender", "email", "phoneNumber", "paymentStatus", "createdAt"],
      include: [
        {
          model: College,
          attributes: ["id", "name"],
          where: college ? collegeWhere : undefined,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const rows = students.map((s) => ({
      id: s.id,
      fullName: s.fullName,
      gender: s.gender || "—",
      email: s.email,
      phoneNumber: s.phoneNumber,
      college: s.College?.name || "N/A",
      paymentStatus: s.paymentStatus,
      registeredOn: new Date(s.createdAt).toLocaleDateString(),
    }));

    await exportToExcel(res, {
      filename: "students.xlsx",
      sheetName: "Students",
      columns: [
        { header: "ID", key: "id", width: 36 },
        { header: "Full Name", key: "fullName", width: 24 },
        { header: "Gender", key: "gender", width: 14 },
        { header: "Email", key: "email", width: 28 },
        { header: "Phone", key: "phoneNumber", width: 16 },
        { header: "College", key: "college", width: 28 },
        { header: "Payment Status", key: "paymentStatus", width: 16 },
        { header: "Registered On", key: "registeredOn", width: 16 },
      ],
      rows,
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/payments */
async function listPayments(req, res, next) {
  try {
    const payments = await Payment.findAll({
      include: [{ model: Student, attributes: ["fullName", "email"] }],
      order: [["createdAt", "DESC"]],
    });
    res.json(payments);
  } catch (err) {
    next(err);
  }
}

/** POST /api/admin/notifications — broadcast notification to students */
async function createNotification(req, res, next) {
  try {
    const { title, message } = req.body;
    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required." });
    }
    const notification = await Notification.create({ title, message, targetRole: "student" });
    res.status(201).json(notification);
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/notifications */
async function listNotifications(req, res, next) {
  try {
    const notifications = await Notification.findAll({ order: [["createdAt", "DESC"]] });
    res.json(notifications);
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/admin/notifications/:id */
async function deleteNotification(req, res, next) {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) return res.status(404).json({ message: "Notification not found." });
    await notification.destroy();
    res.json({ message: "Notification deleted." });
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/team — list all admin team members */
async function listAdmins(req, res, next) {
  try {
    const admins = await Admin.findAll({
      attributes: { exclude: ["passwordHash"] },
      order: [["createdAt", "DESC"]],
    });
    res.json(admins);
  } catch (err) {
    next(err);
  }
}

/** POST /api/admin/team — add new admin account (SuperAdmin only) */
async function createAdmin(req, res, next) {
  try {
    if (req.user.adminRole !== "SuperAdmin") {
      return res.status(403).json({ message: "Only Super Admins can create new admin accounts." });
    }

    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    const existing = await Admin.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "An admin with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newAdmin = await Admin.create({
      name,
      email,
      passwordHash,
      role: role || "VolunteerAdmin",
    });

    res.status(201).json({
      id: newAdmin.id,
      name: newAdmin.name,
      email: newAdmin.email,
      role: newAdmin.role,
    });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/admin/team/:id — update admin details (SuperAdmin only) */
async function updateAdmin(req, res, next) {
  try {
    if (req.user.adminRole !== "SuperAdmin") {
      return res.status(403).json({ message: "Only Super Admins can update admin details." });
    }

    const admin = await Admin.findByPk(req.params.id);
    if (!admin) return res.status(404).json({ message: "Admin account not found." });

    const { name, email, role, password } = req.body;

    if (name) admin.name = name;
    if (email && email !== admin.email) {
      const existing = await Admin.findOne({ where: { email } });
      if (existing) {
        return res.status(409).json({ message: "Another admin already uses this email." });
      }
      admin.email = email;
    }
    if (role && ["SuperAdmin", "VolunteerAdmin"].includes(role)) {
      if (admin.role === "SuperAdmin" && role !== "SuperAdmin") {
        const superAdminCount = await Admin.count({ where: { role: "SuperAdmin" } });
        if (superAdminCount <= 1) {
          return res.status(400).json({ message: "Cannot demote the only remaining Super Admin." });
        }
      }
      admin.role = role;
    }
    if (password && password.trim().length > 0) {
      admin.passwordHash = await bcrypt.hash(password, 10);
    }

    await admin.save();

    res.json({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      message: "Admin details updated successfully.",
    });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/admin/team/:id — delete admin account (SuperAdmin only) */
async function deleteAdmin(req, res, next) {
  try {
    if (req.user.adminRole !== "SuperAdmin") {
      return res.status(403).json({ message: "Only Super Admins can delete admin accounts." });
    }

    const admin = await Admin.findByPk(req.params.id);
    if (!admin) return res.status(404).json({ message: "Admin not found." });

    await admin.destroy();
    res.json({ message: "Admin account removed." });
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/settings — get site-wide settings */
async function getSettings(req, res, next) {
  try {
    const registrationSetting = await AppSetting.findByPk("registrationOpen");
    const registrationOpen = registrationSetting ? registrationSetting.value === "true" : true;
    res.json({ registrationOpen });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/admin/settings — update site-wide settings (SuperAdmin only) */
async function updateSettings(req, res, next) {
  try {
    if (req.user.adminRole !== "SuperAdmin") {
      return res.status(403).json({ message: "Only Super Admins can change site settings." });
    }

    const { registrationOpen } = req.body;
    if (typeof registrationOpen !== "boolean") {
      return res.status(400).json({ message: "registrationOpen must be a boolean." });
    }

    await AppSetting.upsert({ key: "registrationOpen", value: String(registrationOpen) });

    res.json({ registrationOpen, message: `Student registration is now ${registrationOpen ? "open" : "closed"}.` });
  } catch (err) {
    next(err);
  }
}

module.exports = {
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
};
