'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams } from 'next/navigation';
import { products } from '../components/data/dummy';

// Define validation schema
const requestSchema = z.object({
  productName: z.string().min(3, 'Product name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  quantity: z.number()
    .min(1, 'Quantity must be at least 1')
    .max(1000, 'Quantity cannot exceed 1000'),
  budget: z.number()
    .min(1, 'Budget must be greater than 0')
    .max(1000000, 'Budget cannot exceed 1,000,000'),
});

type RequestFormData = z.infer<typeof requestSchema>;

export default function RequestPage() {
  const searchParams = useSearchParams();
  const productId = searchParams.get('product');
  const selectedProduct = productId ? products.find(p => p.id === productId) : null;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      productName: selectedProduct?.name || '',
      description: '',
      quantity: 1,
      budget: 0,
    },
  });

  const onSubmit = async (data: RequestFormData) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Form submitted:', data);
      reset();
      // TODO: Add success notification
    } catch (error) {
      console.error('Error submitting form:', error);
      // TODO: Add error notification
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Submit a Request</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Product Name</label>
          <input
            {...register('productName')}
            type="text"
            className="w-full p-3 border rounded-lg"
            placeholder="Enter product name"
          />
          {errors.productName && (
            <p className="text-red-500 text-sm mt-1">{errors.productName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            {...register('description')}
            rows={4}
            className="w-full p-3 border rounded-lg"
            placeholder="Describe your product requirements"
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Quantity</label>
            <input
              {...register('quantity', { valueAsNumber: true })}
              type="number"
              className="w-full p-3 border rounded-lg"
              placeholder="Enter quantity"
            />
            {errors.quantity && (
              <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Budget</label>
            <input
              {...register('budget', { valueAsNumber: true })}
              type="number"
              className="w-full p-3 border rounded-lg"
              placeholder="Enter your budget"
            />
            {errors.budget && (
              <p className="text-red-500 text-sm mt-1">{errors.budget.message}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full p-3 rounded-lg text-white ${
            isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
} 