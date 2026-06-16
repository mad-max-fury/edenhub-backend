import { FilterQuery, Types } from "mongoose";
import { nanoid } from "nanoid";
import CategoryModel, {
  Category,
  CategoryAttribute,
  MAX_CATEGORY_DEPTH,
} from "../models/category.model";
import { IPaginationQuery } from "../utils/pagination.utils";
import AppError from "../errors/appError";
import {
  CategoryAttributeInput,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../schemas/category.schema";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const generateUniqueSlug = async (
  name: string,
  provided?: string,
  excludeId?: string,
): Promise<string> => {
  const base = slugify(provided || name);
  let slug = base || nanoid(8).toLowerCase();

  // Ensure uniqueness, ignoring the document being updated.
  while (
    await CategoryModel.exists({
      slug,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
  ) {
    slug = `${base}-${nanoid(5).toLowerCase()}`;
  }

  return slug;
};

// Resolve the level a category would occupy given its parent, and guard depth.
const resolveLevel = async (parentId?: string | null): Promise<number> => {
  if (!parentId) return 1;

  const parent = await CategoryModel.findById(parentId);
  if (!parent) {
    throw new AppError("Parent category not found", 404);
  }

  const level = parent.level + 1;
  if (level > MAX_CATEGORY_DEPTH) {
    throw new AppError(
      `Categories can only be nested up to ${MAX_CATEGORY_DEPTH} levels deep`,
      400,
    );
  }

  return level;
};

export const createCategory = async (data: CreateCategoryInput) => {
  const level = await resolveLevel(data.parent);
  const slug = await generateUniqueSlug(data.name, data.slug);

  return await CategoryModel.create({
    ...data,
    parent: data.parent || null,
    slug,
    level,
  });
};

export const getAllCategories = async (
  query: IPaginationQuery,
  customFilter: FilterQuery<Category> = {},
) => {
  const { pageNumber, pageSize, orderBy, searchTerm } = query;

  const searchFilter: FilterQuery<Category> = searchTerm
    ? {
        $or: [
          { name: { $regex: searchTerm, $options: "i" } },
          { slug: { $regex: searchTerm, $options: "i" } },
        ],
      }
    : {};

  const finalFilter = { ...searchFilter, ...customFilter };
  const skip = (pageNumber - 1) * pageSize;
  const sort = orderBy || "-createdAt";

  const [categories, totalCount] = await Promise.all([
    CategoryModel.find(finalFilter)
      .populate("parent", "name slug level")
      .sort(sort)
      .skip(skip)
      .limit(pageSize),
    CategoryModel.countDocuments(finalFilter),
  ]);

  return { categories, totalCount };
};

export const getAllCategoriesUnpaginated = async (
  customFilter: FilterQuery<Category> = {},
) => {
  return await CategoryModel.find(customFilter)
    .populate("parent", "name slug level")
    .sort("name");
};

// Build a nested tree (parent -> subcategories) from the flat collection.
export const getCategoryTree = async (
  filter: FilterQuery<Category> = {},
) => {
  const categories = await CategoryModel.find(filter).sort("name").lean();

  const byId = new Map<string, any>();
  categories.forEach((cat) => {
    byId.set(String(cat._id), { ...cat, subcategories: [] });
  });

  const roots: any[] = [];
  byId.forEach((node) => {
    const parentId = node.parent ? String(node.parent) : null;
    if (parentId && byId.has(parentId)) {
      byId.get(parentId).subcategories.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
};

// Walk up the parent chain collecting each ancestor's attributes so that a
// product placed in a leaf category inherits attributes from all its ancestors.
const collectInheritedAttributes = async (category: any) => {
  const chain: any[] = [category];
  let current = category;

  while (current.parent) {
    const parent = await CategoryModel.findById(current.parent).lean();
    if (!parent) break;
    chain.unshift(parent);
    current = parent;
  }

  // Ancestors first so closer (more specific) attributes win on id collisions.
  const merged = new Map<string, any>();
  chain.forEach((node) => {
    (node.attributes || []).forEach((attr: any) => {
      merged.set(String(attr._id), attr);
    });
  });

  return Array.from(merged.values()).sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );
};

export const getCategoryById = async (id: string) => {
  const category = await CategoryModel.findById(id)
    .populate("parent", "name slug level")
    .lean();

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  const inheritedAttributes = await collectInheritedAttributes(category);

  return { ...category, inheritedAttributes };
};

export const updateCategory = async (id: string, data: UpdateCategoryInput) => {
  const category = await CategoryModel.findById(id);
  if (!category) {
    throw new AppError("Category not found", 404);
  }

  const update: Partial<Category> = { ...data } as Partial<Category>;

  // Re-evaluate slug if name/slug changed.
  if (data.name || data.slug) {
    update.slug = await generateUniqueSlug(
      data.name || category.name,
      data.slug,
      id,
    );
  }

  // Re-parenting requires a depth + cycle re-check and cascading level updates.
  if (data.parent !== undefined) {
    const newParentId = data.parent || null;

    if (newParentId && String(newParentId) === id) {
      throw new AppError("A category cannot be its own parent", 400);
    }

    if (newParentId && (await isDescendant(id, String(newParentId)))) {
      throw new AppError(
        "Cannot move a category into one of its own descendants",
        400,
      );
    }

    const newLevel = await resolveLevel(newParentId);
    await assertSubtreeFitsDepth(id, newLevel);

    update.parent = newParentId as any;
    update.level = newLevel;
  }

  const updated = await CategoryModel.findByIdAndUpdate(id, update, {
    new: true,
  }).populate("parent", "name slug level");

  // Keep descendant levels consistent after a move.
  if (data.parent !== undefined) {
    await recomputeDescendantLevels(id);
  }

  return updated;
};

// True if `candidateAncestorId` appears anywhere below `categoryId`.
const isDescendant = async (
  categoryId: string,
  candidateAncestorId: string,
): Promise<boolean> => {
  let current = await CategoryModel.findById(candidateAncestorId)
    .select("parent")
    .lean();

  while (current?.parent) {
    if (String(current.parent) === categoryId) return true;
    current = await CategoryModel.findById(current.parent)
      .select("parent")
      .lean();
  }
  return false;
};

// Ensure moving a subtree to `rootLevel` won't push any descendant past the cap.
const assertSubtreeFitsDepth = async (categoryId: string, rootLevel: number) => {
  const depth = await getSubtreeDepth(categoryId);
  if (rootLevel + depth - 1 > MAX_CATEGORY_DEPTH) {
    throw new AppError(
      `This move would nest categories deeper than the ${MAX_CATEGORY_DEPTH}-level limit`,
      400,
    );
  }
};

// Number of levels contained in the subtree rooted at `categoryId` (>= 1).
const getSubtreeDepth = async (categoryId: string): Promise<number> => {
  const children = await CategoryModel.find({ parent: categoryId })
    .select("_id")
    .lean();
  if (children.length === 0) return 1;

  const childDepths = await Promise.all(
    children.map((c) => getSubtreeDepth(String(c._id))),
  );
  return 1 + Math.max(...childDepths);
};

const recomputeDescendantLevels = async (categoryId: string) => {
  const parent = await CategoryModel.findById(categoryId).select("level").lean();
  if (!parent) return;

  const children = await CategoryModel.find({ parent: categoryId }).select(
    "_id",
  );
  for (const child of children) {
    await CategoryModel.findByIdAndUpdate(child._id, {
      level: parent.level + 1,
    });
    await recomputeDescendantLevels(String(child._id));
  }
};

export const deleteCategory = async (id: string) => {
  const category = await CategoryModel.findById(id);
  if (!category) {
    throw new AppError("Category not found", 404);
  }

  const childCount = await CategoryModel.countDocuments({ parent: id });
  if (childCount > 0) {
    throw new AppError(
      "Cannot delete a category that has subcategories. Remove or re-parent them first.",
      400,
    );
  }

  return await CategoryModel.findByIdAndDelete(id);
};

// ─── Bulk import ───────────────────────────────────────────────────────────

interface BulkCategoryNode {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  isActive?: boolean;
  attributes?: CategoryAttribute[];
  subcategories?: BulkCategoryNode[];
}

export interface BulkImportResult {
  createdCount: number;
  created: { _id: string; name: string; level: number }[];
  failed: { name: string; reason: string }[];
}

// Best-effort: a single bad node (e.g. too deep) is recorded and skipped along
// with its subtree, without aborting the rest of the import.
export const bulkCreateCategories = async (
  nodes: BulkCategoryNode[],
): Promise<BulkImportResult> => {
  const result: BulkImportResult = {
    createdCount: 0,
    created: [],
    failed: [],
  };

  const createNode = async (
    node: BulkCategoryNode,
    parentId: string | null,
    level: number,
  ): Promise<void> => {
    if (level > MAX_CATEGORY_DEPTH) {
      result.failed.push({
        name: node.name,
        reason: `Exceeds the ${MAX_CATEGORY_DEPTH}-level nesting limit`,
      });
      return;
    }

    try {
      const slug = await generateUniqueSlug(node.name, node.slug);
      const created = await CategoryModel.create({
        name: node.name,
        slug,
        description: node.description,
        image: node.image,
        isActive: node.isActive ?? true,
        attributes: node.attributes ?? [],
        parent: parentId,
        level,
      });

      result.created.push({
        _id: String(created._id),
        name: created.name,
        level: created.level,
      });
      result.createdCount += 1;

      for (const child of node.subcategories ?? []) {
        await createNode(child, String(created._id), level + 1);
      }
    } catch (error: any) {
      result.failed.push({
        name: node.name,
        reason: error?.message || "Failed to create category",
      });
    }
  };

  for (const node of nodes) {
    await createNode(node, null, 1);
  }

  return result;
};

// ─── Attribute management ──────────────────────────────────────────────────

export const addAttribute = async (
  categoryId: string,
  attribute: CategoryAttributeInput,
) => {
  const category = await CategoryModel.findByIdAndUpdate(
    categoryId,
    { $push: { attributes: attribute } },
    { new: true },
  );

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  return category;
};

export const updateAttribute = async (
  categoryId: string,
  attributeId: string,
  data: Partial<CategoryAttribute>,
) => {
  const category = await CategoryModel.findById(categoryId);
  if (!category) {
    throw new AppError("Category not found", 404);
  }

  const attribute = (category.attributes as any).id(attributeId);
  if (!attribute) {
    throw new AppError("Attribute not found", 404);
  }

  Object.assign(attribute, data);
  await category.save();

  return category;
};

export const removeAttribute = async (
  categoryId: string,
  attributeId: string,
) => {
  const category = await CategoryModel.findByIdAndUpdate(
    categoryId,
    { $pull: { attributes: { _id: new Types.ObjectId(attributeId) } } },
    { new: true },
  );

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  return category;
};
