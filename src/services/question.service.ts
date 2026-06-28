import { QuestionModel } from "../models/question.model";
import AppError from "../errors/appError";
import { IPaginationQuery } from "../utils/pagination.utils";

const POPULATE = [
  { path: "user", select: "firstName lastName" },
  { path: "answers.user", select: "firstName lastName" },
];

export const createQuestion = async (userId: string, productId: string, question: string) => {
  const q = await QuestionModel.create({ user: userId, product: productId, question });
  return q.populate(POPULATE);
};

export const getProductQuestions = async (productId: string, query: IPaginationQuery) => {
  const filter = { product: productId };
  const totalCount = await QuestionModel.countDocuments(filter);
  const questions = await QuestionModel.find(filter)
    .populate(POPULATE)
    .sort("-createdAt")
    .skip((query.pageNumber - 1) * query.pageSize)
    .limit(query.pageSize)
    .lean();
  return { questions, totalCount };
};

export const addAnswer = async (questionId: string, userId: string, body: string, isAdmin: boolean) => {
  const q = await QuestionModel.findById(questionId);
  if (!q) throw new AppError("Question not found", 404);
  q.answers.push({ user: userId as any, body, isAdmin, createdAt: new Date() });
  await q.save();
  return q.populate(POPULATE);
};

export const toggleVote = async (questionId: string, userId: string) => {
  const q = await QuestionModel.findById(questionId);
  if (!q) throw new AppError("Question not found", 404);
  const idx = q.votedBy.indexOf(userId);
  if (idx >= 0) { q.votedBy.splice(idx, 1); q.votes = Math.max(0, q.votes - 1); }
  else { q.votedBy.push(userId); q.votes += 1; }
  await q.save();
  return { votes: q.votes, voted: idx < 0 };
};
