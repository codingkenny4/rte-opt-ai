import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <View className="flex-row items-center bg-slate-900/90 border border-slate-800 rounded-full p-1.5 self-center shadow-lg">
      <TouchableOpacity
        onPress={() => changeLanguage('en')}
        activeOpacity={0.7}
        className={`px-4 py-2 rounded-full min-h-[44] min-w-[70] items-center justify-center ${
          currentLang.startsWith('en')
            ? 'bg-brand-indigo shadow'
            : 'bg-transparent'
        }`}
        style={{ minWidth: 70, minHeight: 44 }}
        accessibilityLabel="Switch to English"
        accessibilityRole="button"
      >
        <Text
          className={`font-semibold text-sm ${
            currentLang.startsWith('en') ? 'text-white' : 'text-slate-400'
          }`}
        >
          EN
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => changeLanguage('ko')}
        activeOpacity={0.7}
        className={`px-4 py-2 rounded-full min-h-[44] min-w-[70] items-center justify-center ${
          currentLang.startsWith('ko')
            ? 'bg-brand-indigo shadow'
            : 'bg-transparent'
        }`}
        style={{ minWidth: 70, minHeight: 44 }}
        accessibilityLabel="한국어로 변경"
        accessibilityRole="button"
      >
        <Text
          className={`font-semibold text-sm ${
            currentLang.startsWith('ko') ? 'text-white' : 'text-slate-400'
          }`}
        >
          KO
        </Text>
      </TouchableOpacity>
    </View>
  );
};
