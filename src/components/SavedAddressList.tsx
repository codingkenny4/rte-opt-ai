import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

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
        <View className="flex-row">
          {addresses.map((address) => (
            <View
              key={address}
              className="mr-2 mb-2 rounded-full border border-slate-700 bg-slate-950/70 px-3 py-2 flex-row items-center max-w-xs"
            >
              <Text
                className="text-slate-300 text-xs font-medium mr-3 truncate"
                numberOfLines={1}
                style={{ maxWidth: 160 }}
              >
                {address}
              </Text>

              <TouchableOpacity
                onPress={() => onSelect(address)}
                className="px-2 py-1 rounded-full"
                accessibilityRole="button"
              >
                <Text className="text-brand-indigo text-[11px] font-semibold">
                  Use
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onRemove(address)}
                className="ml-2 px-2 py-1 rounded-full bg-slate-800"
                accessibilityRole="button"
              >
                <Text className="text-slate-400 text-[11px]">Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};
