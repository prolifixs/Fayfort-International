'use client'

import { useState } from 'react'
import { z } from 'zod'
import { MotionDiv } from '@/app/components/about/shared/MotionDiv'
import { Send } from 'lucide-react'

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(20, 'Message must be at least 20 characters')
})

type ContactForm = z.infer<typeof contactSchema>

export function ContactForm() {
  const [errors, setErrors] = useState<Partial<ContactForm>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData)

    try {
      const validatedData = contactSchema.parse(data)
      // TODO: Implement form submission
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulated API call
      setSubmitSuccess(true)
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(error.flatten().fieldErrors as Partial<ContactForm>)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-8 rounded-xl shadow-sm"
    >
      {submitSuccess ? (
        <div className="text-center py-8">
          <h3 className="text-2xl font-semibold text-green-600 mb-4">Message Sent!</h3>
          <p className="text-gray-600">We'll get back to you as soon as possible.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              id="name"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Similar fields for email, subject, and message */}
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Sending...' : (
              <>
                Send Message
                <Send className="ml-2 h-4 w-4" />
              </>
            )}
          </button>
        </form>
      )}
    </MotionDiv>
  )
} 