'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';
import type { Database } from '@/app/components/types/database.types';

const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  price_range: z.string().min(1, 'Price range is required'),
  availability: z.boolean(),
  image_url: z.string().optional(),
  specifications: z.record(z.any()).optional()
});

export type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => Promise<void>;
  initialData?: ProductFormData;
  mode: 'create' | 'edit';
  onSuccess?: () => void;
}

export default function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  onSuccess
}: ProductFormModalProps) {
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(initialData?.image_url || '');
  const supabase = createClientComponentClient<Database>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData
  });

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setImagePreview(publicUrl);
      setValue('image_url', publicUrl);
    } catch (error) {
      toast.error('Error uploading image');
      console.error('Error:', error);
    } finally {
      setUploading(false);
    }
  };

  const onSubmitForm = async (data: ProductFormData) => {
    try {
      // Remove currency symbols and convert to string
      const cleanedPriceRange = data.price_range.replace(/[$,]/g, '');
      
      const { error } = await supabase
        .from('products')
        .insert({
          name: data.name,
          description: data.description,
          category: data.category,
          price_range: cleanedPriceRange, // Send clean string
          availability: data.availability || false,
          image_url: data.image_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .single();

      if (error) throw error;
      toast.success('Product created successfully');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error creating product:', err);
      toast.error('Failed to create product');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {mode === 'create' ? 'Add New Product' : 'Edit Product'}
        </h2>

        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Product Image
            </label>
            <div className="flex items-center space-x-4">
              {imagePreview && (
                <div className="relative w-32 h-32">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="object-cover w-full h-full rounded-lg"
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                ref={fileInputRef}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload Image'}
              </button>
            </div>
            <input type="hidden" {...register('image_url')} />
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                {...register('name')}
                type="text"
                className="w-full p-2 border rounded-lg"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                {...register('description')}
                className="w-full p-2 border rounded-lg"
                rows={3}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                {...register('category')}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Select a category</option>
                <option value="fashion">Fashion</option>
                <option value="electronics">Electronics</option>
                <option value="home">Home</option>
                <option value="other">Other</option>
              </select>
              {errors.category && (
                <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
              )}
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium mb-1">Price Range</label>
              <input
                {...register('price_range')}
                type="text"
                className="w-full p-2 border rounded-lg"
                placeholder="e.g., $10-$20"
              />
              {errors.price_range && (
                <p className="text-red-500 text-sm mt-1">{errors.price_range.message}</p>
              )}
            </div>

            {/* Availability */}
            <div className="flex items-center">
              <input
                {...register('availability')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 rounded border-gray-300"
              />
              <label className="ml-2 text-sm font-medium">Available</label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || uploading}
              className={`px-4 py-2 rounded-lg text-white ${
                isSubmitting || uploading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Product' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 