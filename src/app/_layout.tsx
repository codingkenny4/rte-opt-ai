import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import '../global.css';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from '../locales/en.json';
import ko from '../locales/ko.json';

// Initialize translations
const resources = {
  en: en,
  ko: ko,
};

const systemLocale = Localization.getLocales()?.[0]?.languageCode ?? 'en';
const defaultLang = resources.hasOwnProperty(systemLocale) ? systemLocale : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: defaultLang,
    fallbackLng: 'en',
    compatibilityJSON: 'v4',
    interpolation: {
      escapeValue: false,
    },
  });

export default function RootLayout() {
  return (
    <View className="flex-1 bg-slate-950">
      <StatusBar style="light" />
      <Slot />
    </View>
  );
}
