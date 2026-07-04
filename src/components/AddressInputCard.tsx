import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SavedAddressList } from '@/components/SavedAddressList';

interface AddressInputCardProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onResolve: () => Promise<void> | void;
  resolved: boolean;
  placeholder: string;
  accentColor?: 'green' | 'red' | 'indigo';
  showSavedAddresses?: boolean;
  savedAddresses?: string[];
  onSelectSavedAddress?: (address: string) => void;
  onRemoveSavedAddress?: (address: string) => void;
  headerRight?: React.ReactNode;
}

export const AddressInputCard: React.FC<AddressInputCardProps> = ({
  label,
  value,
  onChangeText,
  onResolve,
  resolved,
  placeholder,
  accentColor = 'indigo',
  showSavedAddresses = false,
  savedAddresses = [],
  onSelectSavedAddress,
  onRemoveSavedAddress,
  headerRight,
}) => {
  const { t } = useTranslation();

  const accentClasses = {
    green: 'text-brand-emerald',
    red: 'text-red-500',
    indigo: 'text-brand-indigo',
  } as const;

  return (
    <View className="mb-4">
      <View className="flex-row justify-between items-center mb-1.5">
        <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider">
          {label}
        </Text>
        <View className="flex-row items-center">
          {resolved && (
            <Text className={`text-xs font-medium mr-2 ${accentClasses[accentColor]}`}>✓ Resolved</Text>
          )}
          {headerRight}
        </View>
      </View>
      <View className="flex-row items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-1">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#475569"
          className="flex-1 text-white text-sm py-2"
          onBlur={() => onResolve()}
        />
        <TouchableOpacity
          onPress={() => onResolve()}
          className="bg-brand-indigo/10 active:bg-brand-indigo/20 px-3 py-1.5 rounded-lg min-h-[44] items-center justify-center ml-2"
          style={{ minHeight: 44 }}
          accessibilityLabel={t('enterAddress')}
        >
          <Text className="text-brand-indigo text-xs font-bold">🔍</Text>
        </TouchableOpacity>
      </View>

      {showSavedAddresses && !!savedAddresses.length && (
        <SavedAddressList
          title={t('savedAddresses')}
          addresses={savedAddresses}
          onSelect={onSelectSavedAddress || (() => undefined)}
          onRemove={onRemoveSavedAddress || (() => undefined)}
          emptyText={t('savedAddresses')}
        />
      )}
    </View>
  );
};
