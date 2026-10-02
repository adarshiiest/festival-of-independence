const sequelize = require("../config/db");
const Student = require("./Student");
const Admin = require("./Admin");
const College = require("./College");
const Cluster = require("./Cluster");
const Payment = require("./Payment");
const Event = require("./Event");
const ContactMessage = require("./ContactMessage");
const OtpVerification = require("./OtpVerification");
const Notification = require("./Notification");
const EventRegistration = require("./EventRegistration");
const Testimonial = require("./Testimonial");
const AppSetting = require("./AppSetting");

// ----- Associations -----

// Cluster ↔ College
Cluster.hasMany(College, { foreignKey: "clusterId" });
College.belongsTo(Cluster, { foreignKey: "clusterId", as: "Cluster" });

// College ↔ Student
College.hasMany(Student, { foreignKey: "collegeId" });
Student.belongsTo(College, { foreignKey: "collegeId" });

// Student ↔ Payment
Student.hasMany(Payment, { foreignKey: "studentId" });
Payment.belongsTo(Student, { foreignKey: "studentId" });

// Student ↔ EventRegistration ↔ Event
Student.hasMany(EventRegistration, { foreignKey: "studentId" });
EventRegistration.belongsTo(Student, { foreignKey: "studentId" });

Event.hasMany(EventRegistration, { foreignKey: "eventId" });
EventRegistration.belongsTo(Event, { foreignKey: "eventId" });

module.exports = {
  sequelize,
  Student,
  Admin,
  College,
  Cluster,
  Payment,
  Event,
  ContactMessage,
  OtpVerification,
  Notification,
  EventRegistration,
  Testimonial,
  AppSetting,
};
