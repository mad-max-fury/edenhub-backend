import { globalSearchHandler } from "../controllers/search.controller";
import auth from "../middlewares/auth";
import { createAttributeRouter } from "../utils/routeBuilder.utils";

const { router, get } = createAttributeRouter();

router.use(auth);

get(
  "/",
  {
    resource: "Search",
    action: "Read",
    group: "Search",
    name: "get_global_search",
  },
  globalSearchHandler,
);

export default router;
