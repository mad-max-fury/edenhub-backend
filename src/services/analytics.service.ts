import { Types } from "mongoose";
import OrderModel from "../models/order.model";
import ProductModel from "../models/product.model";
import UserModel from "../models/user.model";
import { findRoleByName } from "./role.service";

// ─── Range helpers ───────────────────────────────────────────────────────────

export type Range = "7d" | "30d" | "90d" | "12m" | "all";

const rangeStart = (range: Range): Date => {
  const now = new Date();
  const d = new Date(now);
  switch (range) {
    case "7d":
      d.setDate(now.getDate() - 7);
      break;
    case "90d":
      d.setDate(now.getDate() - 90);
      break;
    case "12m":
      d.setMonth(now.getMonth() - 12);
      break;
    case "all":
      return new Date(0);
    case "30d":
    default:
      d.setDate(now.getDate() - 30);
  }
  return d;
};

// Previous comparable window (for deltas).
const prevWindow = (range: Range): { start: Date; end: Date } => {
  const start = rangeStart(range);
  const end = start;
  const span = Date.now() - start.getTime();
  return { start: new Date(start.getTime() - span), end };
};

const pctDelta = (current: number, previous: number) =>
  previous === 0
    ? current > 0
      ? 100
      : 0
    : Math.round(((current - previous) / previous) * 1000) / 10;

const PAID = { paymentStatus: "paid" };

// ─── Summary ─────────────────────────────────────────────────────────────────

export const getSummary = async (range: Range) => {
  const start = rangeStart(range);
  const prev = prevWindow(range);

  const revenueIn = async (from: Date, to?: Date) => {
    const match: any = { ...PAID, createdAt: { $gte: from } };
    if (to) match.createdAt.$lt = to;
    const [agg] = await OrderModel.aggregate([
      { $match: match },
      { $group: { _id: null, revenue: { $sum: "$grandTotal" }, orders: { $sum: 1 } } },
    ]);
    return { revenue: agg?.revenue ?? 0, orders: agg?.orders ?? 0 };
  };

  const customerRole = await findRoleByName("customer");
  const customerFilter = customerRole?._id ? { role: customerRole._id } : {};

  const [cur, pre, totalCustomers, newCustomers, prevNewCustomers, totalProducts] =
    await Promise.all([
      revenueIn(start),
      revenueIn(prev.start, prev.end),
      UserModel.countDocuments(customerFilter),
      UserModel.countDocuments({ ...customerFilter, createdAt: { $gte: start } }),
      UserModel.countDocuments({
        ...customerFilter,
        createdAt: { $gte: prev.start, $lt: prev.end },
      }),
      ProductModel.countDocuments({ status: "active" }),
    ]);

  return {
    revenue: cur.revenue,
    revenueDelta: pctDelta(cur.revenue, pre.revenue),
    orders: cur.orders,
    ordersDelta: pctDelta(cur.orders, pre.orders),
    avgOrderValue: cur.orders ? Math.round(cur.revenue / cur.orders) : 0,
    newCustomers,
    customersDelta: pctDelta(newCustomers, prevNewCustomers),
    totalCustomers,
    totalProducts,
  };
};

// ─── Sales timeseries ────────────────────────────────────────────────────────

export const getSalesTimeseries = async (range: Range) => {
  const start = rangeStart(range);
  const byMonth = range === "12m" || range === "all";
  const format = byMonth ? "%Y-%m" : "%Y-%m-%d";

  const rows = await OrderModel.aggregate([
    { $match: { ...PAID, createdAt: { $gte: start } } },
    {
      $group: {
        _id: { $dateToString: { format, date: "$createdAt" } },
        revenue: { $sum: "$grandTotal" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return rows.map((r) => ({ period: r._id, revenue: r.revenue, orders: r.orders }));
};

// ─── Top products ────────────────────────────────────────────────────────────

export const getTopProducts = async (range: Range, limit = 5) => {
  const start = rangeStart(range);

  const rows = await OrderModel.aggregate([
    { $match: { ...PAID, createdAt: { $gte: start } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        name: { $first: "$items.name" },
        image: { $first: "$items.image" },
        unitsSold: { $sum: "$items.quantity" },
        revenue: { $sum: "$items.lineTotal" },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: limit },
  ]);

  return rows.map((r) => ({
    product: r._id,
    name: r.name,
    image: r.image,
    unitsSold: r.unitsSold,
    revenue: r.revenue,
  }));
};

// ─── Sales by category ───────────────────────────────────────────────────────

export const getSalesByCategory = async (range: Range) => {
  const start = rangeStart(range);

  const rows = await OrderModel.aggregate([
    { $match: { ...PAID, createdAt: { $gte: start } } },
    { $unwind: "$items" },
    {
      $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "categories",
        localField: "product.category",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: "$category._id",
        name: { $first: "$category.name" },
        revenue: { $sum: "$items.lineTotal" },
        units: { $sum: "$items.quantity" },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  return rows.map((r) => ({
    category: r._id,
    name: r.name || "Uncategorised",
    revenue: r.revenue,
    units: r.units,
  }));
};

// ─── Per-product analytics ───────────────────────────────────────────────────

export const getProductAnalytics = async (productId: string, range: Range) => {
  const start = rangeStart(range);
  const pid = new Types.ObjectId(productId);

  const product = await ProductModel.findById(productId);

  const [totals] = await OrderModel.aggregate([
    { $match: { ...PAID, createdAt: { $gte: start } } },
    { $unwind: "$items" },
    { $match: { "items.product": pid } },
    {
      $group: {
        _id: null,
        unitsSold: { $sum: "$items.quantity" },
        revenue: { $sum: "$items.lineTotal" },
        orderCount: { $sum: 1 },
      },
    },
  ]);

  const timeseries = await OrderModel.aggregate([
    { $match: { ...PAID, createdAt: { $gte: start } } },
    { $unwind: "$items" },
    { $match: { "items.product": pid } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        revenue: { $sum: "$items.lineTotal" },
        units: { $sum: "$items.quantity" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const totalStock =
    (product?.quantity ?? 0) +
    (product?.variants ?? []).reduce((s, v) => s + (v.quantity ?? 0), 0);

  return {
    unitsSold: totals?.unitsSold ?? 0,
    revenue: totals?.revenue ?? 0,
    orderCount: totals?.orderCount ?? 0,
    averageRating: product?.averageRating ?? 0,
    totalReviews: product?.totalReviews ?? 0,
    totalSales: product?.totalSales ?? 0,
    stock: totalStock,
    timeseries: timeseries.map((t) => ({
      period: t._id,
      revenue: t.revenue,
      units: t.units,
    })),
  };
};
