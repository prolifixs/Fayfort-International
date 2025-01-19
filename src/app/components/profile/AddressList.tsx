'use client'

import { AddressCard } from './AddressCard'

interface Address {
  id: string
  street_address: string
  city: string
  state: string
  postal_code: string
  country: string
  is_default: boolean
}

interface AddressListProps {
  addresses: Address[]
  onSetDefault: (id: string) => void
  onDelete: (id: string) => void
  isDeleting?: string | null
  isSettingDefault?: string | null
}

export function AddressList({ 
  addresses, 
  onSetDefault, 
  onDelete,
  isDeleting,
  isSettingDefault 
}: AddressListProps) {
  if (addresses.length === 0) {
    return <p className="text-gray-500 text-center py-4">No addresses found. Add your first address!</p>
  }

  return (
    <div className="space-y-4">
      {addresses.map(address => (
        <AddressCard
          key={address.id}
          address={address}
          onSetDefault={onSetDefault}
          onDelete={onDelete}
          isDeleting={isDeleting === address.id}
          isSettingDefault={isSettingDefault === address.id}
        />
      ))}
    </div>
  )
} 