'use client'

import { useState } from 'react'
import Image from 'next/image'
import ReactPlayer from 'react-player'
import { TableRow } from '@/app/components/types/database.types'
import { Dialog } from '@headlessui/react'

type ProductMedia = TableRow<'product_media'>

interface MediaGalleryProps {
  media: ProductMedia[]
}

export function MediaGallery({ media }: MediaGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const selectedMedia = media[selectedIndex]

  const handleNext = () => {
    setSelectedIndex((prev) => (prev + 1) % media.length)
  }

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev - 1 + media.length) % media.length)
  }

  return (
    <div className="space-y-4">
      {/* Main Display */}
      <div className="relative aspect-square w-full">
        <button
          onClick={() => setIsLightboxOpen(true)}
          className="w-full h-full relative"
        >
          {selectedMedia.media_type === 'image' ? (
            <Image
              src={selectedMedia.url}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover rounded-lg"
              priority
            />
          ) : (
            <ReactPlayer
              url={selectedMedia.url}
              width="100%"
              height="100%"
              controls
              light={selectedMedia.thumbnail_url}
            />
          )}
        </button>

        {/* Navigation Arrows */}
        {media.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handlePrev()
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 z-10"
              aria-label="Previous image"
            >
              ←
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleNext()
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 z-10"
              aria-label="Next image"
            >
              →
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {media.length > 1 && (
        <div className="grid grid-cols-6 gap-2">
          {media.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setSelectedIndex(index)}
              className={`relative aspect-square ${
                index === selectedIndex ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {item.media_type === 'image' ? (
                <Image
                  src={item.url}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 16vw, 8vw"
                  className="object-cover rounded"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center text-xs">
                  Video
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog
        open={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/90" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-4xl relative p-4">
            {selectedMedia.media_type === 'image' ? (
              <div className="relative w-full h-[60vh]">
                <Image
                  src={selectedMedia.url}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 80vw"
                  className="object-contain rounded-lg"
                  priority
                />
              </div>
            ) : (
              <ReactPlayer
                url={selectedMedia.url}
                width="100%"
                height="100%"
                controls
              />
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  )
} 