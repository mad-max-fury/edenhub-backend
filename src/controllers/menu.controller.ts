import { Request, Response } from "express";
import catchAsync from "../utils/error.utils";
import * as menuService from "../services/menu.service";

export const updateMenuHandler = catchAsync(
  async (req: Request, res: Response) => {
    const menu = await menuService.updateMenu(req.params.id, req.body);
    res.status(200).json({ status: "success", data: menu });
  },
);

export const deleteMenuHandler = catchAsync(
  async (req: Request, res: Response) => {
    await menuService.deleteMenu(req.params.id);
    res.status(204).json({ status: "success", data: null });
  },
);
