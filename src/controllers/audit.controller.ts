import { Request, Response } from "express";
import catchAsync from "../utils/error.utils";
import * as auditService from "../services/audit.service";
import { getPaginationMetadata } from "../utils/pagination.utils";

export const getAuditsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const query: auditService.AuditListQuery = {
      pageNumber: parseInt(req.query.pageNumber as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 10,
      searchTerm: req.query.searchTerm as string,
      orderBy: req.query.orderBy as string,
      category: req.query.category as string,
      severity: req.query.severity as string,
    };

    const { logs, totalCount } = await auditService.getAuditLogs(query);

    const metadata = getPaginationMetadata(
      totalCount,
      query.pageNumber,
      query.pageSize,
    );

    res.status(200).json({
      status: "success",
      message: "Audit logs retrieved successfully",
      data: { data: logs, metadata },
    });
  },
);
