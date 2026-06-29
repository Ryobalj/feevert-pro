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

// ============ NOTIFICATIONS NAMESPACE ============
import enNotifications from '../features/notifications/locales/en/notifications.json'
import swNotifications from '../features/notifications/locales/sw/notifications.json'
import zhNotifications from '../features/notifications/locales/zh/notifications.json'
import frNotifications from '../features/notifications/locales/fr/notifications.json'
import ruNotifications from '../features/notifications/locales/ru/notifications.json'
import arNotifications from '../features/notifications/locales/ar/notifications.json'

// ============ PAYMENTS NAMESPACE ============
import enPayments from '../features/payments/locales/en/payments.json'
import swPayments from '../features/payments/locales/sw/payments.json'
import zhPayments from '../features/payments/locales/zh/payments.json'
import frPayments from '../features/payments/locales/fr/payments.json'
import ruPayments from '../features/payments/locales/ru/payments.json'
import arPayments from '../features/payments/locales/ar/payments.json'

// ============ REALTIME NAMESPACE ============
import enRealtime from '../features/realtime/locales/en/realtime.json'
import swRealtime from '../features/realtime/locales/sw/realtime.json'
import zhRealtime from '../features/realtime/locales/zh/realtime.json'
import frRealtime from '../features/realtime/locales/fr/realtime.json'
import ruRealtime from '../features/realtime/locales/ru/realtime.json'
import arRealtime from '../features/realtime/locales/ar/realtime.json'

// ============ REVIEWS NAMESPACE ============
import enReviews from '../features/reviews/locales/en/reviews.json'
import swReviews from '../features/reviews/locales/sw/reviews.json'
import zhReviews from '../features/reviews/locales/zh/reviews.json'
import frReviews from '../features/reviews/locales/fr/reviews.json'
import ruReviews from '../features/reviews/locales/ru/reviews.json'
import arReviews from '../features/reviews/locales/ar/reviews.json'

// ============ SHOP NAMESPACE ============
import enShop from '../features/shop/locales/en/shop.json'
import swShop from '../features/shop/locales/sw/shop.json'
import zhShop from '../features/shop/locales/zh/shop.json'
import frShop from '../features/shop/locales/fr/shop.json'
import ruShop from '../features/shop/locales/ru/shop.json'
import arShop from '../features/shop/locales/ar/shop.json'

// ============ TEAM NAMESPACE ============
import enTeam from '../features/team/locales/en/team.json'
import swTeam from '../features/team/locales/sw/team.json'
import zhTeam from '../features/team/locales/zh/team.json'
import frTeam from '../features/team/locales/fr/team.json'
import ruTeam from '../features/team/locales/ru/team.json'
import arTeam from '../features/team/locales/ar/team.json'

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
    news: enNews,
    notifications: enNotifications,
    payments: enPayments,
    realtime: enRealtime,
    reviews: enReviews,
    shop: enShop,
    team: enTeam // ✅ Ongeza hii
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
    news: swNews,
    notifications: swNotifications,
    payments: swPayments,
    realtime: swRealtime,
    reviews: swReviews,
    shop: swShop,
    team: swTeam // ✅ Ongeza hii
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
    news: zhNews,
    notifications: zhNotifications,
    payments: zhPayments,
    realtime: zhRealtime,
    reviews: zhReviews,
    shop: zhShop,
    team: zhTeam // ✅ Ongeza hii
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
    news: frNews,
    notifications: frNotifications,
    payments: frPayments,
    realtime: frRealtime,
    reviews: frReviews,
    shop: frShop,
    team: frTeam // ✅ Ongeza hii
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
    news: ruNews,
    notifications: ruNotifications,
    payments: ruPayments,
    realtime: ruRealtime,
    reviews: ruReviews,
    shop: ruShop,
    team: ruTeam // ✅ Ongeza hii
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
    news: arNews,
    notifications: arNotifications,
    payments: arPayments,
    realtime: arRealtime,
    reviews: arReviews,
    shop: arShop,
    team: arTeam // ✅ Ongeza hii
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
    ns: ['common', 'account', 'admin', 'booking', 'careers', 'consultations', 'home', 'projects', 'news', 'notifications', 'payments', 'realtime', 'reviews', 'shop', 'team'], // ✅ Ongeza 'team'
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