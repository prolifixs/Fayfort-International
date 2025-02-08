import { useState, useEffect } from 'react'

export function useLoadingSafety(timeoutMs = 5000, isLoading: boolean) {
  const [isStuck, setIsStuck] = useState(false)
  
  useEffect(() => {
    let timeout: NodeJS.Timeout

    // Only start counting if we're actually loading
    if (isLoading) {
      timeout = setTimeout(() => {
        setIsStuck(true)
      }, timeoutMs)
    } else {
      setIsStuck(false)
    }

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [timeoutMs, isLoading])

  return isStuck
}
