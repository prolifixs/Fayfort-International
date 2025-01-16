import { useState } from "react";

interface ToastOptions {
  message?: string;      // for simple toasts
  title?: string;        // for detailed toasts
  description?: string;  // for detailed toasts
  type?: 'success' | 'error';  // for simple toasts
  variant?: 'success' | 'destructive' | 'default';  // for detailed toasts
}

export function useToast() {
  const [isVisible, setIsVisible] = useState(false);
  const [toastProps, setToastProps] = useState<ToastOptions>({});

  const toast = (options: ToastOptions) => {
    // Transform variant to type if needed
    const transformedOptions = {
      ...options,
      type: options.type || (options.variant === 'destructive' ? 'error' : 'success')
    };
    
    setToastProps(transformedOptions);
    setIsVisible(true);
    setTimeout(() => setIsVisible(false), 3000);
  };

  return {
    toast,
    isVisible,
    toastProps,
    onClose: () => setIsVisible(false)
  };
}