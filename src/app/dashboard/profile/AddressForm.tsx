import { useState } from 'react'
import { useUsers } from '@/app/hooks/useUsers'

interface Address {
  id: string
  street_address: string
  city: string
  state: string
  postal_code: string
  country: string
  is_default: boolean
}
export function AddressForm() {
  const { users } = useUsers()
  const user = users?.[0] // Get current user
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [formData, setFormData] = useState({
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    is_default: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/user/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) throw new Error('Failed to add address')
      
      const newAddress = await response.json()
      setAddresses([...addresses, newAddress])
      setIsAddingNew(false)
      setFormData({
        street_address: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        is_default: false
      })
    } catch (error) {
      console.error('Error adding address:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/user/addresses/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete address')
      
      setAddresses(addresses.filter(addr => addr.id !== id))
    } catch (error) {
      console.error('Error deleting address:', error)
    }
  }
  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/user/addresses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true })
      })
      
      if (!response.ok) throw new Error('Failed to set default address')
      
      setAddresses(addresses.map(addr => ({
        ...addr,
        is_default: addr.id === id
      })))
    } catch (error) {
      console.error('Error setting default address:', error)
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

      {/* Address List */}
      <div className="space-y-4">
        {addresses.map(address => (
          <div
            key={address.id}
            className="border rounded-lg p-4 flex justify-between items-start"
          >
            <div>
              <p className="font-medium">
                {address.street_address}
                {address.is_default && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Default
                  </span>
                )}
              </p>
              <p className="text-gray-500">
                {address.city}, {address.state} {address.postal_code}
              </p>
              <p className="text-gray-500">{address.country}</p>
            </div>
            <div className="space-x-2">
              {!address.is_default && (
                <button
                  onClick={() => handleSetDefault(address.id)}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  Set as Default
                </button>
              )}
              <button
                onClick={() => handleDelete(address.id)}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

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
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
            >
              Save Address
            </button>
          </div>
        </form>
      )}
    </div>
  )
}