const crypto = require("crypto");
const { Op } = require("sequelize");
const { Cluster, College, Student, EventRegistration, Event } = require("../models");
const exportToExcel = require("../utils/excelExport");

// ─── Special code used for the all-clusters global view record ───────────────
const GLOBAL_CLUSTER_CODE = "GLOBAL";

// ─── Helper: ensure global view token record exists ──────────────────────────
async function ensureGlobalToken() {
  const [record] = await Cluster.findOrCreate({
    where: { code: GLOBAL_CLUSTER_CODE },
    defaults: {
      facilitatorName: "All Clusters — Global View",
      accessToken: crypto.randomBytes(32).toString("hex"),
    },
  });
  return record;
}

// ─── Helper: build student rows for Excel ────────────────────────────────────
function buildExcelRows(students) {
  return students.map((s, idx) => ({
    serial: idx + 1,
    id: s.id,
    fullName: s.fullName,
    gender: s.gender || "—",
    college: s.College?.name || "N/A",
    cluster: s.College?.Cluster?.code || "Unassigned",
    phoneNumber: s.phoneNumber,
    email: s.email,
    paymentStatus: s.paymentStatus,
    registeredOn: new Date(s.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
  }));
}

// ─── Helper: fetch students for a cluster ────────────────────────────────────
async function fetchStudentsForCluster(clusterId) {
  // All clusters (including CC10 and CC11) now behave the same way:
  // fetch students whose college belongs to this cluster.
  return Student.findAll({
    attributes: ["id", "fullName", "gender", "email", "phoneNumber", "paymentStatus", "createdAt"],
    include: [
      {
        model: College,
        attributes: ["id", "name", "clusterId"],
        where: { clusterId },
        include: [{ model: Cluster, as: "Cluster", attributes: ["code", "facilitatorName"] }],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
}

// ─── Admin Routes (JWT required) ──────────────────────────────────────────────

/** GET /api/clusters — list all clusters with stats (admin JWT) */
async function listClusters(req, res, next) {
  try {
    const rawClusters = await Cluster.findAll({
      include: [
        {
          model: College,
          attributes: ["id", "name", "isPending"],
        },
      ],
    });

    // Natural sort: CC1, CC2 ... CC9, CC10, GLOBAL
    const clusters = rawClusters.sort((a, b) => {
      const numA = parseInt(a.code.replace(/\D/g, ""), 10);
      const numB = parseInt(b.code.replace(/\D/g, ""), 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.code.localeCompare(b.code);
    });

    // Attach registration counts (all clusters treated uniformly)
    const result = await Promise.all(
      clusters.map(async (c) => {
        const clusterCollegeIds = (c.Colleges || [])
          .filter((col) => !col.isPending)
          .map((col) => col.id);

        let registrationCount = 0;
        if (clusterCollegeIds.length > 0) {
          registrationCount = await Student.count({
            include: [
              {
                model: College,
                where: { id: { [Op.in]: clusterCollegeIds } },
                required: true,
              },
            ],
          });
        }

        return {
          id: c.id,
          code: c.code,
          facilitatorName: c.facilitatorName,
          accessToken: c.accessToken,
          collegeCount: clusterCollegeIds.length,
          pendingCollegeCount: (c.Colleges || []).filter((col) => col.isPending).length,
          registrationCount,
          colleges: (c.Colleges || []).map((col) => ({
            id: col.id,
            name: col.name,
            isPending: col.isPending,
          })),
        };
      })
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
}

/** GET /api/clusters/pending-colleges — list unassigned pending colleges (admin JWT) */
async function listPendingColleges(req, res, next) {
  try {
    const colleges = await College.findAll({
      where: { isPending: true },
      attributes: ["id", "name", "createdAt"],
      order: [["createdAt", "DESC"]],
    });
    res.json(colleges);
  } catch (err) {
    next(err);
  }
}

/** GET /api/clusters/unassigned-colleges — count colleges with no cluster (admin JWT) */
async function listUnassignedColleges(req, res, next) {
  try {
    const colleges = await College.findAll({
      where: { clusterId: null, isPending: false },
      attributes: ["id", "name", "createdAt"],
      order: [["name", "ASC"]],
    });
    res.json({ count: colleges.length, colleges });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/clusters/colleges/:id/assign — assign a college to a cluster (SuperAdmin) */
async function assignCollegeToCluster(req, res, next) {
  try {
    const { clusterId } = req.body;
    if (!clusterId) return res.status(400).json({ message: "clusterId is required." });

    const college = await College.findByPk(req.params.id);
    if (!college) return res.status(404).json({ message: "College not found." });

    const cluster = await Cluster.findByPk(clusterId);
    if (!cluster) return res.status(404).json({ message: "Cluster not found." });

    college.clusterId = clusterId;
    college.isPending = false;
    await college.save();

    res.json({ message: `College "${college.name}" assigned to ${cluster.code}.`, college });
  } catch (err) {
    next(err);
  }
}

/** GET /api/clusters/:id/export — stream cluster Excel (admin JWT) */
async function exportClusterExcel(req, res, next) {
  try {
    const cluster = await Cluster.findByPk(req.params.id);
    if (!cluster) return res.status(404).json({ message: "Cluster not found." });

    const students = await fetchStudentsForCluster(cluster.id);
    const rows = buildExcelRows(students);

    await exportToExcel(res, {
      filename: `${cluster.code}-registrations.xlsx`,
      sheetName: `${cluster.code} Registrations`,
      columns: [
        { header: "#", key: "serial", width: 6 },
        { header: "Registration ID", key: "id", width: 38 },
        { header: "Full Name", key: "fullName", width: 24 },
        { header: "Gender", key: "gender", width: 10 },
        { header: "College", key: "college", width: 36 },
        { header: "Cluster", key: "cluster", width: 8 },
        { header: "Phone", key: "phoneNumber", width: 16 },
        { header: "Email", key: "email", width: 30 },
        { header: "Payment Status", key: "paymentStatus", width: 16 },
        { header: "Registered On", key: "registeredOn", width: 22 },
      ],
      rows,
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/clusters/:id/rotate-token — generate new accessToken (SuperAdmin) */
async function regenerateClusterToken(req, res, next) {
  try {
    const cluster = await Cluster.findByPk(req.params.id);
    if (!cluster) return res.status(404).json({ message: "Cluster not found." });

    cluster.accessToken = crypto.randomBytes(32).toString("hex");
    await cluster.save();

    res.json({
      message: `Access token rotated for ${cluster.code}. Old links are now invalid.`,
      accessToken: cluster.accessToken,
    });
  } catch (err) {
    next(err);
  }
}

// ─── Public Routes (token-gated, no JWT) ─────────────────────────────────────

/** GET /api/clusters/by-token?token=xxx — resolve cluster by access token (public) */
async function getClusterByToken(req, res, next) {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "Token is required." });

    const cluster = await Cluster.findOne({
      where: { accessToken: token },
      include: [
        {
          model: College,
          attributes: ["id", "name", "isPending"],
          where: { isPending: false },
          required: false,
        },
      ],
    });

    if (!cluster) return res.status(403).json({ message: "Invalid or revoked access link." });

    // Count registrations for this cluster (uniform for all clusters)
    const collegeIds = (cluster.Colleges || []).map((c) => c.id);
    let registrationCount = 0;
    if (collegeIds.length > 0) {
      registrationCount = await Student.count({
        include: [
          {
            model: College,
            where: { id: { [Op.in]: collegeIds } },
            required: true,
          },
        ],
      });
    }

    res.json({
      id: cluster.id,
      code: cluster.code,
      facilitatorName: cluster.facilitatorName,
      collegeCount: collegeIds.length,
      registrationCount,
      colleges: (cluster.Colleges || []).map((c) => ({ id: c.id, name: c.name })),
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/clusters/by-token/registrations?token=xxx — student list for cluster (public) */
async function getClusterRegistrationsByToken(req, res, next) {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "Token is required." });

    const cluster = await Cluster.findOne({ where: { accessToken: token } });
    if (!cluster) return res.status(403).json({ message: "Invalid or revoked access link." });

    const students = await fetchStudentsForCluster(cluster.id);

    const result = students.map((s) => ({
      id: s.id,
      fullName: s.fullName,
      gender: s.gender || "—",
      college: s.College?.name || "N/A",
      phoneNumber: s.phoneNumber,
      email: s.email,
      paymentStatus: s.paymentStatus,
      registeredOn: s.createdAt,
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
}

/** GET /api/clusters/by-token/export?token=xxx — download Excel for cluster (public) */
async function exportClusterExcelByToken(req, res, next) {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "Token is required." });

    const cluster = await Cluster.findOne({ where: { accessToken: token } });
    if (!cluster) return res.status(403).json({ message: "Invalid or revoked access link." });

    const students = await fetchStudentsForCluster(cluster.id);
    const rows = buildExcelRows(students);

    await exportToExcel(res, {
      filename: `${cluster.code}-registrations.xlsx`,
      sheetName: `${cluster.code} Registrations`,
      columns: [
        { header: "#", key: "serial", width: 6 },
        { header: "Registration ID", key: "id", width: 38 },
        { header: "Full Name", key: "fullName", width: 24 },
        { header: "Gender", key: "gender", width: 10 },
        { header: "College", key: "college", width: 36 },
        { header: "Cluster", key: "cluster", width: 8 },
        { header: "Phone", key: "phoneNumber", width: 16 },
        { header: "Email", key: "email", width: 30 },
        { header: "Payment Status", key: "paymentStatus", width: 16 },
        { header: "Registered On", key: "registeredOn", width: 22 },
      ],
      rows,
    });
  } catch (err) {
    next(err);
  }
}

// ─── Global View Routes (public, token-gated) ────────────────────────────────

/** GET /api/clusters/global-view?token=xxx — resolve global view by token (public) */
async function getGlobalViewInfo(req, res, next) {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "Token is required." });

    const record = await Cluster.findOne({ where: { code: GLOBAL_CLUSTER_CODE, accessToken: token } });
    if (!record) return res.status(403).json({ message: "Invalid or revoked access link." });

    const totalStudents = await Student.count();
    const totalClusters = await Cluster.count({ where: { code: { [Op.ne]: GLOBAL_CLUSTER_CODE } } });

    res.json({ totalStudents, totalClusters, label: "All Clusters — Global View" });
  } catch (err) {
    next(err);
  }
}

/** GET /api/clusters/global-view/registrations?token=xxx — all students (public) */
async function getGlobalRegistrations(req, res, next) {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "Token is required." });

    const record = await Cluster.findOne({ where: { code: GLOBAL_CLUSTER_CODE, accessToken: token } });
    if (!record) return res.status(403).json({ message: "Invalid or revoked access link." });

    const students = await Student.findAll({
      attributes: ["id", "fullName", "gender", "email", "phoneNumber", "paymentStatus", "createdAt"],
      include: [
        {
          model: College,
          attributes: ["id", "name", "clusterId"],
          required: false,
          include: [{ model: Cluster, as: "Cluster", attributes: ["code", "facilitatorName"] }],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const result = students.map((s) => ({
      id: s.id,
      fullName: s.fullName,
      gender: s.gender || "—",
      college: s.College?.name || "N/A",
      cluster: s.College?.Cluster?.code || "CC10",
      phoneNumber: s.phoneNumber,
      email: s.email,
      paymentStatus: s.paymentStatus,
      registeredOn: s.createdAt,
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
}

/** GET /api/clusters/global-view/export?token=xxx — download all-registrations Excel (public) */
async function exportGlobalExcel(req, res, next) {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "Token is required." });

    const record = await Cluster.findOne({ where: { code: GLOBAL_CLUSTER_CODE, accessToken: token } });
    if (!record) return res.status(403).json({ message: "Invalid or revoked access link." });

    const students = await Student.findAll({
      attributes: ["id", "fullName", "gender", "email", "phoneNumber", "paymentStatus", "createdAt"],
      include: [
        {
          model: College,
          attributes: ["id", "name"],
          required: false,
          include: [{ model: Cluster, as: "Cluster", attributes: ["code"] }],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const rows = buildExcelRows(students);

    await exportToExcel(res, {
      filename: `all-clusters-registrations.xlsx`,
      sheetName: "All Registrations",
      columns: [
        { header: "#", key: "serial", width: 6 },
        { header: "Registration ID", key: "id", width: 38 },
        { header: "Full Name", key: "fullName", width: 24 },
        { header: "Gender", key: "gender", width: 10 },
        { header: "College", key: "college", width: 36 },
        { header: "Cluster", key: "cluster", width: 8 },
        { header: "Phone", key: "phoneNumber", width: 16 },
        { header: "Email", key: "email", width: 30 },
        { header: "Payment Status", key: "paymentStatus", width: 16 },
        { header: "Registered On", key: "registeredOn", width: 22 },
      ],
      rows,
    });
  } catch (err) {
    next(err);
  }
}

// ─── Admin: Distribute unassigned colleges equally across clusters ──────────

/** POST /api/clusters/distribute-unassigned — round-robin assign unassigned colleges (SuperAdmin) */
async function distributeUnassignedColleges(req, res, next) {
  try {
    // 1. Find all colleges with no cluster and not pending
    const unassignedColleges = await College.findAll({
      where: { clusterId: null, isPending: false },
      order: [["name", "ASC"]],
    });

    if (unassignedColleges.length === 0) {
      return res.json({ message: "No unassigned colleges found. Nothing to distribute.", distributed: 0, summary: [] });
    }

    // 2. Fetch all real clusters (exclude GLOBAL)
    const clusters = await Cluster.findAll({
      where: { code: { [Op.ne]: GLOBAL_CLUSTER_CODE } },
      include: [{ model: College, attributes: ["id"], where: { isPending: false }, required: false }],
      order: [["code", "ASC"]],
    });

    if (clusters.length === 0) {
      return res.status(500).json({ message: "No clusters found. Please seed clusters first." });
    }

    // 3. Sort clusters ascending by current college count (fill smallest first)
    const sortedClusters = [...clusters].sort(
      (a, b) => (a.Colleges?.length || 0) - (b.Colleges?.length || 0)
    );

    // 4. Round-robin assignment
    const summary = sortedClusters.map((c) => ({ code: c.code, id: c.id, assigned: [] }));
    let pointer = 0;

    for (const college of unassignedColleges) {
      const target = summary[pointer % summary.length];
      college.clusterId = target.id;
      college.isPending = false;
      await college.save();
      target.assigned.push(college.name);
      pointer++;
    }

    return res.json({
      message: `Successfully distributed ${unassignedColleges.length} college(s) across ${sortedClusters.length} clusters.`,
      distributed: unassignedColleges.length,
      summary: summary.map((s) => ({ cluster: s.code, count: s.assigned.length, colleges: s.assigned })),
    });
  } catch (err) {
    next(err);
  }
}

// ─── Admin: Global token management ──────────────────────────────────────────

/** GET /api/clusters/global-token — get current global view token (admin JWT) */
async function getGlobalToken(req, res, next) {
  try {
    const record = await ensureGlobalToken();
    res.json({ accessToken: record.accessToken });
  } catch (err) {
    next(err);
  }
}

/** POST /api/clusters/global-token/rotate — rotate global view token (SuperAdmin) */
async function regenerateGlobalToken(req, res, next) {
  try {
    const record = await ensureGlobalToken();
    record.accessToken = crypto.randomBytes(32).toString("hex");
    await record.save();
    res.json({
      message: "Global view token rotated. Old link is now invalid.",
      accessToken: record.accessToken,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listClusters,
  listPendingColleges,
  listUnassignedColleges,
  assignCollegeToCluster,
  distributeUnassignedColleges,
  exportClusterExcel,
  regenerateClusterToken,
  getClusterByToken,
  getClusterRegistrationsByToken,
  exportClusterExcelByToken,
  // Global view
  getGlobalViewInfo,
  getGlobalRegistrations,
  exportGlobalExcel,
  getGlobalToken,
  regenerateGlobalToken,
};
