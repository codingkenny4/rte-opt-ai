import { SavedAddressList } from "@/components/SavedAddressList";
import {
    PlaceSuggestion,
    searchPlaceSuggestions,
} from "@/services/tmapService";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

interface AddressInputCardProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onResolve: () => Promise<void> | void;
  resolved: boolean;
  placeholder: string;
  accentColor?: "green" | "red" | "indigo";
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
  accentColor = "indigo",
  showSavedAddresses = false,
  savedAddresses = [],
  onSelectSavedAddress,
  onRemoveSavedAddress,
  headerRight,
}) => {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const accentClasses = {
    green: "text-brand-emerald",
    red: "text-red-500",
    indigo: "text-brand-indigo",
  } as const;

  useEffect(() => {
    if (!value?.trim()) {
      setSuggestions([]);
      setIsSearching(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      return;
    }

    if (value.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      const query = value.trim();
      const currentRequestId = ++requestIdRef.current;
      setIsSearching(true);

      try {
        const results = await searchPlaceSuggestions(query, 5);
        if (currentRequestId === requestIdRef.current) {
          setSuggestions(results);
        }
      } catch (error) {
        if (currentRequestId === requestIdRef.current) {
          setSuggestions([]);
        }
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setIsSearching(false);
        }
      }
    }, 250);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [value]);

  const handleSelectSuggestion = (suggestion: PlaceSuggestion) => {
    const selectedText = suggestion.address || suggestion.name;
    setSuggestions([]);
    setIsSearching(false);
    onChangeText(selectedText);
    setTimeout(() => onResolve(), 0);
  };

  return (
    <View className="mb-4">
      <View className="flex-row justify-between items-center mb-1.5">
        <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider">
          {label}
        </Text>
        <View className="flex-row items-center">
          {resolved && (
            <Text
              className={`text-xs font-medium mr-2 ${accentClasses[accentColor]}`}
            >
              ✓ Resolved
            </Text>
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
          accessibilityLabel={t("enterAddress")}
        >
          <Text className="text-brand-indigo text-xs font-bold">🔍</Text>
        </TouchableOpacity>
      </View>

      {suggestions.length > 0 && (
        <View className="mt-2 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
          {suggestions.map((suggestion) => (
            <TouchableOpacity
              key={`${suggestion.name}-${suggestion.address}`}
              onPress={() => handleSelectSuggestion(suggestion)}
              className="px-3 py-3 border-b border-slate-800 last:border-b-0"
            >
              <Text className="text-white text-sm font-semibold">
                {suggestion.name}
              </Text>
              <Text className="text-slate-400 text-xs mt-1">
                {suggestion.address}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!suggestions.length && isSearching && (
        <View className="mt-2 px-3 py-2 rounded-xl border border-slate-800 bg-slate-950">
          <Text className="text-slate-400 text-xs">Searching…</Text>
        </View>
      )}

      {showSavedAddresses && !!savedAddresses.length && (
        <SavedAddressList
          title={t("savedAddresses")}
          addresses={savedAddresses}
          onSelect={onSelectSavedAddress || (() => undefined)}
          onRemove={onRemoveSavedAddress || (() => undefined)}
          emptyText={t("savedAddresses")}
        />
      )}
    </View>
  );
};
