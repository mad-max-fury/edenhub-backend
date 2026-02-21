import { Router, RequestHandler } from "express";

interface RouteMetadata {
  name: string;
  resource: string;
  action: "Read" | "Write" | "Delete" | "Update";
  group: string;
}

export const createAttributeRouter = () => {
  const router = Router() as any;

  const register =
    (method: string) =>
    (path: string, meta: RouteMetadata, ...handlers: RequestHandler[]) => {
      router[method](path, ...handlers);
      const layer = router.stack[router.stack.length - 1];
      layer.route.stack[layer.route.stack.length - 1].handle.metadata = meta;
    };

  return {
    router,
    get: register("get"),
    post: register("post"),
    patch: register("patch"),
    delete: register("delete"),
  };
};
