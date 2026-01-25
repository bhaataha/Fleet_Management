'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { he } from './he'
import { en } from './en'
import { ar } from './ar'
import type { TranslationKeys } from './he'

type Language = 'he' | 'en' | 'ar'

interface I18nStore {
  language: Language
  translations: TranslationKeys
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations: Record<Language, TranslationKeys> = {
  he,
  en,
  ar,
}

export const useI18n = create<I18nStore>()(
  persist(
    (set, get) => ({
      language: 'he',
      translations: he,
      
      setLanguage: (lang: Language) => {
        set({ 
          language: lang, 
          translations: translations[lang] 
        })
        
        // Update document direction - Hebrew and Arabic are RTL
        if (typeof window !== 'undefined') {
          document.documentElement.lang = lang
          document.documentElement.dir = (lang === 'he' || lang === 'ar') ? 'rtl' : 'ltr'
        }
      },
      
      t: (key: string): string => {
        const { translations } = get()
        const keys = key.split('.')
        let value: any = translations
        
        for (const k of keys) {
          value = value?.[k]
        }
        
        return typeof value === 'string' ? value : key
      },
    }),
    {
      name: 'fleet-i18n',
    }
  )
)
