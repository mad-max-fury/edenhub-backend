"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProductSchema = void 0;
const zod_1 = require("zod");
const discountSchema = (0, zod_1.object)({
    type: (0, zod_1.string)().refine((val) => ["percentage", "fixed"].includes(val), {
        message: "Type must be 'percentage' or 'fixed'",
    }),
    value: (0, zod_1.number)().positive("Discount value must be positive"),
    startDate: (0, zod_1.date)(),
    endDate: (0, zod_1.date)(),
    isActive: (0, zod_1.boolean)(),
});
const variantSchema = (0, zod_1.object)({
    color: (0, zod_1.string)({
        required_error: "Color is required",
    }),
    caseSize: (0, zod_1.number)({
        required_error: "Case size is required",
    }).positive("Case size must be a positive number"),
    strap: (0, zod_1.string)({
        required_error: "Strap type is required",
    }),
    price: (0, zod_1.number)({
        required_error: "Price is required",
    }).positive("Price must be a positive number"),
    stock: (0, zod_1.number)({
        required_error: "Stock is required",
    }).nonnegative("Stock must be a non-negative number"),
    sku: (0, zod_1.string)({
        required_error: "SKU is required",
    }),
    images: (0, zod_1.array)((0, zod_1.string)()).default([]),
});
const specificationsSchema = (0, zod_1.object)({
    movement: (0, zod_1.string)(),
    waterResistance: (0, zod_1.string)(),
    caseMaterial: (0, zod_1.string)(),
    crystalType: (0, zod_1.string)(),
    dialColor: (0, zod_1.string)(),
    functions: (0, zod_1.array)((0, zod_1.string)()),
    powerReserve: (0, zod_1.string)(),
    warranty: (0, zod_1.string)(),
});
const reviewSchema = (0, zod_1.object)({
    user: (0, zod_1.string)({
        required_error: "User ID is required",
    }),
    rating: (0, zod_1.number)()
        .min(1, "Rating must be at least 1")
        .max(5, "Rating cannot exceed 5"),
    comment: (0, zod_1.string)(),
    title: (0, zod_1.string)(),
    verified: (0, zod_1.boolean)().default(false),
    createdAt: (0, zod_1.date)(),
    images: (0, zod_1.array)((0, zod_1.string)()).default([]),
    likes: (0, zod_1.number)().default(0),
    helpful: (0, zod_1.number)().default(0),
});
const dimensionsSchema = (0, zod_1.object)({
    width: (0, zod_1.number)().positive(),
    height: (0, zod_1.number)().positive(),
    depth: (0, zod_1.number)().positive(),
    weight: (0, zod_1.number)().positive(),
});
const seoSchema = (0, zod_1.object)({
    title: (0, zod_1.string)(),
    keywords: (0, zod_1.array)((0, zod_1.string)()).default([]),
    description: (0, zod_1.string)(),
});
exports.createProductSchema = (0, zod_1.object)({
    body: (0, zod_1.object)({
        name: (0, zod_1.string)({
            required_error: "Product name is required",
        }),
        description: (0, zod_1.string)({
            required_error: "Product description is required",
        }),
        brand: (0, zod_1.string)({
            required_error: "Brand is required",
        }),
        basePrice: (0, zod_1.number)({
            required_error: "Base price is required",
        }).positive("Base price must be positive"),
        category: (0, zod_1.string)({
            required_error: "Category is required",
        }).refine((val) => ["analog", "digital", "smart", "luxury"].includes(val), {
            message: "Category must be one of 'analog', 'digital', 'smart', or 'luxury'",
        }),
        tags: (0, zod_1.array)((0, zod_1.string)()).default([]),
        discount: discountSchema.optional(),
        variants: (0, zod_1.array)(variantSchema).nonempty("At least one variant is required"),
        specifications: specificationsSchema,
        reviews: (0, zod_1.array)(reviewSchema).default([]),
        averageRating: (0, zod_1.number)().default(0),
        totalReviews: (0, zod_1.number)().default(0),
        totalSales: (0, zod_1.number)().default(0),
        isActive: (0, zod_1.boolean)().default(true),
        relatedProducts: (0, zod_1.array)((0, zod_1.string)()).default([]),
        dimensions: dimensionsSchema.optional(),
        seo: seoSchema.optional(),
    }),
});
