import { NextResponse } from 'next/server'
import { z } from 'zod'

const applicationSchema = z.object({
  jobId: z.string(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  coverLetter: z.string().min(100),
  portfolio: z.string().url().optional(),
  linkedin: z.string().url().optional(),
  // Resume will be handled separately through file upload
})

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const resume = formData.get('resume') as File
    
    // Validate resume
    if (!resume || !['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        .includes(resume.type)) {
      return NextResponse.json(
        { error: 'Invalid resume format. Please upload a PDF or DOC file.' },
        { status: 400 }
      )
    }

    // Convert formData to object for validation
    const data = Object.fromEntries(formData.entries())
    const validatedData = applicationSchema.parse(data)

    // Here you would typically:
    // 1. Upload resume to storage (e.g., S3)
    // 2. Save application to database
    // 3. Send notification emails
    // 4. Update application tracking system

    // For now, we'll just simulate success
    return NextResponse.json({ 
      message: 'Application submitted successfully',
      applicationId: `APP-${Date.now()}`
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Application submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit application. Please try again.' },
      { status: 500 }
    )
  }
} 