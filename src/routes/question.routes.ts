import * as ctrl from "../controllers/question.controller";
import auth from "../middlewares/auth";
import { createAttributeRouter } from "../utils/routeBuilder.utils";

const { router, get, post, patch } = createAttributeRouter();
const meta = (name: string, action: "Read" | "Write") => ({
  resource: "Question", action, group: "Products", name,
});

get("/product/:productId", meta("get_product_questions", "Read"), ctrl.getProductQuestionsHandler);
post("/", meta("create_question", "Write"), auth, ctrl.createQuestionHandler);
post("/:id/answer", meta("answer_question", "Write"), auth, ctrl.answerQuestionHandler);
patch("/:id/vote", meta("vote_question", "Write"), auth, ctrl.voteQuestionHandler);

export default router;
