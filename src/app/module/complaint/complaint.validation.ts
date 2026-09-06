
import { z } from 'zod';

export const createComplaintSchema = z.object({
  title: z
    .string()
    .min(5, { message: 'Title must be at least 5 characters' })
    .max(100, { message: 'Title cannot exceed 100 characters' })
    .trim(),
  
  description: z
    .string()
    .min(20, { message: 'Description must be at least 20 characters' })
    .max(2000, { message: 'Description is too long' }),
  
  location: z
    .string()
    .min(5, { message: 'Please provide a more specific location' })
    .max(255),
  
  categoryId: z
    .string()
    .uuid({ message: 'Invalid category ID format' }),
  
  photos: z
    .array(z.string().url({ message: 'Each photo must be a valid URL' }))
    .optional()
    .default([]), 
}).strict();