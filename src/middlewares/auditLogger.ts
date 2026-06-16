import { Request, Response, NextFunction } from "express";
import { createAuditLog } from "../services/audit.service";
import { AuditSeverity } from "../models/audit.model";
import log from "../utils/logger";

const MUTATING = new Set(["POST", "PATCH", "PUT", "DELETE"]);

const SECTION: Record<string, { category: string; resource: string }> = {
  product: { category: "Inventory", resource: "Product" },
  category: { category: "Catalog", resource: "Category" },
  order: { category: "Orders", resource: "Order" },
  user: { category: "User Management", resource: "User" },
  role: { category: "Access Control", resource: "Role" },
  group: { category: "Access Control", resource: "Group" },
  permissions: { category: "Access Control", resource: "Permission" },
  auth: { category: "Security", resource: "Auth" },
  resources: { category: "System", resource: "Resource" },
};

const VERB: Record<string, string> = {
  POST: "Created",
  PATCH: "Updated",
  PUT: "Updated",
  DELETE: "Deleted",
};

const authAction = (path: string): string => {
  if (/login|session/i.test(path)) return "Login";
  if (/logout/i.test(path)) return "Logout";
  if (/register|create/i.test(path)) return "Account Created";
  if (/reset|password/i.test(path)) return "Password Reset";
  if (/refresh/i.test(path)) return "Token Refreshed";
  if (/verif/i.test(path)) return "Verification";
  if (/google/i.test(path)) return "Google Auth";
  return "Auth Action";
};

const deriveMeta = (method: string, path: string) => {
  const segments = path.split("?")[0].split("/").filter(Boolean); // ['api','product','123']
  const base = segments[1] || "system";
  const section = SECTION[base] || { category: "System", resource: base };
  const verb = VERB[method] || method;

  let action: string;
  if (base === "auth") {
    action = authAction(path);
  } else if (path.includes("/variants")) {
    action = `${verb} Variant`;
  } else if (path.includes("/attributes")) {
    action = `${verb} Attribute`;
  } else if (path.includes("/bulk")) {
    action = `Bulk ${verb} ${section.resource}`;
  } else if (path.includes("/status")) {
    action = `${section.resource} Status Changed`;
  } else {
    action = `${section.resource} ${verb}`;
  }

  // Severity: deletes and security/access events weigh heavier.
  let severity = AuditSeverity.Low;
  if (method === "DELETE") severity = AuditSeverity.High;
  else if (method === "POST") severity = AuditSeverity.Medium;

  if (
    (section.category === "Security" || section.category === "Access Control") &&
    severity === AuditSeverity.Low
  ) {
    severity = AuditSeverity.Medium;
  }

  return { ...section, action, severity };
};

const clientIp = (req: Request): string => {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length) return fwd.split(",")[0].trim();
  return req.socket?.remoteAddress || req.ip || "unknown";
};

// Global middleware: records every successful-or-failed mutating request after
// the response finishes (so req.user, set by per-route auth, is available).
const auditLogger = (req: Request, res: Response, next: NextFunction) => {
  if (!MUTATING.has(req.method)) return next();

  const ip = clientIp(req);
  const bodyEmail =
    typeof req.body?.email === "string" ? req.body.email : undefined;

  res.on("finish", () => {
    // Skip noisy validation failures (417) and unauthorized probes (401/403).
    if ([401, 403, 417].includes(res.statusCode)) return;

    const meta = deriveMeta(req.method, req.originalUrl);
    let severity = meta.severity;
    if (res.statusCode >= 400 && severity === AuditSeverity.Low) {
      severity = AuditSeverity.Medium;
    }

    createAuditLog({
      actor: (req.user?.id ?? null) as any,
      actorEmail: req.user ? undefined : bodyEmail,
      method: req.method,
      endpoint: req.originalUrl.split("?")[0],
      resource: meta.resource,
      category: meta.category,
      action: meta.action,
      details: `${req.method} ${req.originalUrl.split("?")[0]} → ${res.statusCode}`,
      ipAddress: ip,
      statusCode: res.statusCode,
      severity,
    }).catch((err) => log.error(err, "Failed to write audit log"));
  });

  next();
};

export default auditLogger;
