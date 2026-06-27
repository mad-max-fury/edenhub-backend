import { Request, Response } from "express";
import catchAsync from "../utils/error.utils";
import * as questionService from "../services/question.service";
import { getPaginationMetadata } from "../utils/pagination.utils";
import { findOneUser } from "../services/user.service";

export const getProductQuestionsHandler = catchAsync(async (req: Request, res: Response) => {
  const query = { pageNumber: parseInt(req.query.pageNumber as string) || 1, pageSize: parseInt(req.query.pageSize as string) || 20 };
  const { questions, totalCount } = await questionService.getProductQuestions(req.params.productId, query);
  const metadata = getPaginationMetadata(totalCount, query.pageNumber, query.pageSize);
  res.json({ status: "success", data: { data: questions, metadata } });
});

export const createQuestionHandler = catchAsync(async (req: Request, res: Response) => {
  const q = await questionService.createQuestion(req.user!.id, req.body.productId, req.body.question);
  res.status(201).json({ status: "success", data: q });
});

export const answerQuestionHandler = catchAsync(async (req: Request, res: Response) => {
  const user = await findOneUser({ _id: req.user!.id });
  const isAdmin = !!user?.staffId;
  const q = await questionService.addAnswer(req.params.id, req.user!.id, req.body.body, isAdmin);
  res.json({ status: "success", data: q });
});

export const voteQuestionHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await questionService.toggleVote(req.params.id, req.user!.id);
  res.json({ status: "success", data: result });
});
