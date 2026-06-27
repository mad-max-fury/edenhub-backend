import {
  ConversationModel,
  ConversationStatus,
  MessageSender,
} from "../models/conversation.model";
import { IPaginationQuery } from "../utils/pagination.utils";

export const createConversation = async (
  customerId: string,
  subject: string,
  body: string,
) => {
  const conversation = await ConversationModel.create({
    customer: customerId,
    subject,
    messages: [
      {
        sender: MessageSender.Customer,
        senderId: customerId,
        body,
        read: false,
      },
    ],
    lastMessageAt: new Date(),
    lastMessagePreview: body.slice(0, 100),
  });
  return conversation;
};

export const findOrCreateForCustomer = async (customerId: string) => {
  let conversation = await ConversationModel.findOne({ customer: customerId })
    .populate("customer", "firstName lastName email")
    .lean();
  if (!conversation) {
    const created = await ConversationModel.create({
      customer: customerId,
      subject: "Support",
      messages: [],
      lastMessageAt: new Date(),
      lastMessagePreview: "",
    });
    conversation = await ConversationModel.findById(created._id)
      .populate("customer", "firstName lastName email")
      .lean();
  }
  return conversation;
};

export const getCustomerConversations = async (
  customerId: string,
  query: IPaginationQuery,
) => {
  const filter = { customer: customerId };
  const totalCount = await ConversationModel.countDocuments(filter);
  const conversations = await ConversationModel.find(filter)
    .sort({ lastMessageAt: -1 })
    .skip((query.pageNumber - 1) * query.pageSize)
    .limit(query.pageSize)
    .populate("customer", "firstName lastName email")
    .lean();
  return { conversations, totalCount };
};

export const getAllConversations = async (query: IPaginationQuery & { status?: string }) => {
  const filter: Record<string, unknown> = {};
  if (query.status && query.status !== "all") filter.status = query.status;
  const totalCount = await ConversationModel.countDocuments(filter);
  const conversations = await ConversationModel.find(filter)
    .sort({ lastMessageAt: -1 })
    .skip((query.pageNumber - 1) * query.pageSize)
    .limit(query.pageSize)
    .populate("customer", "firstName lastName email")
    .lean();
  return { conversations, totalCount };
};

export const getConversationById = async (id: string) => {
  return ConversationModel.findById(id)
    .populate("customer", "firstName lastName email")
    .populate("messages.senderId", "firstName lastName")
    .lean();
};

export const addMessage = async (
  conversationId: string,
  sender: MessageSender,
  senderId: string,
  body: string,
  attachments: { url: string; type: string; name?: string }[] = [],
) => {
  const msg = { sender, senderId, body, read: false, createdAt: new Date(), attachments };
  const conversation = await ConversationModel.findByIdAndUpdate(
    conversationId,
    {
      $push: { messages: msg },
      $set: {
        lastMessageAt: new Date(),
        lastMessagePreview: body ? body.slice(0, 100) : (attachments.length ? `📎 ${attachments.length} attachment(s)` : ""),
      },
    },
    { new: true },
  )
    .populate("customer", "firstName lastName email")
    .lean();
  return conversation;
};

export const markMessagesRead = async (
  conversationId: string,
  readerRole: MessageSender,
) => {
  const opposite =
    readerRole === MessageSender.Customer
      ? MessageSender.Admin
      : MessageSender.Customer;
  await ConversationModel.updateOne(
    { _id: conversationId },
    { $set: { "messages.$[m].read": true } },
    { arrayFilters: [{ "m.sender": opposite, "m.read": false }] },
  );
};

export const closeConversation = async (id: string) => {
  return ConversationModel.findByIdAndUpdate(
    id,
    { status: ConversationStatus.Closed },
    { new: true },
  ).lean();
};

export const reopenConversation = async (id: string) => {
  return ConversationModel.findByIdAndUpdate(
    id,
    { status: ConversationStatus.Open },
    { new: true },
  ).lean();
};

export const getUnreadCountForCustomer = async (customerId: string) => {
  const result = await ConversationModel.aggregate([
    { $match: { customer: customerId } },
    { $unwind: "$messages" },
    {
      $match: {
        "messages.sender": MessageSender.Admin,
        "messages.read": false,
      },
    },
    { $count: "count" },
  ]);
  return result[0]?.count ?? 0;
};

export const getUnreadCountForAdmin = async () => {
  const result = await ConversationModel.aggregate([
    { $unwind: "$messages" },
    {
      $match: {
        "messages.sender": MessageSender.Customer,
        "messages.read": false,
      },
    },
    { $count: "count" },
  ]);
  return result[0]?.count ?? 0;
};
