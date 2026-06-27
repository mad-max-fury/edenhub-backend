import { FilterQuery, Types, isValidObjectId } from "mongoose";
import { nanoid } from "nanoid";
import ProductModel, { Product, Variant } from "../models/product.model";
import CategoryModel from "../models/category.model";
import { IPaginationQuery } from "../utils/pagination.utils";
import AppError from "../errors/appError";
import {
  BulkProductInput,
  CreateProductInput,
  UpdateProductInput,
  VariantInput,
} from "../schemas/product.schema";

const generateSku = () => `SKU-${nanoid(8).toUpperCase()}`;

const ensureCategoryExists = async (categoryId: string) => {
  const exists = await CategoryModel.exists({ _id: categoryId });
  if (!exists) {
    throw new AppError("Selected category does not exist", 404);
  }
};

// Give every variant a SKU up front so the create response carries them.
const withVariantSkus = (variants: VariantInput[] = []) =>
  variants.map((variant) => ({
    ...variant,
    sku: variant.sku || generateSku(),
  }));

export const createProduct = async (data: CreateProductInput) => {
  await ensureCategoryExists(data.category);

  const product = await ProductModel.create({
    ...data,
    variants: withVariantSkus(data.variants),
  });

  return product.populate("category", "name slug level");
};

export interface ProductListQuery extends IPaginationQuery {
  status?: string;
  category?: string;
}

export const getAllProducts = async (
  query: ProductListQuery,
  customFilter: FilterQuery<Product> = {},
) => {
  const { pageNumber, pageSize, orderBy, searchTerm, status, category } = query;

  const filter: FilterQuery<Product> = { ...customFilter };

  if (status && status !== "all") filter.status = status;
  if (category) filter.category = category;

  if (searchTerm) {
    filter.$or = [
      { name: { $regex: searchTerm, $options: "i" } },
      { brand: { $regex: searchTerm, $options: "i" } },
      { "variants.sku": { $regex: searchTerm, $options: "i" } },
    ];
  }

  const skip = (pageNumber - 1) * pageSize;
  const sort = orderBy || "-createdAt";

  const [products, totalCount] = await Promise.all([
    ProductModel.find(filter)
      .populate("category", "name slug level")
      .sort(sort)
      .skip(skip)
      .limit(pageSize),
    ProductModel.countDocuments(filter),
  ]);

  return { products, totalCount };
};

export const getProductById = async (id: string) => {
  const product = await ProductModel.findById(id).populate(
    "category",
    "name slug level attributes",
  );

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return product;
};

export const updateProduct = async (id: string, data: UpdateProductInput) => {
  if (data.category) {
    await ensureCategoryExists(data.category);
  }

  const update: any = { ...data };
  if (data.variants) {
    update.variants = withVariantSkus(data.variants as VariantInput[]);
  }

  const product = await ProductModel.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  }).populate("category", "name slug level");

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return product;
};

export const updateProductStatus = async (id: string, status: string) => {
  const product = await ProductModel.findByIdAndUpdate(
    id,
    { status },
    { new: true },
  );

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return product;
};

export const deleteProduct = async (id: string) => {
  const product = await ProductModel.findByIdAndDelete(id);
  if (!product) {
    throw new AppError("Product not found", 404);
  }
  return product;
};

export const bulkUpdateStatus = async (ids: string[], status: string) => {
  const result = await ProductModel.updateMany(
    { _id: { $in: ids } },
    { $set: { status } },
  );
  return { modified: result.modifiedCount };
};

export const bulkUpdateDiscount = async (ids: string[], percentage: number) => {
  const products = await ProductModel.find({ _id: { $in: ids } });
  let updated = 0;
  for (const p of products) {
    const discountPrice = Math.round(p.basePrice * (1 - percentage / 100));
    p.discount = { percentage, price: discountPrice, startDate: new Date() } as any;
    await p.save();
    updated++;
  }
  return { updated };
};

export const publishScheduledProducts = async () => {
  const now = new Date();
  const result = await ProductModel.updateMany(
    { status: "drafted", scheduledPublishAt: { $lte: now } },
    { $set: { status: "active" }, $unset: { scheduledPublishAt: 1 } },
  );
  return { published: result.modifiedCount };
};

