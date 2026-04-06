import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from './en'

const NAMESPACE = 'lexicalEditor'

export function initI18n(resources?: Record<string, Record<string, string>>) {
  if (i18n.isInitialized) return i18n

  i18n.use(initReactI18next).init({
    resources: {
      en: { [NAMESPACE]: en },
      ...Object.fromEntries(
        Object.entries(resources ?? {}).map(([lng, translations]) => [
          lng,
          { [NAMESPACE]: translations },
        ]),
      ),
    },
    lng: 'en',
    fallbackLng: 'en',
    ns: [NAMESPACE],
    defaultNS: NAMESPACE,
    interpolation: { escapeValue: false },
    initImmediate: false,
  })

  return i18n
}

// Ensure i18n is initialized with defaults at module load time
// so useTranslation() always has a valid t() function
initI18n()
