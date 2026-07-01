import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';

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
}) => {
  const { t } = useTranslation();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="bg-slate-900 border-t border-slate-800 rounded-t-[32px] shadow-2xl flex-1 max-h-[500] md:max-h-full"
      style={{ borderTopWidth: 1 }}
    >
      {/* Top drag handle indicator */}
      <View className="items-center py-3">
        <View className="w-12 h-1.5 bg-slate-700 rounded-full" />
      </View>

      <ScrollView 
        className="px-6 flex-1" 
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title & Clear Action */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-white text-lg font-bold tracking-tight">
            {t('title')}
          </Text>
          <TouchableOpacity
            onPress={onClearAll}
            className="px-3 py-1.5 rounded-lg bg-slate-800 active:bg-slate-700 min-h-[44] items-center justify-center"
            style={{ minHeight: 44 }}
            accessibilityLabel={t('clearAll')}
            accessibilityRole="button"
          >
            <Text className="text-slate-400 text-xs font-semibold">
              {t('clearAll')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Start Point Input */}
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-1.5">
            <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider flex-row items-center">
              🟢 {t('startPoint')}
            </Text>
            {startResolved && (
              <Text className="text-brand-emerald text-xs font-medium">✓ Resolved</Text>
            )}
          </View>
          <View className="flex-row items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-1">
            <TextInput
              value={startAddress}
              onChangeText={setStartAddress}
              placeholder={t('enterStartPoint')}
              placeholderTextColor="#475569"
              className="flex-1 text-white text-sm py-2"
              onBlur={onResolveStart}
            />
            <TouchableOpacity
              onPress={onResolveStart}
              className="bg-brand-indigo/10 active:bg-brand-indigo/20 px-3 py-1.5 rounded-lg min-h-[44] items-center justify-center ml-2"
              style={{ minHeight: 44 }}
              accessibilityLabel="Geocode Start Point"
            >
              <Text className="text-brand-indigo text-xs font-bold">🔍</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dynamic Waypoints list */}
        {waypoints.map((wp, idx) => (
          <View key={wp.id} className="mb-4">
            <View className="flex-row justify-between items-center mb-1.5">
              <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                📍 {t('addWaypoint')} {idx + 1}
              </Text>
              {wp.resolved && (
                <Text className="text-brand-emerald text-xs font-medium">✓ Resolved</Text>
              )}
            </View>
            <View className="flex-row items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-1">
              <TextInput
                value={wp.address}
                onChangeText={(text) => onChangeWaypointAddress(wp.id, text)}
                placeholder={t('enterWaypoint', { index: idx + 1 })}
                placeholderTextColor="#475569"
                className="flex-1 text-white text-sm py-2"
                onBlur={() => onResolveWaypoint(wp.id)}
              />
              <TouchableOpacity
                onPress={() => onResolveWaypoint(wp.id)}
                className="bg-brand-indigo/10 active:bg-brand-indigo/20 px-3 py-1.5 rounded-lg min-h-[44] items-center justify-center mx-1"
                style={{ minHeight: 44 }}
                accessibilityLabel={`Geocode Waypoint ${idx + 1}`}
              >
                <Text className="text-brand-indigo text-xs font-bold">🔍</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onRemoveWaypoint(wp.id)}
                className="bg-red-500/10 active:bg-red-500/20 px-3 py-1.5 rounded-lg min-h-[44] items-center justify-center ml-1"
                style={{ minHeight: 44 }}
                accessibilityLabel={`Delete Waypoint ${idx + 1}`}
              >
                <Text className="text-red-500 text-xs font-bold">❌</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Add Waypoint Button */}
        <TouchableOpacity
          onPress={onAddWaypoint}
          className="flex-row items-center justify-center border border-dashed border-slate-700 bg-slate-950/40 rounded-xl p-3 mb-4 min-h-[48]"
          style={{ minHeight: 48 }}
          accessibilityLabel={t('addWaypoint')}
          accessibilityRole="button"
        >
          <Text className="text-slate-400 font-semibold text-sm mr-2">➕</Text>
          <Text className="text-slate-300 font-semibold text-sm">
            {t('addWaypoint')}
          </Text>
        </TouchableOpacity>

        {/* End Point Input */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-1.5">
            <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider">
              🏁 {t('endPoint')}
            </Text>
            {endResolved && (
              <Text className="text-brand-emerald text-xs font-medium">✓ Resolved</Text>
            )}
          </View>
          <View className="flex-row items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-1">
            <TextInput
              value={endAddress}
              onChangeText={setEndAddress}
              placeholder={t('enterEndPoint')}
              placeholderTextColor="#475569"
              className="flex-1 text-white text-sm py-2"
              onBlur={onResolveEnd}
            />
            <TouchableOpacity
              onPress={onResolveEnd}
              className="bg-brand-indigo/10 active:bg-brand-indigo/20 px-3 py-1.5 rounded-lg min-h-[44] items-center justify-center ml-2"
              style={{ minHeight: 44 }}
              accessibilityLabel="Geocode End Point"
            >
              <Text className="text-brand-indigo text-xs font-bold">🔍</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Optimize CTA Button */}
        <TouchableOpacity
          onPress={onOptimize}
          disabled={isOptimizing}
          activeOpacity={0.8}
          className={`rounded-2xl py-3.5 items-center justify-center flex-row shadow-lg min-h-[52] mb-6 ${
            isOptimizing ? 'bg-brand-indigo/60' : 'bg-brand-indigo active:bg-brand-indigoHover'
          }`}
          style={{ minHeight: 52 }}
          accessibilityLabel={t('optimizeRoute')}
          accessibilityRole="button"
        >
          {isOptimizing ? (
            <>
              <ActivityIndicator color="white" size="small" className="mr-3" />
              <Text className="text-white font-bold text-base">
                {t('optimizing')}
              </Text>
            </>
          ) : (
            <>
              <Text className="text-white font-bold text-base mr-2">⚡</Text>
              <Text className="text-white font-bold text-base">
                {t('optimizeRoute')}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Optimized Summary Results Panel */}
        {optimizeResult && (
          <View className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 shadow-inner">
            <Text className="text-white font-bold text-sm mb-3.5 uppercase tracking-wide border-b border-slate-800 pb-2 flex-row items-center">
              📊 {t('optimizedRoute')}
            </Text>
            <View className="flex-row justify-between mb-3">
              <Text className="text-slate-400 text-sm font-medium">{t('distance')}</Text>
              <Text className="text-brand-emerald font-bold text-base">
                {optimizeResult.totalDistanceKm.toFixed(2)} km
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-slate-400 text-sm font-medium">{t('duration')}</Text>
              <Text className="text-brand-indigo font-bold text-base">
                {optimizeResult.totalDurationMin} {t('translation.minutes' as any) || 'mins'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
