type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

interface ErrorReport {
  message: string
  stack?: string
  severity: ErrorSeverity
  timestamp: number
  metadata?: Record<string, any>
}

class ErrorReportingService {
  private readonly errors: ErrorReport[] = []

  async reportError(error: Error, severity: ErrorSeverity = 'medium', metadata?: Record<string, any>) {
    const errorReport: ErrorReport = {
      message: error.message,
      stack: error.stack,
      severity,
      timestamp: Date.now(),
      metadata
    }

    this.errors.push(errorReport)
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Report:', errorReport)
    }

    // Here you would typically send to your error reporting service
    // await this.sendToErrorService(errorReport)
  }

  getRecentErrors(limit: number = 10): ErrorReport[] {
    return this.errors
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }
}

export const errorReportingService = new ErrorReportingService() 