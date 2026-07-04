import { AddressInputCard } from "@/components/AddressInputCard";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface WaypointItem {
  id: string;
  address: string;
  resolved: boolean;
}

interface WaypointPanelProps {
  startAddress: string;
  setStartAddress: (val: string) => void;
  startResolved: boolean;
  onResolveStart: () => Promise<void>;

  endAddress: string;
  setEndAddress: (val: string) => void;
  endResolved: boolean;
  onResolveEnd: () => Promise<void>;

  waypoints: WaypointItem[];
  onChangeWaypointAddress: (id: string, address: string) => void;
  onResolveWaypoint: (id: string) => Promise<void>;
  onAddWaypoint: () => void;
  onRemoveWaypoint: (id: string) => void;

  onClearAll: () => void;
  onOptimize: () => void;
  isOptimizing: boolean;
  optimizeResult: { totalDistanceKm: number; totalDurationMin: number } | null;
  savedAddresses: string[];
  onSelectStartSavedAddress: (address: string) => void;
  onSelectEndSavedAddress: (address: string) => void;
  onSelectWaypointSavedAddress: (address: string) => void;
  onRemoveSavedAddress: (address: string) => void;
}

export const WaypointPanel: React.FC<WaypointPanelProps> = ({
  startAddress,
  setStartAddress,
  startResolved,
  onResolveStart,
  endAddress,
  setEndAddress,
  endResolved,
  onResolveEnd,
  waypoints,
  onChangeWaypointAddress,
  onResolveWaypoint,
  onAddWaypoint,
  onRemoveWaypoint,
  onClearAll,
  onOptimize,
  isOptimizing,
  optimizeResult,
  savedAddresses,
  onSelectStartSavedAddress,
  onSelectEndSavedAddress,
  onSelectWaypointSavedAddress,
  onRemoveSavedAddress,
}) => {
  const { t } = useTranslation();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
      className="w-full bg-slate-900 border-t border-slate-800 rounded-t-[32px] shadow-2xl overflow-hidden"
      style={{ borderTopWidth: 1, maxHeight: "82%" }}
    >
      {/* Top drag handle indicator */}
      <View className="items-center py-3">
        <View className="w-12 h-1.5 bg-slate-700 rounded-full" />
      </View>

      <ScrollView
        className="px-6 flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title & Clear Action */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-white text-lg font-bold tracking-tight">
            {t("title")}
          </Text>
          <TouchableOpacity
            onPress={onClearAll}
            className="px-3 py-1.5 rounded-lg bg-slate-800 active:bg-slate-700 min-h-[44] items-center justify-center"
            style={{ minHeight: 44 }}
            accessibilityLabel={t("clearAll")}
            accessibilityRole="button"
          >
            <Text className="text-slate-400 text-xs font-semibold">
              {t("clearAll")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Start Point Input */}
        <AddressInputCard
          label={`🟢 ${t("startPoint")}`}
          value={startAddress}
          onChangeText={setStartAddress}
          onResolve={onResolveStart}
          resolved={startResolved}
          placeholder={t("enterStartPoint")}
          accentColor="green"
          savedAddresses={savedAddresses}
          showSavedAddresses
          onSelectSavedAddress={onSelectStartSavedAddress}
          onRemoveSavedAddress={onRemoveSavedAddress}
        />

        {/* Dynamic Waypoints list */}
        {waypoints.map((wp, idx) => (
          <View key={wp.id} className="mb-4">
            <AddressInputCard
              label={`📍 ${t("addWaypoint")} ${idx + 1}`}
              value={wp.address}
              onChangeText={(text) => onChangeWaypointAddress(wp.id, text)}
              onResolve={() => onResolveWaypoint(wp.id)}
              resolved={wp.resolved}
              placeholder={t("enterWaypoint", { index: idx + 1 })}
              accentColor="indigo"
              savedAddresses={savedAddresses}
              showSavedAddresses
              onSelectSavedAddress={(address) => {
                onSelectWaypointSavedAddress(address);
                onChangeWaypointAddress(wp.id, address);
              }}
              onRemoveSavedAddress={onRemoveSavedAddress}
              headerRight={
                <TouchableOpacity
                  onPress={() => onRemoveWaypoint(wp.id)}
                  className="bg-red-500/10 active:bg-red-500/20 px-3 py-1.5 rounded-lg min-h-[44] items-center justify-center"
                  style={{ minHeight: 44 }}
                  accessibilityLabel={`Delete Waypoint ${idx + 1}`}
                >
                  <Text className="text-red-500 text-xs font-bold">❌</Text>
                </TouchableOpacity>
              }
            />
          </View>
        ))}

        {/* Add Waypoint Button */}
        <TouchableOpacity
          onPress={onAddWaypoint}
          className="flex-row items-center justify-center border border-dashed border-slate-700 bg-slate-950/40 rounded-xl p-3 mb-4 min-h-[48]"
          style={{ minHeight: 48 }}
          accessibilityLabel={t("addWaypoint")}
          accessibilityRole="button"
        >
          <Text className="text-slate-400 font-semibold text-sm mr-2">➕</Text>
          <Text className="text-slate-300 font-semibold text-sm">
            {t("addWaypoint")}
          </Text>
        </TouchableOpacity>

        {/* End Point Input */}
        <AddressInputCard
          label={`🏁 ${t("endPoint")}`}
          value={endAddress}
          onChangeText={setEndAddress}
          onResolve={onResolveEnd}
          resolved={endResolved}
          placeholder={t("enterEndPoint")}
          accentColor="green"
          savedAddresses={savedAddresses}
          showSavedAddresses
          onSelectSavedAddress={onSelectEndSavedAddress}
          onRemoveSavedAddress={onRemoveSavedAddress}
        />

        {/* Optimize CTA Button */}
        <TouchableOpacity
          onPress={onOptimize}
          disabled={isOptimizing}
          activeOpacity={0.8}
          className={`rounded-2xl py-3.5 items-center justify-center flex-row shadow-lg min-h-[52] mb-6 ${
            isOptimizing
              ? "bg-brand-indigo/60"
              : "bg-brand-indigo active:bg-brand-indigoHover"
          }`}
          style={{ minHeight: 52 }}
          accessibilityLabel={t("optimizeRoute")}
          accessibilityRole="button"
        >
          {isOptimizing ? (
            <>
              <ActivityIndicator color="white" size="small" className="mr-3" />
              <Text className="text-white font-bold text-base">
                {t("optimizing")}
              </Text>
            </>
          ) : (
            <>
              <Text className="text-white font-bold text-base mr-2">⚡</Text>
              <Text className="text-white font-bold text-base">
                {t("optimizeRoute")}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Optimized Summary Results Panel */}
        {optimizeResult && (
          <View className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 shadow-inner">
            <Text className="text-white font-bold text-sm mb-3.5 uppercase tracking-wide border-b border-slate-800 pb-2 flex-row items-center">
              📊 {t("optimizedRoute")}
            </Text>
            <View className="flex-row justify-between mb-3">
              <Text className="text-slate-400 text-sm font-medium">
                {t("distance")}
              </Text>
              <Text className="text-brand-emerald font-bold text-base">
                {optimizeResult.totalDistanceKm.toFixed(2)} km
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-slate-400 text-sm font-medium">
                {t("duration")}
              </Text>
              <Text className="text-brand-indigo font-bold text-base">
                {optimizeResult.totalDurationMin}{" "}
                {t("translation.minutes" as any) || "mins"}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
