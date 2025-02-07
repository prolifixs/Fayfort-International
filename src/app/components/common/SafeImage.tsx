'use client'

import Image from 'next/image'
import { useState } from 'react'

interface SafeImageProps {
  src: string
  alt: string
  fill?: boolean
  className?: string
  priority?: boolean
  width?: number
  height?: number
}

export function SafeImage({ src, alt, fill, className, priority, width, height }: SafeImageProps) {
  const [error, setError] = useState(false)
  console.log('🖼️ SafeImage rendering with src:', src)
  console.log('❌ Error state:', error)

  return (
    <Image
      src={error ? '/placeholder-image.jpg' : src}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      className={className}
      priority={priority}
      onError={(e) => {
        console.error('🚫 Image load error:', e)
        setError(true)
      }}
    />
  )
} 