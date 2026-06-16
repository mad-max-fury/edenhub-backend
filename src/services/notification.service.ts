import { FilterQuery, Types } from "mongoose";
import NotificationModel, {
  Notification,
  NotificationType,
} from "../models/notification.model";
import { IPaginationQuery } from "../utils/pagination.utils";
import log from "../utils/logger";

// Fire-and-forget admin notification creation (never blocks the caller).
export const createAdminNotification = (data: {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  meta?: Record<string, unknown>;
}) => {
  NotificationModel.create({ ...data, audience: "admin" }).catch((err) =>
    log.error(err, "Failed to create notification"),
  );
};

// Notifications visible to the current user: the shared admin feed + any
// addressed directly to them.
const audienceFilter = (userId: string): FilterQuery<Notification> => ({
  $or: [{ audience: "admin" }, { recipient: userId }],
});

const withReadFlag = (docs: any[], userId: string) =>
  docs.map((n) => ({
    ...n,
    read: (n.readBy || []).some((id: any) => String(id) === userId),
  }));

export const getNotifications = async (
  userId: string,
  query: IPaginationQuery,
) => {
  const { pageNumber, pageSize } = query;
  const filter = audienceFilter(userId);
  const skip = (pageNumber - 1) * pageSize;

  const [docs, totalCount] = await Promise.all([
    NotificationModel.find(filter).sort("-createdAt").skip(skip).limit(pageSize).lean(),
    NotificationModel.countDocuments(filter),
  ]);

  return { notifications: withReadFlag(docs, userId), totalCount };
};

export const getUnreadCount = async (userId: string) => {
  return NotificationModel.countDocuments({
    ...audienceFilter(userId),
    readBy: { $ne: new Types.ObjectId(userId) },
  });
};

export const markAsRead = async (userId: string, id: string) => {
  await NotificationModel.findByIdAndUpdate(id, {
    $addToSet: { readBy: userId },
  });
  return getUnreadCount(userId);
};

export const markAllRead = async (userId: string) => {
  await NotificationModel.updateMany(audienceFilter(userId), {
    $addToSet: { readBy: userId },
  });
  return 0;
};
