import { Request, Response } from "express";
import catchAsync from "../utils/error.utils";
import * as cartService from "../services/cart.service";

export const getCartHandler = catchAsync(
  async (req: Request, res: Response) => {
    const cart = await cartService.getCart(req.user!.id);
    res.status(200).json({ status: "success", data: cart });
  },
);

export const addCartItemHandler = catchAsync(
  async (req: Request, res: Response) => {
    const cart = await cartService.addItem(req.user!.id, req.body);
    res.status(200).json({
      status: "success",
      message: "Added to cart",
      data: cart,
    });
  },
);

export const updateCartItemHandler = catchAsync(
  async (req: Request, res: Response) => {
    const cart = await cartService.updateItem(
      req.user!.id,
      req.params.itemId,
      req.body.quantity,
    );
    res.status(200).json({ status: "success", data: cart });
  },
);

export const removeCartItemHandler = catchAsync(
  async (req: Request, res: Response) => {
    const cart = await cartService.removeItem(req.user!.id, req.params.itemId);
    res.status(200).json({ status: "success", data: cart });
  },
);

export const clearCartHandler = catchAsync(
  async (req: Request, res: Response) => {
    const cart = await cartService.clearCart(req.user!.id);
    res.status(200).json({ status: "success", data: cart });
  },
);
