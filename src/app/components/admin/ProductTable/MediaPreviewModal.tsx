import { Dialog } from '@headlessui/react'
import Image from 'next/image'
import { TableRow } from '@/app/components/types/database.types'

type ProductMedia = TableRow<'product_media'>

interface MediaPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  media: ProductMedia[]
}

export function MediaPreviewModal({ isOpen, onClose, media }: MediaPreviewModalProps) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-lg p-6 max-w-4xl w-full">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {media.map((item) => (
              <div key={item.id} className="relative aspect-square">
                <Image
                  src={item.url}
                  alt="Product image"
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
            ))}
          </div>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-200 rounded-lg"
          >
            Close
          </button>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
} 