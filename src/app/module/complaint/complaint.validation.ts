
import { z } from 'zod';
import { ComplaintPriority, ComplaintStatus } from '../../../generated/prisma/enums';

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

export const getMyComplaintsSchema = z.object({

  status: z.enum(Object.values(ComplaintStatus) as [string, ...string[]]).optional(),
  
  priority: z.enum(Object.values(ComplaintPriority) as [string, ...string[]]).optional(),
  
  page: z.string().regex(/^\d+$/, { message: 'Page must be a number' }).optional(),
  limit: z.string().regex(/^\d+$/, { message: 'Limit must be a number' }).optional(),
});

export const resolveComplaintSchema = z.object({
  resolutionProof: z
    .string()
    .url({ message: 'Resolution proof must be a valid URL' })
    .optional(), 
});

export const confirmComplaintSchema = z.object({
  id: z.string().uuid({ message: 'Invalid complaint ID format' }),
});
