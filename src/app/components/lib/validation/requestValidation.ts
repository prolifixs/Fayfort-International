import { z } from 'zod';

export const requestFormSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().min(1).max(1000),
  budget: z.number().min(0),
  notes: z.string().optional(),
});

export const validateRequestForm = (data: unknown) => {
  try {
    return {
      success: true,
      data: requestFormSchema.parse(data)
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      };
    }
    return {
      success: false,
      errors: [{ field: 'form', message: 'Invalid form data' }]
    };
  }
}; 