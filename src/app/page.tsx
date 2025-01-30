import { Hero } from '@/app/components/home/Hero/Hero'
import { CategoryGrid } from '@/app/components/home/Categories/CategoryGrid'
import { FeatureGrid } from '@/app/components/home/Features/FeatureGrid'
import { ProcessFlow } from '@/app/components/home/HowItWorks/ProcessFlow'
import { TestimonialSlider } from '@/app/components/home/Testimonials/TestimonialSlider'
import { CallToAction } from '@/app/components/home/CTASection/CallToAction'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <CategoryGrid />
      <FeatureGrid />
      <ProcessFlow />
      <TestimonialSlider />
      <CallToAction />
    </main>
  )
} 