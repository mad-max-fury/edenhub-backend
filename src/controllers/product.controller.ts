import { Request, Response } from "express";
import catchAsync from "../utils/error.utils";
import * as productService from "../services/product.service";
import {
  getPaginationMetadata,
  IPaginationQuery,
} from "../utils/pagination.utils";

export const createProductHandler = catchAsync(
  async (req: Request, res: Response) => {
    const product = await productService.createProduct(req.body);
    res.status(201).json({
      status: "success",
      message: "Product created successfully",
      data: product,
    });
  },
);

export const bulkCreateProductsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const result = await productService.bulkCreateProducts(req.body.products);
    res.status(201).json({
      status: "success",
      message: `Imported ${result.createdCount} product${
        result.createdCount === 1 ? "" : "s"
      }${result.failed.length ? `, ${result.failed.length} skipped` : ""}`,
      data: result,
    });
  },
);

export const getProductsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const base: IPaginationQuery = {
      pageNumber: parseInt(req.query.pageNumber as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 10,
      searchTerm: req.query.searchTerm as string,
      orderBy: req.query.orderBy as string,
    };

    const { products, totalCount } = await productService.getAllProducts({
      ...base,
      status: req.query.status as string,
      category: req.query.category as string,
    });

    const metadata = getPaginationMetadata(
      totalCount,
      base.pageNumber,
      base.pageSize,
    );

    res.status(200).json({
      status: "success",
      message: "Products retrieved successfully",
      data: { data: products, metadata },
    });
  },
);

export const getProductStatsHandler = catchAsync(
  async (_req: Request, res: Response) => {
    const stats = await productService.getProductStats();
    res.status(200).json({
      status: "success",
      message: "Product stats retrieved successfully",
      data: stats,
    });
  },
);

export const getProductByIdHandler = catchAsync(
  async (req: Request, res: Response) => {
    const product = await productService.getProductById(req.params.id);
    res.status(200).json({
      status: "success",
      message: "Product retrieved successfully",
      data: product,
    });
  },
);

export const updateProductHandler = catchAsync(
  async (req: Request, res: Response) => {
    const product = await productService.updateProduct(req.params.id, req.body);
    res.status(200).json({
      status: "success",
      message: "Product updated successfully",
      data: product,
    });
  },
);

export const updateProductStatusHandler = catchAsync(
  async (req: Request, res: Response) => {
    const product = await productService.updateProductStatus(
      req.params.id,
      req.body.status,
    );
    res.status(200).json({
      status: "success",
      message: "Product status updated successfully",
      data: product,
    });
  },
);

export const deleteProductHandler = catchAsync(
  async (req: Request, res: Response) => {
    await productService.deleteProduct(req.params.id);
    res.status(204).json({ status: "success", data: null });
  },
);

export const addVariantHandler = catchAsync(
  async (req: Request, res: Response) => {
    const product = await productService.addVariant(req.params.id, req.body);
    res.status(201).json({
      status: "success",
      message: "Variant added successfully",
      data: product,
    });
  },
);

export const updateVariantHandler = catchAsync(
  async (req: Request, res: Response) => {
    const product = await productService.updateVariant(
      req.params.id,
      req.params.variantId,
      req.body,
    );
    res.status(200).json({
      status: "success",
      message: "Variant updated successfully",
      data: product,
    });
  },
);

export const removeVariantHandler = catchAsync(
  async (req: Request, res: Response) => {
    const product = await productService.removeVariant(
      req.params.id,
      req.params.variantId,
    );
    res.status(200).json({
      status: "success",
      message: "Variant removed successfully",
      data: product,
    });
  },
);

export const bulkUpdateStatusHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { ids, status } = req.body;
    const result = await productService.bulkUpdateStatus(ids, status);
    res.json({ status: "success", data: result });
  },
);

export const bulkUpdateDiscountHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { ids, percentage } = req.body;
    const result = await productService.bulkUpdateDiscount(ids, percentage);
    res.json({ status: "success", data: result });
  },
);

export const getLowStockHandler = catchAsync(
  async (_req: Request, res: Response) => {
    const products = await productService.getLowStockProducts();
    res.json({ status: "success", data: products });
  },
);
