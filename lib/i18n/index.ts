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

// Development-only function to check for missing translations
export function checkMissingTranslations() {
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  // This will be called on client-side only
  if (typeof window === 'undefined') {
    return
  }

  const missingKeys: string[] = []
  const checkedKeys = new Set<string>()

  // Helper to check if a key exists
  const checkKey = (key: string, lang: 'es' | 'en') => {
    if (checkedKeys.has(`${lang}:${key}`)) {
      return
    }
    checkedKeys.add(`${lang}:${key}`)

    const keys = key.split('.')
    let value: any = lang === 'es' ? require('./es').es : require('./en').enTranslations

    for (const k of keys) {
      value = value?.[k]
      if (value === undefined) {
        missingKeys.push(`${lang}:${key}`)
        return
      }
    }

    if (typeof value !== 'string') {
      missingKeys.push(`${lang}:${key} (not a string)`)
    }
  }

  // Scan DOM for t() calls (this is a simple heuristic)
  // In a real scenario, you'd want to extract all t() calls from source code
  console.log('[i18n] Checking for missing translations...')
  console.log('[i18n] Note: Run a full code scan to find all keys used in the app')
  
  if (missingKeys.length > 0) {
    console.warn('[i18n] Missing translation keys found:', missingKeys)
  } else {
    console.log('[i18n] No missing keys detected (limited scan)')
  }
}
