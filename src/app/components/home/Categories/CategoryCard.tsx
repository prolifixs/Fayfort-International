'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

interface CategoryProps {
  category: {
    id: string
    name: string
    description: string
    image: string
    itemCount: number
    color: string
  }
}

export function CategoryCard({ category }: CategoryProps) {
  const router = useRouter()

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative overflow-hidden rounded-xl shadow-lg cursor-pointer"
      onClick={() => router.push(`/catalog?category=${category.id}`)}
    >
      <div className="relative h-64 w-full">
        <Image
          src={category.image}
          alt={category.name}
          fill
          className="object-cover"
        />
        <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-60`} />
        <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
          <h3 className="text-2xl font-bold mb-2">{category.name}</h3>
          <p className="text-sm mb-2">{category.description}</p>
          <span className="text-sm font-medium">{category.itemCount}+ items</span>
        </div>
      </div>
    </motion.div>
  )
} 