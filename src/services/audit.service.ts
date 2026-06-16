import { FilterQuery } from "mongoose";
import AuditLogModel, { AuditLog } from "../models/audit.model";
import { IPaginationQuery } from "../utils/pagination.utils";

export const createAuditLog = async (data: Partial<AuditLog>) => {
  return AuditLogModel.create(data);
};

export interface AuditListQuery extends IPaginationQuery {
  category?: string;
  severity?: string;
}

export const getAuditLogs = async (query: AuditListQuery) => {
  const { pageNumber, pageSize, orderBy, searchTerm, category, severity } =
    query;

  const filter: FilterQuery<AuditLog> = {};

  if (category && category !== "all") filter.category = category;
  if (severity && severity !== "all") filter.severity = severity;

  if (searchTerm) {
    filter.$or = [
      { action: { $regex: searchTerm, $options: "i" } },
      { details: { $regex: searchTerm, $options: "i" } },
      { actorEmail: { $regex: searchTerm, $options: "i" } },
      { ipAddress: { $regex: searchTerm, $options: "i" } },
      { endpoint: { $regex: searchTerm, $options: "i" } },
    ];
  }

  const skip = (pageNumber - 1) * pageSize;
  const sort = orderBy || "-createdAt";

  const [logs, totalCount] = await Promise.all([
    AuditLogModel.find(filter)
      .populate({ path: "actor", select: "firstName lastName email role", populate: { path: "role", select: "name" } })
      .sort(sort)
      .skip(skip)
      .limit(pageSize),
    AuditLogModel.countDocuments(filter),
  ]);

  return { logs, totalCount };
};
