'use client'

import { useState, useRef } from 'react'
import { z } from 'zod'
import { MotionDiv } from '@/app/components/about/shared/MotionDiv'
import { Upload, Send, X } from 'lucide-react'

const applicationSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  resume: z.instanceof(File, { message: 'Please upload your resume' }),
  coverLetter: z.string().min(100, 'Cover letter must be at least 100 characters'),
  portfolio: z.string().url().optional(),
  linkedin: z.string().url().optional()
})

type ApplicationForm = z.infer<typeof applicationSchema>

interface FormErrors extends Partial<ApplicationForm> {
  submit?: string;
}

interface Props {
  jobId: string
  jobTitle: string
}

interface FileError {
  message: string
}

export function ApplicationForm({ jobId, jobTitle }: Props) {
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [fileError, setFileError] = useState<FileError | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})
    setUploadProgress(0)
    setIsUploading(true)

    const formData = new FormData(e.currentTarget)
    formData.append('jobId', jobId)
    
    try {
      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(progress)
        }
      })

      const response = await new Promise((resolve, reject) => {
        xhr.open('POST', '/api/careers/apply')
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText))
          } else {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`))
          }
        }
        
        xhr.onerror = () => reject(new Error('Network error'))
        xhr.send(formData)
      })

      setSubmitSuccess(true)
      
      // Optional: Track successful submission
      if (typeof window !== 'undefined' && 'gtag' in window) {
        (window as any).gtag('event', 'application_submitted', {
          job_id: jobId,
          job_title: jobTitle,
        })
      }

    } catch (error) {
      console.error('Application submission error:', error)
      setErrors({
        submit: 'Failed to submit application. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
      setIsUploading(false)
    }
  }

  const validateFile = (file: File): FileError | null => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!allowedTypes.includes(file.type)) {
      return { message: 'Please upload a PDF or DOC file' }
    }

    if (file.size > maxSize) {
      return { message: 'File size must be less than 10MB' }
    }

    return null
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setFileError(null)
    
    if (file) {
      const error = validateFile(file)
      if (error) {
        setFileError(error)
        setFileName('')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        setFileName(file.name)
      }
    } else {
      setFileName('')
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    const file = e.dataTransfer.files?.[0]
    if (file && fileInputRef.current) {
      const error = validateFile(file)
      if (error) {
        setFileError(error)
        setFileName('')
      } else {
        // Create a new FileList containing only the dropped file
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)
        fileInputRef.current.files = dataTransfer.files
        setFileName(file.name)
        setFileError(null)
      }
    }
  }

  // Add progress bar component to the resume upload section
  const UploadProgress = () => {
    if (!isUploading) return null

    return (
      <div className="mt-2">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Uploading...</span>
          <span>{uploadProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm"
    >
      <h2 className="text-2xl font-semibold mb-6">Apply for {jobTitle}</h2>
      
      {submitSuccess ? (
        <div className="text-center text-green-600 py-8">
          <p className="text-xl font-medium">Application Submitted Successfully!</p>
          <p className="mt-2">We'll review your application and get back to you soon.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                name="firstName"
                id="firstName"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                name="lastName"
                id="lastName"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                id="email"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                name="phone"
                id="phone"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>
          </div>

          {/* Resume Upload */}
          <div>
            <label htmlFor="resume" className="block text-sm font-medium text-gray-700">Resume</label>
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${
                fileError ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              <div className="space-y-1 text-center">
                <Upload className={`mx-auto h-12 w-12 ${fileError ? 'text-red-400' : 'text-gray-400'}`} />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="resume"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="resume"
                      name="resume"
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="sr-only"
                      accept=".pdf,.doc,.docx"
                      disabled={isUploading}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                {fileName ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <span>Selected: {fileName}</span>
                    {!isUploading && (
                      <button
                        type="button"
                        onClick={() => {
                          setFileName('')
                          setFileError(null)
                          if (fileInputRef.current) {
                            fileInputRef.current.value = ''
                          }
                        }}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">PDF, DOC up to 10MB</p>
                )}
                {fileError && (
                  <p className="text-sm text-red-600">{fileError.message}</p>
                )}
                <UploadProgress />
              </div>
            </div>
          </div>

          {/* Cover Letter */}
          <div>
            <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700">Cover Letter</label>
            <textarea
              id="coverLetter"
              name="coverLetter"
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.coverLetter && <p className="mt-1 text-sm text-red-600">{errors.coverLetter}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : (
              <>
                Submit Application
                <Send className="ml-2 h-4 w-4" />
              </>
            )}
          </button>
        </form>
      )}
    </MotionDiv>
  )
} 