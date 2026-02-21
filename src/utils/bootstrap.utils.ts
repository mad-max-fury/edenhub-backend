import { Application } from "express";
import PermissionModel from "../models/permission.model";
import log from "./logger";

export const bootstrapPermissions = async (app: Application) => {
  const routes: any[] = [];

  const extractFromStack = (stack: any[], parentPath = "") => {
    for (let i = 0; i < stack.length; i++) {
      const layer = stack[i];
      if (layer.route) {
        const cleanPath = (parentPath + layer.route.path).replace(/\/+/g, "/");
        const method = Object.keys(layer.route.methods)[0].toUpperCase();

        const meta =
          layer.route.stack[layer.route.stack.length - 1].handle.metadata;

        if (meta) {
          routes.push({ endpoint: cleanPath, method, ...meta });
        }
      } else if (layer.name === "router" && layer.handle.stack) {
        const pathFragment = layer.regexp.source
          .replace("^\\", "")
          .replace("\\/?(?=\\/|$)", "")
          .replace(/\\\//g, "/")
          .replace(/\(\?:\(\?=\/\|\$\)\)/g, "");

        extractFromStack(layer.handle.stack, parentPath + pathFragment);
      }
    }
  };

  extractFromStack((app as any)._router.stack);

  if (routes.length === 0) return;

  try {
    const permissionOps = routes.map((route) => ({
      updateOne: {
        filter: { endpoint: route.endpoint, method: route.method },
        update: {
          $set: {
            name: route.name,
            resource: route.resource,
            action: route.action,
            group: route.group,
            isActive: true,
          },
        },
        upsert: true,
      },
    }));

    const result = await PermissionModel.bulkWrite(permissionOps, {
      ordered: false,
    });

    log.info(
      `🚀 Bootstrap Complete: ${result.upsertedCount} new, ${result.modifiedCount} updated.`,
    );
  } catch (err: any) {
    log.error(`Critical failure in bootstrap: ${err.message}`);
  }
};
