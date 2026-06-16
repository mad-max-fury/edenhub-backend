import { Request, Response } from "express";
import catchAsync from "../utils/error.utils";
import * as notificationService from "../services/notification.service";
import {
  getPaginationMetadata,
  IPaginationQuery,
} from "../utils/pagination.utils";

export const getNotificationsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const query: IPaginationQuery = {
      pageNumber: parseInt(req.query.pageNumber as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 15,
    };

    const { notifications, totalCount } =
      await notificationService.getNotifications(req.user!.id, query);

    const metadata = getPaginationMetadata(
      totalCount,
      query.pageNumber,
      query.pageSize,
    );

    res.status(200).json({
      status: "success",
      data: { data: notifications, metadata },
    });
  },
);

export const getUnreadCountHandler = catchAsync(
  async (req: Request, res: Response) => {
    const count = await notificationService.getUnreadCount(req.user!.id);
    res.status(200).json({ status: "success", data: { count } });
  },
);

export const markReadHandler = catchAsync(
  async (req: Request, res: Response) => {
    const count = await notificationService.markAsRead(
      req.user!.id,
      req.params.id,
    );
    res.status(200).json({ status: "success", data: { count } });
  },
);

export const markAllReadHandler = catchAsync(
  async (req: Request, res: Response) => {
    await notificationService.markAllRead(req.user!.id);
    res.status(200).json({ status: "success", data: { count: 0 } });
  },
);
