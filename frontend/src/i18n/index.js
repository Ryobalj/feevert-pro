// src/i18n/index.js

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// ============ COMMON NAMESPACE ============
import enCommon from './locales/en/common.json'
import swCommon from './locales/sw/common.json'
import zhCommon from './locales/zh/common.json'
import frCommon from './locales/fr/common.json'
import ruCommon from './locales/ru/common.json'
import arCommon from './locales/ar/common.json'

// ============ ACCOUNT NAMESPACE ============
import enAccount from '../features/accounts/locales/en/account.json'
import swAccount from '../features/accounts/locales/sw/account.json'
import zhAccount from '../features/accounts/locales/zh/account.json'
import frAccount from '../features/accounts/locales/fr/account.json'
import ruAccount from '../features/accounts/locales/ru/account.json'
import arAccount from '../features/accounts/locales/ar/account.json'

// ============ ADMIN NAMESPACE ============
import enAdmin from '../features/accounts/locales/en/admin.json'
import swAdmin from '../features/accounts/locales/sw/admin.json'
import zhAdmin from '../features/accounts/locales/zh/admin.json'
import frAdmin from '../features/accounts/locales/fr/admin.json'
import ruAdmin from '../features/accounts/locales/ru/admin.json'
import arAdmin from '../features/accounts/locales/ar/admin.json'

// ============ BOOKING NAMESPACE ============
import enBooking from '../features/bookings/locales/en/booking.json'
import swBooking from '../features/bookings/locales/sw/booking.json'
import zhBooking from '../features/bookings/locales/zh/booking.json'
import frBooking from '../features/bookings/locales/fr/booking.json'
import ruBooking from '../features/bookings/locales/ru/booking.json'
import arBooking from '../features/bookings/locales/ar/booking.json'

// ============ CAREERS NAMESPACE ============
import enCareers from '../features/careers/locales/en/careers.json'
import swCareers from '../features/careers/locales/sw/careers.json'
import zhCareers from '../features/careers/locales/zh/careers.json'
import frCareers from '../features/careers/locales/fr/careers.json'
import ruCareers from '../features/careers/locales/ru/careers.json'
import arCareers from '../features/careers/locales/ar/careers.json'

// ============ CONSULTATIONS NAMESPACE ============
import enConsultations from '../features/consultations/locales/en/consultations.json'
import swConsultations from '../features/consultations/locales/sw/consultations.json'
import zhConsultations from '../features/consultations/locales/zh/consultations.json'
import frConsultations from '../features/consultations/locales/fr/consultations.json'
import ruConsultations from '../features/consultations/locales/ru/consultations.json'
import arConsultations from '../features/consultations/locales/ar/consultations.json'

// ============ HOME NAMESPACE ============
import enHome from '../features/home/locales/en/home.json'
import swHome from '../features/home/locales/sw/home.json'
import zhHome from '../features/home/locales/zh/home.json'
import frHome from '../features/home/locales/fr/home.json'
import ruHome from '../features/home/locales/ru/home.json'
import arHome from '../features/home/locales/ar/home.json'

// ============ PROJECTS NAMESPACE ============
import enProjects from '../features/projects/locales/en/projects.json'
import swProjects from '../features/projects/locales/sw/projects.json'
import zhProjects from '../features/projects/locales/zh/projects.json'
import frProjects from '../features/projects/locales/fr/projects.json'
import ruProjects from '../features/projects/locales/ru/projects.json'
import arProjects from '../features/projects/locales/ar/projects.json'

// ============ NEWS NAMESPACE ============
import enNews from '../features/news/locales/en/news.json'
import swNews from '../features/news/locales/sw/news.json'
import zhNews from '../features/news/locales/zh/news.json'
import frNews from '../features/news/locales/fr/news.json'
import ruNews from '../features/news/locales/ru/news.json'
import arNews from '../features/news/locales/ar/news.json'

const resources = {
  en: {
    common: enCommon,
    account: enAccount,
    admin: enAdmin,
    booking: enBooking,
    careers: enCareers,
    consultations: enConsultations,
    home: enHome,
    projects: enProjects,
    news: enNews // ✅ Ongeza hii
  },
  sw: {
    common: swCommon,
    account: swAccount,
    admin: swAdmin,
    booking: swBooking,
    careers: swCareers,
    consultations: swConsultations,
    home: swHome,
    projects: swProjects,
    news: swNews // ✅ Ongeza hii
  },
  zh: {
    common: zhCommon,
    account: zhAccount,
    admin: zhAdmin,
    booking: zhBooking,
    careers: zhCareers,
    consultations: zhConsultations,
    home: zhHome,
    projects: zhProjects,
    news: zhNews // ✅ Ongeza hii
  },
  fr: {
    common: frCommon,
    account: frAccount,
    admin: frAdmin,
    booking: frBooking,
    careers: frCareers,
    consultations: frConsultations,
    home: frHome,
    projects: frProjects,
    news: frNews // ✅ Ongeza hii
  },
  ru: {
    common: ruCommon,
    account: ruAccount,
    admin: ruAdmin,
    booking: ruBooking,
    careers: ruCareers,
    consultations: ruConsultations,
    home: ruHome,
    projects: ruProjects,
    news: ruNews // ✅ Ongeza hii
  },
  ar: {
    common: arCommon,
    account: arAccount,
    admin: arAdmin,
    booking: arBooking,
    careers: arCareers,
    consultations: arConsultations,
    home: arHome,
    projects: arProjects,
    news: arNews // ✅ Ongeza hii
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    fallbackNS: 'common',
    load: 'languageOnly',
    detection: {
      order: ['localStorage', 'cookie', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'language',
      cookieMinutes: 10080,
    },
    ns: ['common', 'account', 'admin', 'booking', 'careers', 'consultations', 'home', 'projects', 'news'], // ✅ Ongeza 'news'
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    parseMissingKeyHandler: (key) => {
      console.warn(`🔍 Missing translation key: ${key}`)
      return key
    },
    saveMissing: process.env.NODE_ENV === 'development',
    saveMissingTo: 'all',
  })

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng)
  document.documentElement.lang = lng
  
  if (lng === 'ar') {
    document.documentElement.dir = 'rtl'
    document.documentElement.classList.add('rtl')
    document.documentElement.classList.remove('ltr')
  } else {
    document.documentElement.dir = 'ltr'
    document.documentElement.classList.add('ltr')
    document.documentElement.classList.remove('rtl')
  }
  
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lng } }))
})

const initialLanguage = localStorage.getItem('language') || 'en'
if (initialLanguage !== i18n.language) {
  i18n.changeLanguage(initialLanguage)
}

console.log(`🌐 i18n initialized with language: ${i18n.language}`)

export default i18n