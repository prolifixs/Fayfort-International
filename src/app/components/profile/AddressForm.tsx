'use client'

import { useState, useEffect } from 'react'
import { useUsers } from '@/app/hooks/useUsers'
import { useToast } from '@/app/hooks/useToast'
import Toast from '@/app/components/Toast'
import { AddressList } from './AddressList'
import { z } from 'zod'
import LoadingSpinner from '@/app/components/LoadingSpinner'
import type { Database } from '@/app/components/types/database.types'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type Address = Database['public']['Tables']['shipping_address']['Row']

const addressSchema = z.object({
  street_address: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postal_code: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  is_default: z.boolean()
})

export function AddressForm() {
  const { users } = useUsers()
  const user = users?.[0] // Get current user
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast, isVisible, toastProps, onClose } = useToast()
  const [formData, setFormData] = useState({
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    is_default: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isSettingDefault, setIsSettingDefault] = useState<string | null>(null)

  const supabase = createClientComponentClient<Database>()

  // Fetch addresses on component mount
  useEffect(() => {
    if (user?.id) {
      fetchAddresses()
    }
  }, [user])

  const fetchAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('shipping_address')
        .select('*')
        .eq('user_id', user?.id)

      if (error) throw error
      setAddresses(data)
    } catch (error) {
      toast({ 
        message: 'Error fetching addresses', 
        type: 'error' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Validate form data
      const validatedData = addressSchema.parse(formData)
      
      // Optimistic update
      const tempId = `temp-${Date.now()}`
      const newAddress: Address = {
        ...validatedData,
        id: tempId,
        user_id: user?.id || '',
        created_at: new Date().toISOString()
      }
      setAddresses(prev => [...prev, newAddress])
      
      const { data, error } = await supabase
        .from('shipping_address')
        .insert([{ ...validatedData, user_id: user?.id }])
        .select()

      if (error) throw error
      
      // Replace temp address with saved one
      setAddresses(prev => prev.map(addr => 
        addr.id === tempId ? data[0] : addr
      ))
      
      setIsAddingNew(false)
      setFormData({
        street_address: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        is_default: false
      })
      toast({ message: 'Address added successfully', type: 'success' })
    } catch (err) {
      const error = err as Error
      toast({ 
        message: error.message || 'Error adding address', 
        type: 'error' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setIsDeleting(id)
    
    // Optimistic update - remove address immediately
    const previousAddresses = [...addresses]
    setAddresses(addresses.filter(addr => addr.id !== id))
    
    try {
      const response = await fetch(`/api/user/addresses/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        // Revert optimistic update
        setAddresses(previousAddresses)
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete address')
      }
      
      toast({ 
        message: 'Address deleted successfully', 
        type: 'success' 
      })
    } catch (err) {
      const error = err as Error
      toast({ 
        message: error.message || 'Error deleting address', 
        type: 'error' 
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const handleSetDefault = async (id: string) => {
    setIsSettingDefault(id)
    
    // Optimistic update - update default status immediately
    const previousAddresses = [...addresses]
    setAddresses(addresses.map(addr => ({
      ...addr,
      is_default: addr.id === id
    })))
    
    try {
      const response = await fetch(`/api/user/addresses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true })
      })
      
      if (!response.ok) {
        // Revert optimistic update
        setAddresses(previousAddresses)
        const error = await response.json()
        throw new Error(error.message || 'Failed to set default address')
      }
      
      toast({ 
        message: 'Default address updated', 
        type: 'success' 
      })
    } catch (err) {
      const error = err as Error
      toast({ 
        message: error.message || 'Error setting default address', 
        type: 'error' 
      })
    } finally {
      setIsSettingDefault(null)
    }
  }

  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Shipping Addresses</h2>
        <button
          onClick={() => setIsAddingNew(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
        >
          Add New Address
        </button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-24 bg-gray-200 rounded-lg" />
          ))}
        </div>
      ) : (
        <AddressList
          addresses={addresses}
          onSetDefault={handleSetDefault}
          onDelete={handleDelete}
          isDeleting={isDeleting}
          isSettingDefault={isSettingDefault}
        />
      )}

      {/* Add New Address Form */}
      {isAddingNew && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Street Address
            </label>
            <input
              type="text"
              required
              value={formData.street_address}
              onChange={e => setFormData({ ...formData, street_address: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                City
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                State
              </label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={e => setFormData({ ...formData, state: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Postal Code
              </label>
              <input
                type="text"
                required
                value={formData.postal_code}
                onChange={e => setFormData({ ...formData, postal_code: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Country
              </label>
              <input
                type="text"
                required
                value={formData.country}
                onChange={e => setFormData({ ...formData, country: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_default"
              checked={formData.is_default}
              onChange={e => setFormData({ ...formData, is_default: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="is_default" className="ml-2 text-sm text-gray-700">
              Set as default shipping address
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="bg-white text-gray-700 px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Adding...
                </div>
              ) : (
                'Add Address'
              )}
            </button>
          </div>
        </form>
      )}

      {isVisible && toastProps.message && (
        <Toast 
          message={toastProps.message} 
          type={toastProps.type || 'success'} 
          onClose={onClose} 
        />
      )}
    </div>
  )
}