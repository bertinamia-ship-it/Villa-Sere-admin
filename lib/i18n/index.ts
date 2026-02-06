// Export t function for backward compatibility (uses localStorage directly)
import { t as esT } from './es'
import { t as enT } from './en'
import { cookies } from 'next/headers'

type Language = 'es' | 'en'

// Server-side t function that reads from cookies
export async function t(key: string, params?: Record<string, string>): Promise<string> {
  if (typeof window === 'undefined') {
    // Server-side: get from cookies
    try {
      const cookieStore = await cookies()
      const language = cookieStore.get('app-language')?.value as Language
      if (language === 'en') {
        return enT(key, params)
      }
      return esT(key, params)
    } catch {
      // If cookies() fails (e.g., in middleware), default to Spanish
      return esT(key, params)
    }
  }
  
  // Client-side: get from localStorage
  const savedLanguage = localStorage.getItem('app-language') as Language
  if (savedLanguage === 'en') {
    return enT(key, params)
  }
  return esT(key, params)
}
