'use client'

import { Globe } from 'lucide-react'
import { useI18n } from '@/components/I18nProvider'

export function LanguageSelector() {
  const { language, setLanguage, t } = useI18n()

  return (
    <div className="flex items-center gap-2">
      {/* Optional Globe Icon */}
      <Globe className="h-4 w-4 text-slate-400" />
      
      {/* Segmented Control */}
      <div className="inline-flex items-center bg-slate-100 rounded-lg p-1 shadow-inner">
        <button
          onClick={() => setLanguage('es')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
            language === 'es'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          ES
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
            language === 'en'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          EN
        </button>
      </div>
    </div>
  )
}

