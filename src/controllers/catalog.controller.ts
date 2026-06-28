import { Request, Response } from "express";
import catchAsync from "../utils/error.utils";
import * as productService from "../services/product.service";
import * as categoryService from "../services/category.service";
import {
  getPaginationMetadata,
  IPaginationQuery,
} from "../utils/pagination.utils";

export const getCatalogProductsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const base: IPaginationQuery = {
      pageNumber: parseInt(req.query.pageNumber as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 12,
      searchTerm: req.query.searchTerm as string,
    };

    const toNum = (v: unknown) =>
      v !== undefined && v !== "" ? Number(v) : undefined;

    const { products, totalCount } = await productService.getCatalogProducts({
      ...base,
      category: req.query.category as string,
      brand: req.query.brand as string,
      minPrice: toNum(req.query.minPrice),
      maxPrice: toNum(req.query.maxPrice),
      sort: req.query.sort as string,
      audience: req.query.audience as string,
      tag: req.query.tag as string,
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

export const getCatalogProductByIdHandler = catchAsync(
  async (req: Request, res: Response) => {
    const product = await productService.getCatalogProductById(req.params.id);
    res.status(200).json({
      status: "success",
      message: "Product retrieved successfully",
      data: product,
    });
  },
);

export const getCatalogCategoriesHandler = catchAsync(
  async (_req: Request, res: Response) => {
    const tree = await categoryService.getCategoryTree({ isActive: true });
    res.status(200).json({
      status: "success",
      message: "Categories retrieved successfully",
      data: tree,
    });
  },
);

export const getCatalogBrandsHandler = catchAsync(
  async (_req: Request, res: Response) => {
    const brands = await productService.getCatalogBrands();
    res.status(200).json({
      status: "success",
      message: "Brands retrieved successfully",
      data: brands,
    });
  },
);

export const getBestSellersHandler = catchAsync(
  async (req: Request, res: Response) => {
    const products = await productService.getBestSellers({
      limit: parseInt(req.query.limit as string) || 8,
      audience: req.query.audience as string,
      category: req.query.category as string,
    });
    res.status(200).json({
      status: "success",
      message: "Best sellers retrieved successfully",
      data: products,
    });
  },
);
