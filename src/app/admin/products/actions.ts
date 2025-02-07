import { ProductFormData } from "@/app/components/admin/ProductForm/ProductForm"

export async function createProduct(formData: ProductFormData & { tempId: string }) {
  try {
    // First create the product
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })

    if (!response.ok) throw new Error('Failed to create product')
    const product = await response.json()

    // Then migrate any temporary media
    if (formData.tempId) {
      const migrateResponse = await fetch('/api/products/media/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tempId: formData.tempId,
          productId: product.id
        })
      })

      if (!migrateResponse.ok) {
        console.error('Failed to migrate media:', await migrateResponse.json())
      }
    }

    return product
  } catch (error) {
    console.error('Product creation error:', error)
    throw error
  }
} 