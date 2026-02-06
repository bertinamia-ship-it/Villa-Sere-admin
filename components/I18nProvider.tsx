'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { t as esT } from '@/lib/i18n/es'
import { t as enT } from '@/lib/i18n/en'

type Language = 'es' | 'en'

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, string>) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('es')

  // Load language from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('app-language') as Language
      if (savedLanguage === 'es' || savedLanguage === 'en') {
        setLanguageState(savedLanguage)
      }
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('app-language', lang)
      // Trigger a custom event to notify components of language change
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }))
    }
  }

  const t = (key: string, params?: Record<string, string>): string => {
    if (language === 'en') {
      return enT(key, params)
    }
    return esT(key, params)
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}

