// /lib/fetcher.ts

// Generic fetcher for SWR with error handling
export const fetcher = async <T = any>(url: string): Promise<T> => {
  const response = await fetch(url)
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }))
    const error = new Error(errorData.error || `HTTP ${response.status}`)
    ;(error as any).status = response.status
    ;(error as any).data = errorData
    throw error
  }

  const data = await response.json()
  return data.data || data
}

// POST/PUT/PATCH fetcher with body
export const mutationFetcher = async <T = any>(
  url: string, 
  options: RequestInit
): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }))
    const error = new Error(errorData.error || `HTTP ${response.status}`)
    ;(error as any).status = response.status
    ;(error as any).data = errorData
    throw error
  }

  const data = await response.json()
  return data.data || data
}

// Build URL with query parameters
export const buildUrl = (base: string, params: Record<string, any>): string => {
  const url = new URL(base, window.location.origin)
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })
  
  return url.toString()
}

// SWR configuration
export const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  shouldRetryOnError: (error: any) => {
    // Don't retry on 4xx errors
    return error?.status >= 500
  },
  errorRetryCount: 3,
  errorRetryInterval: 1000,
}