export const getLowStockProducts = async () => {
  return ProductModel.find({
    status: "active",
    $expr: { $lte: ["$quantity", "$lowStockThreshold"] },
  }).select("name quantity lowStockThreshold coverImage slug").lean();
};

// ─── Public catalog (storefront) ────────────────────────────────────────────

export interface CatalogQuery extends IPaginationQuery {
  category?: string; // id or slug
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string; // price_asc | price_desc | newest | popular
  audience?: string; // men | women | unisex
  tag?: string; // facet filter against the product tags array
}

export const getCatalogProducts = async (query: CatalogQuery) => {
  const {
    pageNumber,
    pageSize,
    searchTerm,
    category,
    brand,
    minPrice,
    maxPrice,
    sort,
    audience,
    tag,
  } = query;

  const filter: FilterQuery<Product> = { status: "active" };

  if (audience) {
    const aud = audience.toLowerCase();
    filter.$expr = {
      $or: [
        { $eq: [{ $toLower: { $ifNull: ["$audience", ""] } }, aud] },
        {
          $in: [
            aud,
            {
              $map: {
                input: { $objectToArray: { $ifNull: ["$attributes", {}] } },
                as: "a",
                in: { $toLower: { $toString: "$$a.v" } },
              },
            },
          ],
        },
      ],
    };
  }

  if (tag) {
    const tagList = tag
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (tagList.length === 1) {
      filter.tags = { $regex: tagList[0], $options: "i" };
    } else if (tagList.length > 1) {
      filter.$and = [
        ...(Array.isArray(filter.$and) ? filter.$and : []),
        ...tagList.map((t) => ({ tags: { $regex: t, $options: "i" } })),
      ];
    }
  }

  if (category) {
    let categoryId = category;
    if (!isValidObjectId(category)) {
      const cat = await CategoryModel.findOne({
        slug: category.toLowerCase(),
      }).select("_id");
      categoryId = cat ? String(cat._id) : "000000000000000000000000";
    }
    filter.category = categoryId;
  }

  if (brand) filter.brand = { $regex: `^${brand}$`, $options: "i" };

  if (minPrice != null || maxPrice != null) {
    filter.basePrice = {};
    if (minPrice != null) filter.basePrice.$gte = minPrice;
    if (maxPrice != null) filter.basePrice.$lte = maxPrice;
  }

  if (searchTerm) {
    filter.$or = [
      { name: { $regex: searchTerm, $options: "i" } },
      { brand: { $regex: searchTerm, $options: "i" } },
      { description: { $regex: searchTerm, $options: "i" } },
    ];
  }

  const sortMap: Record<string, string> = {
    price_asc: "basePrice",
    price_desc: "-basePrice",
    newest: "-createdAt",
    popular: "-totalSales",
    rating: "-averageRating",
  };
  const sortBy = sortMap[sort || ""] || "-createdAt";

  const skip = (pageNumber - 1) * pageSize;

  const [products, totalCount] = await Promise.all([
    ProductModel.find(filter)
      .populate("category", "name slug")
      .sort(sortBy)
      .skip(skip)
      .limit(pageSize),
    ProductModel.countDocuments(filter),
  ]);

  return { products, totalCount };
};

export const getCatalogProductById = async (idOrSlug: string) => {
  const filter: Record<string, unknown> = { status: "active" };
  if (isValidObjectId(idOrSlug)) filter._id = idOrSlug;
  else filter.slug = idOrSlug;

  const product = await ProductModel.findOneAndUpdate(
    filter,
    { $inc: { viewCount: 1 } },
    { new: true },
  )
    .populate("category", "name slug attributes")
    .populate("relatedProducts", "name slug coverImage images basePrice discount averageRating totalReviews quantity variants status audience");
  if (!product) throw new AppError("Product not found", 404);

  let variationSiblings: any[] = [];
  if (product.variationGroup) {
    variationSiblings = await ProductModel.find({
      variationGroup: product.variationGroup,
      status: "active",
      _id: { $ne: product._id },
    })
      .select("name slug coverImage images basePrice discount quantity variationLabel variationValue")
      .sort("name")
      .lean();
  }

  const result = product.toObject();
  (result as any).variationSiblings = variationSiblings;
  return result;
};

export const getCatalogBrands = async () => {
  const brands = await ProductModel.distinct("brand", {
    status: "active",
    brand: { $nin: [null, ""] },
  });
  return brands.sort();
};

