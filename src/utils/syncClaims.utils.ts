import { Application } from "express";
import ClaimModel from "../models/claim.model";

export const syncRouteClaims = async (app: Application) => {
  const routes: Array<{ path: string; method: string }> = [];

  const extractRoutes = (stack: any[], prefix = "") => {
    stack.forEach((middleware: any) => {
      if (middleware.route) {
        // 1. Clean up the path by removing trailing slashes and express regex artifacts
        const path = (prefix + middleware.route.path)
          .replace(/\/+/g, "/") // Remove double slashes
          .replace(/\/\?\(\?=\/\|\$\)/g, ""); // Remove the express router regex artifact

        Object.keys(middleware.route.methods).forEach((method) => {
          routes.push({ path, method: method.toUpperCase() });
        });
      } else if (middleware.name === "router" && middleware.handle.stack) {
        const newPrefix =
          prefix +
          middleware.regexp.source
            .replace("^\\", "")
            .replace("\\/?(?=\\/|$)", "")
            .replace(/\\\//g, "/");
        extractRoutes(middleware.handle.stack, newPrefix);
      }
    });
  };

  extractRoutes(app._router.stack);

  for (const route of routes) {
    // 2. Transform the name structure
    // e.g., "GET" + "/api/user/:id" -> "get_user_by_id"
    let readableName = route.path
      .replace(/^\/api\//, "") // Remove /api/ prefix
      .replace(/\//g, "_") // Replace slashes with underscores
      .replace(/:(\w+)/g, "by_$1") // Convert :id to by_id
      .replace(/_+/g, "_") // Clean up double underscores
      .replace(/^_|_$/g, ""); // Trim underscores from start/end

    const claimName = `${route.method.toLowerCase()}_${readableName}`;

    await ClaimModel.findOneAndUpdate(
      { name: claimName },
      {
        endpoint: route.path,
        method: route.method,
        isActive: true,
      },
      { upsert: true, new: true },
    );
  }
};
