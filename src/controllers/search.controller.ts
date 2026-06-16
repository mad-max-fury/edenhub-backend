import { Request, Response } from "express";
import catchAsync from "../utils/error.utils";
import { globalSearch } from "../services/search.service";

export const globalSearchHandler = catchAsync(
  async (req: Request, res: Response) => {
    const q = String(req.query.q || "");
    const result = await globalSearch(q);

    return res.status(200).json({
      status: "success",
      message: "Search results retrieved",
      data: result,
    });
  },
);
