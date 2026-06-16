import { Request, Response } from "express";
import catchAsync from "../utils/error.utils";
import * as categoryService from "../services/category.service";
import {
  getPaginationMetadata,
  IPaginationQuery,
} from "../utils/pagination.utils";

export const createCategoryHandler = catchAsync(
  async (req: Request, res: Response) => {
    const category = await categoryService.createCategory(req.body);
    res.status(201).json({
      status: "success",
      message: "Category created successfully",
      data: category,
    });
  },
);

export const getCategoriesHandler = catchAsync(
  async (req: Request, res: Response) => {
    const query: IPaginationQuery = {
      pageNumber: parseInt(req.query.pageNumber as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 10,
      searchTerm: req.query.searchTerm as string,
      orderBy: req.query.orderBy as string,
    };

    const customFilter =
      req.query.parent !== undefined
        ? { parent: req.query.parent === "null" ? null : req.query.parent }
        : {};

    const { categories, totalCount } = await categoryService.getAllCategories(
      query,
      customFilter,
    );

    const metadata = getPaginationMetadata(
      totalCount,
      query.pageNumber,
      query.pageSize,
    );

    res.status(200).json({
      status: "success",
      message: "Categories retrieved successfully",
      data: { data: categories, metadata },
    });
  },
);

export const bulkCreateCategoriesHandler = catchAsync(
  async (req: Request, res: Response) => {
    const result = await categoryService.bulkCreateCategories(
      req.body.categories,
    );

    res.status(201).json({
      status: "success",
      message: `Imported ${result.createdCount} categor${
        result.createdCount === 1 ? "y" : "ies"
      }${result.failed.length ? `, ${result.failed.length} skipped` : ""}`,
      data: result,
    });
  },
);

export const getCategoriesUnpaginatedHandler = catchAsync(
  async (_req: Request, res: Response) => {
    const categories = await categoryService.getAllCategoriesUnpaginated();
    res.status(200).json({
      status: "success",
      message: "Categories retrieved successfully",
      data: categories,
    });
  },
);

export const getCategoryTreeHandler = catchAsync(
  async (_req: Request, res: Response) => {
    const tree = await categoryService.getCategoryTree();
    res.status(200).json({
      status: "success",
      message: "Category tree retrieved successfully",
      data: tree,
    });
  },
);

export const getCategoryByIdHandler = catchAsync(
  async (req: Request, res: Response) => {
    const category = await categoryService.getCategoryById(req.params.id);
    res.status(200).json({
      status: "success",
      message: "Category retrieved successfully",
      data: category,
    });
  },
);

export const updateCategoryHandler = catchAsync(
  async (req: Request, res: Response) => {
    const category = await categoryService.updateCategory(
      req.params.id,
      req.body,
    );
    res.status(200).json({
      status: "success",
      message: "Category updated successfully",
      data: category,
    });
  },
);

export const deleteCategoryHandler = catchAsync(
  async (req: Request, res: Response) => {
    await categoryService.deleteCategory(req.params.id);
    res.status(204).json({ status: "success", data: null });
  },
);

export const addAttributeHandler = catchAsync(
  async (req: Request, res: Response) => {
    const category = await categoryService.addAttribute(
      req.params.id,
      req.body,
    );
    res.status(201).json({
      status: "success",
      message: "Attribute added successfully",
      data: category,
    });
  },
);

export const updateAttributeHandler = catchAsync(
  async (req: Request, res: Response) => {
    const category = await categoryService.updateAttribute(
      req.params.id,
      req.params.attributeId,
      req.body,
    );
    res.status(200).json({
      status: "success",
      message: "Attribute updated successfully",
      data: category,
    });
  },
);

export const removeAttributeHandler = catchAsync(
  async (req: Request, res: Response) => {
    const category = await categoryService.removeAttribute(
      req.params.id,
      req.params.attributeId,
    );
    res.status(200).json({
      status: "success",
      message: "Attribute removed successfully",
      data: category,
    });
  },
);
