import { Request, Response } from "express";
import catchAsync from "../utils/error.utils";
import * as conversationService from "../services/conversation.service";
import { MessageSender } from "../models/conversation.model";
import {
  getPaginationMetadata,
  IPaginationQuery,
} from "../utils/pagination.utils";

// ── Customer endpoints ──

export const customerCreateHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { subject, body } = req.body;
    const conversation = await conversationService.createConversation(
      req.user!.id,
      subject,
      body,
    );
    res.status(201).json({ status: "success", data: conversation });
  },
);

export const customerListHandler = catchAsync(
  async (req: Request, res: Response) => {
    const query: IPaginationQuery = {
      pageNumber: parseInt(req.query.pageNumber as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 20,
    };
    const { conversations, totalCount } =
      await conversationService.getCustomerConversations(req.user!.id, query);
    const metadata = getPaginationMetadata(
      totalCount,
      query.pageNumber,
      query.pageSize,
    );
    res.json({ status: "success", data: { data: conversations, metadata } });
  },
);

export const customerGetHandler = catchAsync(
  async (req: Request, res: Response) => {
    const conversation = await conversationService.getConversationById(
      req.params.id,
    );
    if (!conversation)
      return res
        .status(404)
        .json({ status: "error", message: "Conversation not found" });

    if (String(conversation.customer._id ?? conversation.customer) !== req.user!.id)
      return res.status(403).json({ status: "error", message: "Forbidden" });

    await conversationService.markMessagesRead(
      req.params.id,
      MessageSender.Customer,
    );
    res.json({ status: "success", data: conversation });
  },
);

export const customerReplyHandler = catchAsync(
  async (req: Request, res: Response) => {
    const conversation = await conversationService.getConversationById(
      req.params.id,
    );
    if (!conversation)
      return res
        .status(404)
        .json({ status: "error", message: "Conversation not found" });
    if (String(conversation.customer._id ?? conversation.customer) !== req.user!.id)
      return res.status(403).json({ status: "error", message: "Forbidden" });

    const updated = await conversationService.addMessage(
      req.params.id,
      MessageSender.Customer,
      req.user!.id,
      req.body.body,
    );
    res.json({ status: "success", data: updated });
  },
);

export const customerUnreadHandler = catchAsync(
  async (req: Request, res: Response) => {
    const count = await conversationService.getUnreadCountForCustomer(
      req.user!.id,
    );
    res.json({ status: "success", data: { count } });
  },
);

// ── Admin endpoints ──

export const adminFindOrCreateHandler = catchAsync(
  async (req: Request, res: Response) => {
    const conversation = await conversationService.findOrCreateForCustomer(
      req.params.customerId,
    );
    res.json({ status: "success", data: conversation });
  },
);


export const adminListHandler = catchAsync(
  async (req: Request, res: Response) => {
    const query = {
      pageNumber: parseInt(req.query.pageNumber as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 20,
      status: (req.query.status as string) || "all",
    };
    const { conversations, totalCount } =
      await conversationService.getAllConversations(query);
    const metadata = getPaginationMetadata(
      totalCount,
      query.pageNumber,
      query.pageSize,
    );
    res.json({ status: "success", data: { data: conversations, metadata } });
  },
);

export const adminGetHandler = catchAsync(
  async (req: Request, res: Response) => {
    const conversation = await conversationService.getConversationById(
      req.params.id,
    );
    if (!conversation)
      return res
        .status(404)
        .json({ status: "error", message: "Conversation not found" });

    await conversationService.markMessagesRead(
      req.params.id,
      MessageSender.Admin,
    );
    res.json({ status: "success", data: conversation });
  },
);

export const adminReplyHandler = catchAsync(
  async (req: Request, res: Response) => {
    const updated = await conversationService.addMessage(
      req.params.id,
      MessageSender.Admin,
      req.user!.id,
      req.body.body,
    );
    res.json({ status: "success", data: updated });
  },
);

export const adminCloseHandler = catchAsync(
  async (req: Request, res: Response) => {
    const conversation = await conversationService.closeConversation(
      req.params.id,
    );
    res.json({ status: "success", data: conversation });
  },
);

export const adminReopenHandler = catchAsync(
  async (req: Request, res: Response) => {
    const conversation = await conversationService.reopenConversation(
      req.params.id,
    );
    res.json({ status: "success", data: conversation });
  },
);

export const adminUnreadHandler = catchAsync(
  async (_req: Request, res: Response) => {
    const count = await conversationService.getUnreadCountForAdmin();
    res.json({ status: "success", data: { count } });
  },
);
