import { Request, Response } from "express";
import catchAsync from "../utils/error.utils";
import * as faqService from "../services/faq.service";

export const createFaqHandler = catchAsync(
  async (req: Request, res: Response) => {
    const faq = await faqService.createFaq(req.body);
    res.status(201).json({
      status: "success",
      message: "FAQ created successfully",
      data: faq,
    });
  },
);

export const getFaqsHandler = catchAsync(
  async (_req: Request, res: Response) => {
    const faqs = await faqService.getAllFaqs();
    res.status(200).json({
      status: "success",
      message: "FAQs retrieved successfully",
      data: faqs,
    });
  },
);

export const getPublicFaqsHandler = catchAsync(
  async (_req: Request, res: Response) => {
    const faqs = await faqService.getPublicFaqs();
    res.status(200).json({
      status: "success",
      message: "FAQs retrieved successfully",
      data: faqs,
    });
  },
);

export const updateFaqHandler = catchAsync(
  async (req: Request, res: Response) => {
    const faq = await faqService.updateFaq(req.params.id, req.body);
    res.status(200).json({
      status: "success",
      message: "FAQ updated successfully",
      data: faq,
    });
  },
);

export const deleteFaqHandler = catchAsync(
  async (req: Request, res: Response) => {
    await faqService.deleteFaq(req.params.id);
    res.status(204).json({ status: "success", data: null });
  },
);
