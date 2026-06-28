/**
 * Seeds the staging/production database with:
 *  1. A "Super Admin" role with all permissions
 *  2. A "Customer" role (no admin permissions)
 *  3. An initial admin user
 *
 * Run:  npx ts-node src/scripts/seedAdmin.ts
 *
 * The server must have been started at least once first so that
 * permissions and groups are bootstrapped.
 */

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

import RoleModel from "../models/role.model";
import PermissionModel from "../models/permission.model";
import UserModel from "../models/user.model";
import log from "../utils/logger";

const MONGO_URI = process.env.dbUri || "";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@gmail.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin@1234";
const ADMIN_FIRST = process.env.SEED_ADMIN_FIRST || "Eden";
const ADMIN_LAST = process.env.SEED_ADMIN_LAST || "Admin";

async function seed() {
  if (!MONGO_URI) {
    console.error("Set MONGODB_URI or MONGO_URI in .env");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  log.info(`Connected to ${MONGO_URI.split("@").pop()}`);

  // 1. Get all permissions
  const allPermissions = await PermissionModel.find().select("_id");
  const allPermIds = allPermissions.map((p) => p._id);
  log.info(`Found ${allPermIds.length} permissions`);

  // 2. Create or update Super Admin role
  let superRole = await RoleModel.findOne({ name: "Super Admin" });
  if (superRole) {
    superRole.permissions = allPermIds;
    superRole.isActive = true;
    await superRole.save();
    log.info("Updated Super Admin role with all permissions");
  } else {
    superRole = await RoleModel.create({
      name: "Super Admin",
      permissions: allPermIds,
      groups: [],
      isActive: true,
    });
    log.info("Created Super Admin role");
  }

  // 3. Create Customer role (no permissions)
  let customerRole = await RoleModel.findOne({ name: "Customer" });
  if (!customerRole) {
    customerRole = await RoleModel.create({
      name: "Customer",
      permissions: [],
      groups: [],
      isActive: true,
    });
    log.info("Created Customer role");
  } else {
    log.info("Customer role already exists");
  }

  // 4. Create admin user
  let admin = await UserModel.findOne({ email: ADMIN_EMAIL });
  if (admin) {
    log.info(`Admin user ${ADMIN_EMAIL} already exists — skipping`);
  } else {
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
    admin = await UserModel.create({
      email: ADMIN_EMAIL,
      firstName: ADMIN_FIRST,
      lastName: ADMIN_LAST,
      password: hashed,
      role: superRole._id,
      staffId: "STAFF-001",
      isVerified: true,
      isActive: true,
    });
    log.info(`Created admin user: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  }

  log.info("Seed complete!");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
