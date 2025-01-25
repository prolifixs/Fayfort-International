interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
}

interface ExtendedRequestInit extends RequestInit {
  onUploadProgress?: (progressEvent: ProgressEvent<XMLHttpRequestEventTarget>) => void;
}

export async function retryFetch(
  url: string,
  options: ExtendedRequestInit,
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const { maxAttempts = 3, delayMs = 1000 } = retryOptions;
  let lastError: Error | null = null;

  if (options.onUploadProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', options.onUploadProgress as EventListener);
      xhr.responseType = 'json';
      
      xhr.open(options.method || 'GET', url);
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value as string);
        });
      }
      
      xhr.onload = () => resolve(new Response(xhr.response, {
        status: xhr.status,
        statusText: xhr.statusText,
        headers: new Headers({ 'Content-Type': 'application/json' })
      }));
      xhr.onerror = () => reject(new Error('Network request failed'));
      
      xhr.send(options.body as FormData);
    });
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (error: any) {
      lastError = error;
      if (attempt === maxAttempts) break;
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }
  
  throw lastError;
} 