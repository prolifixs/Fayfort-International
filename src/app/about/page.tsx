import { AboutHero } from '@/app/components/about/Hero/AboutHero'
import { AboutStats } from '@/app/components/about/Hero/AboutStats'
import { TeamGrid } from '@/app/components/about/Team/TeamGrid'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Fayfort Enterprise | Leading Product Sourcing Platform',
  description: 'Learn about Fayfort Enterprise, our mission to revolutionize product sourcing, and the team behind our success.',
}

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <AboutHero />
      <AboutStats />
      <TeamGrid />
    </main>
  )
} 