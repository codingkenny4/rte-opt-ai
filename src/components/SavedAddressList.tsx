import { SavedAddress } from "@/types/savedAddress";
import React, { useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

interface SavedAddressListProps {
  title: string;
  addresses: SavedAddress[];
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const uniqueCategories = useMemo(() => {
    const categories = new Set(addresses.map((addr) => addr.category));
    return Array.from(categories).sort();
  }, [addresses]);

  const filteredAddresses = useMemo(() => {
    if (!selectedCategory) return addresses;
    return addresses.filter((addr) => addr.category === selectedCategory);
  }, [addresses, selectedCategory]);

  if (!addresses.length) {
    return null;
  }

  return (
    <View className="mt-2">
      <Text className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-2">
        {title}
      </Text>

      {/* Category Filter Pills */}
      {uniqueCategories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-2"
        >
          <View className="flex-row">
            <TouchableOpacity
              onPress={() => setSelectedCategory(null)}
              className={`mr-2 px-3 py-1 rounded-full ${
                selectedCategory === null
                  ? "bg-brand-indigo"
                  : "bg-slate-800/50 border border-slate-700"
              }`}
              accessibilityRole="button"
            >
              <Text
                className={`text-xs font-semibold ${
                  selectedCategory === null
                    ? "text-white"
                    : "text-slate-400"
                }`}
              >
                All
              </Text>
            </TouchableOpacity>

            {uniqueCategories.map((category) => (
              <TouchableOpacity
                key={category}
                onPress={() => setSelectedCategory(category)}
                className={`mr-2 px-3 py-1 rounded-full ${
                  selectedCategory === category
                    ? "bg-brand-indigo"
                    : "bg-slate-800/50 border border-slate-700"
                }`}
                accessibilityRole="button"
              >
                <Text
                  className={`text-xs font-semibold ${
                    selectedCategory === category
                      ? "text-white"
                      : "text-slate-400"
                  }`}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Addresses List */}
      {filteredAddresses.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row">
            {filteredAddresses.map((item) => (
              <View
                key={`${item.address}-${item.category}`}
                className="mr-2 mb-2 rounded-full border border-slate-700 bg-slate-950/70 px-3 py-2 flex-row items-center max-w-xs"
              >
                {/* Category Badge */}
                <View className="bg-slate-800/80 rounded-full px-2 py-0.5 mr-2">
                  <Text className="text-slate-300 text-[9px] font-semibold">
                    {item.category}
                  </Text>
                </View>

                {/* Address Text */}
                <Text
                  className="text-slate-300 text-xs font-medium mr-3 truncate flex-shrink"
                  numberOfLines={1}
                  style={{ maxWidth: 120 }}
                >
                  {item.address}
                </Text>

                {/* Use Button */}
                <TouchableOpacity
                  onPress={() => onSelect(item.address)}
                  className="px-2 py-1 rounded-full"
                  accessibilityRole="button"
                >
                  <Text className="text-brand-indigo text-[11px] font-semibold">
                    Use
                  </Text>
                </TouchableOpacity>

                {/* Remove Button */}
                <TouchableOpacity
                  onPress={() => onRemove(item.address)}
                  className="ml-2 px-2 py-1 rounded-full bg-slate-800"
                  accessibilityRole="button"
                >
                  <Text className="text-slate-400 text-[11px]">Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <Text className="text-slate-500 text-xs">{emptyText}</Text>
      )}
    </View>
  );
};
