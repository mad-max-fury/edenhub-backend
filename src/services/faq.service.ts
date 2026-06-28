import FaqModel from "../models/faq.model";
import AppError from "../errors/appError";
import { CreateFaqInput, UpdateFaqInput } from "../schemas/faq.schema";

export const createFaq = (data: CreateFaqInput) => FaqModel.create(data);

// Admin: all FAQs, ordered.
export const getAllFaqs = () => FaqModel.find().sort("category order createdAt");

// Public: active FAQs, ordered.
export const getPublicFaqs = () =>
  FaqModel.find({ isActive: true }).sort("category order createdAt");

export const updateFaq = async (id: string, data: UpdateFaqInput) => {
  const faq = await FaqModel.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!faq) throw new AppError("FAQ not found", 404);
  return faq;
};

export const deleteFaq = async (id: string) => {
  const faq = await FaqModel.findByIdAndDelete(id);
  if (!faq) throw new AppError("FAQ not found", 404);
  return faq;
};
