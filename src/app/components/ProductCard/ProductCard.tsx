'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { TableRow } from '@/app/components/types/database.types'
import { MediaGallery } from '../MediaGallery/MediaGallery'
import { Dialog } from '@headlessui/react'
import { SafeImage } from '../SafeImage'

type Product = TableRow<'products'> & {
  category?: TableRow<'categories'>
  media?: ProductMedia[]
  image_url?: string | null
}
type ProductMedia = TableRow<'product_media'>

interface ProductCardProps {
  product: Product
  onClick?: () => void
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const primaryMedia = product.media?.find(m => m.is_primary) || product.media?.[0]
  const mediaCount = product.media?.length || 0
  const hasVideo = product.media?.some(m => m.media_type === 'video')
  const displayUrl = primaryMedia?.media_type === 'video' 
    ? primaryMedia.thumbnail_url || '/placeholder-video.jpg'
    : primaryMedia?.url || '/placeholder-image.jpg'

  console.log('🎬 ProductCard media:', {
    primaryMedia,
    mediaType: primaryMedia?.media_type,
    thumbnailUrl: primaryMedia?.thumbnail_url,
    displayUrl
  });

  return (
    <>
      <div 
        className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
        onClick={() => onClick?.()}
      >
        {/* Media Preview */}
        <div className="relative aspect-square overflow-hidden rounded-t-lg">
          <SafeImage
            src={displayUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            priority={false}
          />
          
          {/* Video Indicator */}
          {primaryMedia?.media_type === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}

          {/* Media Indicators */}
          <div className="absolute top-2 right-2 flex gap-1">
            {mediaCount > 1 && (
              <span className="bg-black/50 text-white px-2 py-1 rounded text-xs">
                {mediaCount} {mediaCount === 1 ? 'image' : 'images'}
              </span>
            )}
            {hasVideo && (
              <span className="bg-blue-500/50 text-white px-2 py-1 rounded text-xs">
                Video
              </span>
            )}
          </div>

          {/* Quick Preview Button */}
          {mediaCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsPreviewOpen(true)
              }}
              className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
            >
              <span className="bg-white/90 text-gray-800 px-4 py-2 rounded-full text-sm font-medium">
                Quick View
              </span>
            </button>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 className="font-medium text-gray-900">{product.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{product.category?.name}</p>
          <p className="text-sm font-medium text-gray-900 mt-2">
            {product.price_range}
          </p>
        </div>
      </div>

      {/* Media Preview Modal */}
      <Dialog
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <MediaGallery media={product.media || []} />
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  )
} 