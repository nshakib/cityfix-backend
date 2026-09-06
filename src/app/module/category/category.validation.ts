import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(50, { message: 'Name cannot exceed 50 characters' })
    .trim(),
  departmentId: z
    .string()
    .uuid({ message: 'Invalid department ID format' }),
}).strict();

export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(50, { message: 'Name cannot exceed 50 characters' })
    .trim()
    .optional(),
  departmentId: z
    .string()
    .uuid({ message: 'Invalid department ID format' })
    .optional(),
})
.strict()
.refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);