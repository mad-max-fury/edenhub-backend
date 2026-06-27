import { Request, Response } from "express";
import catchAsync from "../utils/error.utils";
import * as disputeService from "../services/dispute.service";
import { getPaginationMetadata, IPaginationQuery } from "../utils/pagination.utils";

// ── Customer endpoints ──

export const customerCreateHandler = catchAsync(async (req: Request, res: Response) => {
  const dispute = await disputeService.createDispute(req.user!.id, req.body.orderId, req.body);
  res.status(201).json({ status: "success", data: dispute });
});

export const customerListHandler = catchAsync(async (req: Request, res: Response) => {
  const query: IPaginationQuery = {
    pageNumber: parseInt(req.query.pageNumber as string) || 1,
    pageSize: parseInt(req.query.pageSize as string) || 20,
  };
  const { disputes, totalCount } = await disputeService.getCustomerDisputes(req.user!.id, query);
  const metadata = getPaginationMetadata(totalCount, query.pageNumber, query.pageSize);
  res.json({ status: "success", data: { data: disputes, metadata } });
});

export const customerGetHandler = catchAsync(async (req: Request, res: Response) => {
  const dispute = await disputeService.getDisputeById(req.params.id);
  if (!dispute) return res.status(404).json({ status: "error", message: "Dispute not found" });
  if (String(dispute.customer._id ?? dispute.customer) !== req.user!.id)
    return res.status(403).json({ status: "error", message: "Forbidden" });
  res.json({ status: "success", data: dispute });
});

export const customerMessageHandler = catchAsync(async (req: Request, res: Response) => {
  const dispute = await disputeService.getDisputeById(req.params.id);
  if (!dispute) return res.status(404).json({ status: "error", message: "Dispute not found" });
  if (String(dispute.customer._id ?? dispute.customer) !== req.user!.id)
    return res.status(403).json({ status: "error", message: "Forbidden" });

  const updated = await disputeService.addDisputeMessage(
    req.params.id, "customer", req.user!.id, req.body.body, req.body.images,
  );
  res.json({ status: "success", data: updated });
});

export const customerCloseHandler = catchAsync(async (req: Request, res: Response) => {
  const dispute = await disputeService.getDisputeById(req.params.id);
  if (!dispute) return res.status(404).json({ status: "error", message: "Dispute not found" });
  if (String(dispute.customer._id ?? dispute.customer) !== req.user!.id)
    return res.status(403).json({ status: "error", message: "Forbidden" });

  const updated = await disputeService.updateDisputeStatus(
    req.params.id, req.user!.id, "resolved" as any, req.body.resolution || "Closed by customer",
  );
  res.json({ status: "success", data: updated });
});

// ── Admin endpoints ──

export const adminListHandler = catchAsync(async (req: Request, res: Response) => {
  const query = {
    pageNumber: parseInt(req.query.pageNumber as string) || 1,
    pageSize: parseInt(req.query.pageSize as string) || 20,
    status: (req.query.status as string) || "all",
  };
  const { disputes, totalCount } = await disputeService.getAllDisputes(query);
  const metadata = getPaginationMetadata(totalCount, query.pageNumber, query.pageSize);
  res.json({ status: "success", data: { data: disputes, metadata } });
});

export const adminGetHandler = catchAsync(async (req: Request, res: Response) => {
  const dispute = await disputeService.getDisputeById(req.params.id);
  if (!dispute) return res.status(404).json({ status: "error", message: "Dispute not found" });
  res.json({ status: "success", data: dispute });
});

export const adminMessageHandler = catchAsync(async (req: Request, res: Response) => {
  const updated = await disputeService.addDisputeMessage(
    req.params.id, "admin", req.user!.id, req.body.body, req.body.images,
  );
  res.json({ status: "success", data: updated });
});

export const adminUpdateStatusHandler = catchAsync(async (req: Request, res: Response) => {
  const updated = await disputeService.updateDisputeStatus(
    req.params.id, req.user!.id, req.body.status, req.body.resolution,
  );
  res.json({ status: "success", data: updated });
});

export const adminRefundHandler = catchAsync(async (req: Request, res: Response) => {
  const updated = await disputeService.processRefund(
    req.params.id, req.user!.id, req.body.amount,
  );
  res.json({ status: "success", data: updated });
});