// Best sellers — ordered by sales, then rating, then newest. Always returns up
// to `limit` products even when there are no sales yet (graceful fallback).
export const getBestSellers = async (
  opts: {
    limit?: number;
    audience?: string;
    category?: string;
  } = {},
) => {
  const limit = opts.limit ?? 8;
  const filter: FilterQuery<Product> = { status: "active" };

  if (opts.audience) filter.audience = opts.audience.toLowerCase();

  if (opts.category) {
    let categoryId = opts.category;
    if (!isValidObjectId(opts.category)) {
      const cat = await CategoryModel.findOne({
        slug: opts.category.toLowerCase(),
      }).select("_id");
      categoryId = cat ? String(cat._id) : "000000000000000000000000";
    }
    filter.category = categoryId;
  }

  return ProductModel.find(filter)
    .populate("category", "name slug")
    .sort("-totalSales -averageRating -createdAt")
    .limit(limit);
};

// ─── Stats ─────────────────────────────────────────────────────────────────

export const getProductStats = async () => {
  const [agg] = await ProductModel.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
        },
        archived: {
          $sum: { $cond: [{ $eq: ["$status", "archived"] }, 1, 0] },
        },
        drafted: {
          $sum: { $cond: [{ $eq: ["$status", "drafted"] }, 1, 0] },
        },
        totalStock: { $sum: "$quantity" },
      },
    },
  ]);

  const lowStock = await ProductModel.countDocuments({ quantity: { $lt: 5 } });

  return {
    total: agg?.total ?? 0,
    active: agg?.active ?? 0,
    archived: agg?.archived ?? 0,
    drafted: agg?.drafted ?? 0,
    totalStock: agg?.totalStock ?? 0,
    lowStock,
  };
};

// ─── Bulk import ───────────────────────────────────────────────────────────

// Resolve a category reference that may be an ObjectId or a slug.
const resolveCategoryId = async (ref: string): Promise<string | null> => {
  if (isValidObjectId(ref)) {
    const exists = await CategoryModel.exists({ _id: ref });
    return exists ? ref : null;
  }
  const category = await CategoryModel.findOne({
    slug: ref.toLowerCase().trim(),
  }).select("_id");
  return category ? String(category._id) : null;
};

export interface BulkProductResult {
  createdCount: number;
  created: { _id: string; name: string }[];
  failed: { name: string; reason: string }[];
}

// Best-effort: a single bad row is recorded and skipped without aborting.
export const bulkCreateProducts = async (
  products: BulkProductInput[],
): Promise<BulkProductResult> => {
  const result: BulkProductResult = {
    createdCount: 0,
    created: [],
    failed: [],
  };

  for (const input of products) {
    try {
      const categoryId = await resolveCategoryId(input.category);
      if (!categoryId) {
        result.failed.push({
          name: input.name,
          reason: `Category "${input.category}" not found (use a valid id or slug)`,
        });
        continue;
      }

      const created = await ProductModel.create({
        ...input,
        category: categoryId,
        variants: withVariantSkus(input.variants),
      });

      result.created.push({ _id: String(created._id), name: created.name });
      result.createdCount += 1;
    } catch (error: any) {
      result.failed.push({
        name: input.name,
        reason: error?.message || "Failed to create product",
      });
    }
  }

  return result;
};

// ─── Variant management ────────────────────────────────────────────────────

export const addVariant = async (productId: string, variant: VariantInput) => {
  const product = await ProductModel.findByIdAndUpdate(
    productId,
    { $push: { variants: { ...variant, sku: variant.sku || generateSku() } } },
    { new: true, runValidators: true },
  );

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return product;
};

export const updateVariant = async (
  productId: string,
  variantId: string,
  data: Partial<Variant>,
) => {
  const product = await ProductModel.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const variant = (product.variants as any).id(variantId);
  if (!variant) {
    throw new AppError("Variant not found", 404);
  }

  Object.assign(variant, data);
  await product.save();

  return product;
};

export const removeVariant = async (productId: string, variantId: string) => {
  const product = await ProductModel.findByIdAndUpdate(
    productId,
    { $pull: { variants: { _id: new Types.ObjectId(variantId) } } },
    { new: true },
  );

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return product;
};
