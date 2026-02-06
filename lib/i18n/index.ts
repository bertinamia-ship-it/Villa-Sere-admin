// Export t function for backward compatibility (uses localStorage directly)
import { t as esT } from './es'
import { t as enT } from './en'

type Language = 'es' | 'en'

export function t(key: string, params?: Record<string, string>): string {
  if (typeof window === 'undefined') {
    // Server-side: default to Spanish
    return esT(key, params)
  }
  
  // Client-side: get from localStorage
  const savedLanguage = localStorage.getItem('app-language') as Language
  if (savedLanguage === 'en') {
    return enT(key, params)
  }
  return esT(key, params)
}
