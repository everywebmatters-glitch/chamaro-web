import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  slug: z.string().min(2, "Slug is required"),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  sku: z.string().optional(),
  basePrice: z.number().nonnegative(),
  compareAtPrice: z.number().nonnegative().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED", "OUT_OF_STOCK"]).default("DRAFT"),
  featured: z.boolean().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  image: z.string().optional(),
  status: z.boolean().default(true),
});

export const inventorySchema = z.object({
  quantity: z.number().int().nonnegative(),
  lowStockThreshold: z.number().int().nonnegative().default(5),
});

export const cmsPageSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(2),
  content: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
});
