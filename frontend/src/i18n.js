import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      nav: {
        home: 'Home',
        about: 'About',
        services: 'Services',
        projects: 'Projects',
        team: 'Team',
        careers: 'Careers',
        news: 'News',
        contact: 'Contact'
      },
      language: 'English'
    }
  },
  sw: {
    translation: {
      nav: {
        home: 'Nyumbani',
        about: 'Kuhusu',
        services: 'Huduma',
        projects: 'Miradi',
        team: 'Timu',
        careers: 'Kazi',
        news: 'Habari',
        contact: 'Wasiliana'
      },
      language: 'Kiswahili'
    }
  }
}

const savedLang = localStorage.getItem('language') || 'en'

i18n.use(initReactI18next).init({
  resources,
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
})

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng)
  document.documentElement.lang = lng
})

export default i18n
