'use client'

import LoadingSpinner from "../LoadingSpinner"

interface AddressCardProps {
  address: {
    id: string
    street_address: string
    city: string
    state: string
    postal_code: string
    country: string
    is_default: boolean
  }
  onSetDefault: (id: string) => void
  onDelete: (id: string) => void
  isDeleting?: boolean
  isSettingDefault?: boolean
}

export function AddressCard({ address, onSetDefault, onDelete, isDeleting, isSettingDefault }: AddressCardProps) {
  return (
    <div className="border rounded-lg p-4 flex justify-between items-start">
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
            onClick={() => onSetDefault(address.id)}
            disabled={isSettingDefault}
            className="text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
          >
            {isSettingDefault ? (
              <div className="flex items-center">
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Setting...
              </div>
            ) : (
              'Set as Default'
            )}
          </button>
        )}
        <button
          onClick={() => onDelete(address.id)}
          disabled={isDeleting}
          className="text-red-600 hover:text-red-800 disabled:opacity-50"
        >
          {isDeleting ? (
            <div className="flex items-center">
              <LoadingSpinner className="w-4 h-4 mr-2" />
              Deleting...
            </div>
          ) : (
            'Delete'
          )}
        </button>
      </div>
    </div>
  )
} 