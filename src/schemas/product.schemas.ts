import {
  object,
  string,
  number,
  array,
  boolean,
  date,
  TypeOf,
  union,
} from "zod";

const discountSchema = object({
  type: string().refine((val) => ["percentage", "fixed"].includes(val), {
    message: "Type must be 'percentage' or 'fixed'",
  }),
  value: number().positive("Discount value must be positive"),
  startDate: date(),
  endDate: date(),
  isActive: boolean(),
});

const variantSchema = object({
  color: string({
    required_error: "Color is required",
  }),
  caseSize: number({
    required_error: "Case size is required",
  }).positive("Case size must be a positive number"),
  strap: string({
    required_error: "Strap type is required",
  }),
  price: number({
    required_error: "Price is required",
  }).positive("Price must be a positive number"),
  stock: number({
    required_error: "Stock is required",
  }).nonnegative("Stock must be a non-negative number"),
  sku: string({
    required_error: "SKU is required",
  }),
  images: array(string()).default([]),
});

const specificationsSchema = object({
  movement: string(),
  waterResistance: string(),
  caseMaterial: string(),
  crystalType: string(),
  dialColor: string(),
  functions: array(string()),
  powerReserve: string(),
  warranty: string(),
});

const reviewSchema = object({
  user: string({
    required_error: "User ID is required",
  }),
  rating: number()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5"),
  comment: string(),
  title: string(),
  verified: boolean().default(false),
  createdAt: date(),
  images: array(string()).default([]),
  likes: number().default(0),
  helpful: number().default(0),
});

const dimensionsSchema = object({
  width: number().positive(),
  height: number().positive(),
  depth: number().positive(),
  weight: number().positive(),
});

const seoSchema = object({
  title: string(),
  keywords: array(string()).default([]),
  description: string(),
});

export const createProductSchema = object({
  body: object({
    name: string({
      required_error: "Product name is required",
    }),
    description: string({
      required_error: "Product description is required",
    }),
    brand: string({
      required_error: "Brand is required",
    }),
    basePrice: number({
      required_error: "Base price is required",
    }).positive("Base price must be positive"),
    category: string({
      required_error: "Category is required",
    }).refine((val) => ["analog", "digital", "smart", "luxury"].includes(val), {
      message:
        "Category must be one of 'analog', 'digital', 'smart', or 'luxury'",
    }),
    tags: array(string()).default([]),
    discount: discountSchema.optional(),
    variants: array(variantSchema).nonempty("At least one variant is required"),
    specifications: specificationsSchema,
    reviews: array(reviewSchema).default([]),
    averageRating: number().default(0),
    totalReviews: number().default(0),
    totalSales: number().default(0),
    isActive: boolean().default(true),
    relatedProducts: array(string()).default([]),
    dimensions: dimensionsSchema.optional(),
    seo: seoSchema.optional(),
  }),
});

export type CreateProductInputSchema = TypeOf<
  typeof createProductSchema
>["body"];
