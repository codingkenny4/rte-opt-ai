import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

interface SavedAddressListProps {
  title: string;
  addresses: string[];
  onSelect: (address: string) => void;
  onRemove: (address: string) => void;
  emptyText: string;
}

export const SavedAddressList: React.FC<SavedAddressListProps> = ({
  title,
  addresses,
  onSelect,
  onRemove,
  emptyText,
}) => {
  if (!addresses.length) {
    return null;
  }

  return (
    <View className="mt-2">
      <Text className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-2">
        {title}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row flex-wrap">
          {addresses.map((address) => (
            <View
              key={address}
              className="mr-2 mb-2 rounded-full border border-slate-700 bg-slate-950/70 px-3 py-2"
            >
              <TouchableOpacity
                onPress={() => onSelect(address)}
                className="flex-row items-center"
                accessibilityRole="button"
              >
                <Text className="text-slate-300 text-xs font-medium mr-2" numberOfLines={1}>
                  {address}
                </Text>
                <Text className="text-brand-indigo text-[11px] font-semibold">Use</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
      {addresses.length > 0 && (
        <View className="flex-row flex-wrap mt-1">
          {addresses.map((address) => (
            <TouchableOpacity
              key={`${address}-remove`}
              onPress={() => onRemove(address)}
              className="mr-2 mb-2 rounded-full bg-slate-800 px-2.5 py-1"
              accessibilityRole="button"
            >
              <Text className="text-slate-400 text-[11px]">Remove</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};
