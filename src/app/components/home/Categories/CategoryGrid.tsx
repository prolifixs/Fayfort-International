'use client'

import { CategoryCard } from './CategoryCard'

const categories = [
  {

    id: 'fashion',
    name: 'Fashion',
    description: 'Trending apparel and accessories',
    image: '/images/categories/fashion.jpg',
    itemCount: 2500,
    color: 'from-pink-500 to-rose-500'
  },
  {
    id: 'electronics',
    name: 'Electronics',
    description: 'Latest gadgets and devices',
    image: '/images/categories/electronics.jpg',
    itemCount: 1800,
    color: 'from-blue-500 to-indigo-500'
  },
  {
    id: 'home',
    name: 'Home & Living',
    description: 'Home decor and furnishings',
    image: '/images/categories/home.jpg',
    itemCount: 2100,
    color: 'from-amber-500 to-orange-500'
  }
]

export function CategoryGrid() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Browse Categories</h2>
          <p className="mt-4 text-lg text-gray-600">Discover our wide range of products across various categories</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </section>
  )
} 