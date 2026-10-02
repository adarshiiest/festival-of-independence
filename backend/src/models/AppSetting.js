const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

/**
 * AppSetting — a simple key-value store for site-wide configuration.
 * Currently used to control whether student registration is open or closed.
 */
const AppSetting = sequelize.define(
  "AppSetting",
  {
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      primaryKey: true,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: "app_settings",
    timestamps: true,
  }
);

module.exports = AppSetting;
