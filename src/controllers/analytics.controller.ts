import { Request, Response } from "express";
import catchAsync from "../utils/error.utils";
import * as analyticsService from "../services/analytics.service";
import * as orderService from "../services/order.service";

const getRange = (req: Request): analyticsService.Range =>
  (req.query.range as analyticsService.Range) || "30d";

export const getSummaryHandler = catchAsync(
  async (req: Request, res: Response) => {
    const data = await analyticsService.getSummary(getRange(req));
    res.status(200).json({ status: "success", data });
  },
);

export const getSalesTimeseriesHandler = catchAsync(
  async (req: Request, res: Response) => {
    const data = await analyticsService.getSalesTimeseries(getRange(req));
    res.status(200).json({ status: "success", data });
  },
);

export const getTopProductsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 5;
    const data = await analyticsService.getTopProducts(getRange(req), limit);
    res.status(200).json({ status: "success", data });
  },
);

export const getSalesByCategoryHandler = catchAsync(
  async (req: Request, res: Response) => {
    const data = await analyticsService.getSalesByCategory(getRange(req));
    res.status(200).json({ status: "success", data });
  },
);

export const getRecentOrdersHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { orders } = await orderService.getAllOrders({
      pageNumber: 1,
      pageSize: parseInt(req.query.limit as string) || 8,
    });
    res.status(200).json({ status: "success", data: orders });
  },
);

export const getProductAnalyticsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const data = await analyticsService.getProductAnalytics(
      req.params.id,
      getRange(req),
    );
    res.status(200).json({ status: "success", data });
  },
);
