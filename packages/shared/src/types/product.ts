import { z } from "zod";

export const ProductCreateSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .min(2)
    .max(50),
  description: z.string().optional(),
  allowedModels: z.array(z.string()).default([]),
  defaultModel: z.string().optional(),
  costAlertDaily: z.number().positive().optional(),
  costAlertEngineer: z.number().positive().optional(),
});

export type ProductCreate = z.infer<typeof ProductCreateSchema>;

export const ProductUpdateSchema = ProductCreateSchema.partial();
export type ProductUpdate = z.infer<typeof ProductUpdateSchema>;
