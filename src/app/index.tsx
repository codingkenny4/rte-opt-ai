import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { MapViewport } from "@/components/MapViewport";
import { WaypointPanel } from "@/components/WaypointPanel";
import {
  geocodeAddress,
  optimizeRoute,
  Waypoint,
} from "@/services/tmapService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Platform, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface WaypointItem {
  id: string;
  address: string;
  resolved: boolean;
  latitude: number;
  longitude: number;
}

const SAVED_ADDRESSES_KEY = "route-optimization:saved-addresses";

export default function HomeScreen() {
  const { t } = useTranslation();

  // Address text inputs
  const [startAddress, setStartAddress] = useState("");
  const [endAddress, setEndAddress] = useState("");
  const [waypoints, setWaypoints] = useState<WaypointItem[]>([]);

  // Coordinate states
  const [startCoords, setStartCoords] = useState<{
    name: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  const [endCoords, setEndCoords] = useState<{
    name: string;
    latitude: number;
    longitude: number;
  } | null>(null);

  // Resolve indicators
  const [startResolved, setStartResolved] = useState(false);
  const [endResolved, setEndResolved] = useState(false);

  // Route drawing & optimization details
  const [polylineCoords, setPolylineCoords] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeResult, setOptimizeResult] = useState<{
    totalDistanceKm: number;
    totalDurationMin: number;
  } | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<string[]>([]);
  const [savedWaypoints, setSavedWaypoints] = useState<Waypoint[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);

  useEffect(() => {
    const loadSavedAddresses = async () => {
      try {
        const stored = await AsyncStorage.getItem(SAVED_ADDRESSES_KEY);
        if (!stored) return;

        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSavedAddresses(
            parsed.filter(
              (item): item is string =>
                typeof item === "string" && item.trim().length > 0,
            ),
          );
        }
      } catch (error) {
        console.warn("Failed to load saved addresses", error);
      }
    };

    loadSavedAddresses();
  }, []);

  useEffect(() => {
    const loadCurrentLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.warn("Failed to load current location", error);
      }
    };

    loadCurrentLocation();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadSavedWaypointCoords = async () => {
      if (!savedAddresses.length) {
        setSavedWaypoints([]);
        return;
      }

      const waypointPromises = savedAddresses.map(async (address, index) => {
        try {
          const result = await geocodeAddress(address);
          return {
            id: `saved-${index}-${address}`,
            name: result.address || address,
            address,
            latitude: result.latitude,
            longitude: result.longitude,
          } as Waypoint;
        } catch {
          return null;
        }
      });

      const results = await Promise.all(waypointPromises);
      if (isMounted) {
        setSavedWaypoints(results.filter((item): item is Waypoint => !!item));
      }
    };

    loadSavedWaypointCoords();

    return () => {
      isMounted = false;
    };
  }, [savedAddresses]);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") {
      alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const persistSavedAddresses = async (nextAddresses: string[]) => {
    try {
      await AsyncStorage.setItem(
        SAVED_ADDRESSES_KEY,
        JSON.stringify(nextAddresses),
      );
    } catch (error) {
      console.warn("Failed to save addresses", error);
    }
  };

  const addSavedAddress = (address: string) => {
    const normalized = address.trim();
    if (!normalized) return;

    setSavedAddresses((prev) => {
      const next = [
        normalized,
        ...prev.filter(
          (item) => item.toLowerCase() !== normalized.toLowerCase(),
        ),
      ].slice(0, 8);
      persistSavedAddresses(next);
      return next;
    });
  };

  const removeSavedAddress = (address: string) => {
    setSavedAddresses((prev) => {
      const next = prev.filter((item) => item !== address);
      persistSavedAddresses(next);
      return next;
    });
  };

  // Resolve Start Point coordinates
  const handleResolveStart = async () => {
    const normalizedAddress = startAddress.trim();
    if (!normalizedAddress) return;

    addSavedAddress(normalizedAddress);

    try {
      const res = await geocodeAddress(normalizedAddress);
      setStartCoords({
        name: res.address,
        latitude: res.latitude,
        longitude: res.longitude,
      });
      setStartResolved(true);
    } catch (error: any) {
      setStartResolved(false);
      showAlert(t("title"), `${t("geocodeError")}: ${error.message}`);
    }
  };

  // Resolve End Point coordinates
  const handleResolveEnd = async () => {
    const normalizedAddress = endAddress.trim();
    if (!normalizedAddress) return;

    addSavedAddress(normalizedAddress);

    try {
      const res = await geocodeAddress(normalizedAddress);
      setEndCoords({
        name: res.address,
        latitude: res.latitude,
        longitude: res.longitude,
      });
      setEndResolved(true);
    } catch (error: any) {
      setEndResolved(false);
      showAlert(t("title"), `${t("geocodeError")}: ${error.message}`);
    }
  };

  // Resolve specific Waypoint coordinates
  const handleResolveWaypoint = async (id: string) => {
    const wp = waypoints.find((w) => w.id === id);
    const normalizedAddress = wp?.address?.trim();
    if (!wp || !normalizedAddress) return;

    addSavedAddress(normalizedAddress);

    try {
      const res = await geocodeAddress(normalizedAddress);
      setWaypoints((prev) =>
        prev.map((w) =>
          w.id === id
            ? {
                ...w,
                resolved: true,
                latitude: res.latitude,
                longitude: res.longitude,
              }
            : w,
        ),
      );
    } catch (error: any) {
      setWaypoints((prev) =>
        prev.map((w) => (w.id === id ? { ...w, resolved: false } : w)),
      );
      showAlert(t("title"), `${t("geocodeError")}: ${error.message}`);
    }
  };

  // Add new empty waypoint row
  const handleAddWaypoint = () => {
    const newId = Math.random().toString(36).substring(2, 9);
    setWaypoints((prev) => [
      ...prev,
      { id: newId, address: "", resolved: false, latitude: 0, longitude: 0 },
    ]);
  };

  const handleAddWaypointWithAddress = async (address: string) => {
    const normalized = address.trim();
    if (!normalized) return;
    addSavedAddress(normalized);

    try {
      const res = await geocodeAddress(normalized);
      const newId = Math.random().toString(36).substring(2, 9);
      const newWp: WaypointItem = {
        id: newId,
        address: normalized,
        resolved: true,
        latitude: res.latitude,
        longitude: res.longitude,
      };
      setWaypoints((prev) => [...prev, newWp]);
    } catch (error: any) {
      showAlert(t("title"), `${t("geocodeError")}: ${error.message}`);
    }
  };

  // Remove waypoint row
  const handleRemoveWaypoint = (id: string) => {
    setWaypoints((prev) => prev.filter((w) => w.id !== id));
  };

  // Change address string for specific waypoint
  const handleChangeWaypointAddress = (id: string, text: string) => {
    setWaypoints((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, address: text, resolved: false } : w,
      ),
    );
  };

  // Clear all form inputs and route drawings
  const handleClearAll = () => {
    setStartAddress("");
    setEndAddress("");
    setWaypoints([]);
    setStartCoords(null);
    setEndCoords(null);
    setStartResolved(false);
    setEndResolved(false);
    setPolylineCoords([]);
    setOptimizeResult(null);
  };

  // Trigger optimization with auto-geocoding of unresolved targets
  const handleOptimize = async () => {
    const normalizedStart = startAddress.trim();
    const normalizedEnd = endAddress.trim();

    if (!normalizedStart || !normalizedEnd) {
      showAlert(t("title"), t("minWaypointsError"));
      return;
    }

    addSavedAddress(normalizedStart);
    addSavedAddress(normalizedEnd);
    waypoints.forEach((wp) => {
      if (wp.address.trim()) {
        addSavedAddress(wp.address);
      }
    });

    setIsOptimizing(true);
    try {
      // 1. Auto-geocode start point if needed
      let currentStartCoords = startCoords;
      if (!startResolved) {
        const res = await geocodeAddress(normalizedStart);
        currentStartCoords = {
          name: res.address,
          latitude: res.latitude,
          longitude: res.longitude,
        };
        setStartCoords(currentStartCoords);
        setStartResolved(true);
      }

      // 2. Auto-geocode end point if needed
      let currentEndCoords = endCoords;
      if (!endResolved) {
        const res = await geocodeAddress(normalizedEnd);
        currentEndCoords = {
          name: res.address,
          latitude: res.latitude,
          longitude: res.longitude,
        };
        setEndCoords(currentEndCoords);
        setEndResolved(true);
      }

      // 3. Auto-geocode unresolved waypoints
      const updatedWaypoints = [...waypoints];
      for (let i = 0; i < updatedWaypoints.length; i++) {
        const wp = updatedWaypoints[i];
        if (!wp.resolved && wp.address.trim()) {
          const res = await geocodeAddress(wp.address.trim());
          updatedWaypoints[i] = {
            ...wp,
            resolved: true,
            latitude: res.latitude,
            longitude: res.longitude,
          };
        }
      }
      setWaypoints(updatedWaypoints);

      // Extract waypoints with valid coordinates
      const activeWaypoints: Waypoint[] = updatedWaypoints
        .filter((wp) => wp.resolved && wp.address.trim())
        .map((wp) => ({
          id: wp.id,
          name: wp.address,
          address: wp.address,
          latitude: wp.latitude,
          longitude: wp.longitude,
        }));

      if (!currentStartCoords || !currentEndCoords) {
        throw new Error("Coordinates missing for start or end points.");
      }

      // 4. Send payloads to Route Optimization endpoint
      const result = await optimizeRoute(
        currentStartCoords,
        currentEndCoords,
        activeWaypoints,
      );

      // Update state with results
      setPolylineCoords(result.polylineCoords);
      setOptimizeResult({
        totalDistanceKm: result.totalDistanceKm,
        totalDurationMin: result.totalDurationMin,
      });

      // 5. Rearrange waypoint rows in the UI list to match the optimized sequence
      const orderedWps: WaypointItem[] = [];
      const wpMap = new Map(updatedWaypoints.map((w) => [w.id, w]));

      for (const optId of result.optimizedWaypointIds) {
        const item = wpMap.get(optId);
        if (item) {
          orderedWps.push(item);
          wpMap.delete(optId);
        }
      }

      // Append any remaining items (empty or not matched)
      orderedWps.push(...Array.from(wpMap.values()));
      setWaypoints(orderedWps);

      showAlert(t("title"), t("optimizeSuccess"));
    } catch (error: any) {
      console.error("Optimization error:", error);
      showAlert(t("title"), `${t("optimizeError")}: ${error.message}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  const activeWaypointsList: Waypoint[] = waypoints
    .filter((wp) => wp.resolved && wp.address.trim())
    .map((wp) => ({
      id: wp.id,
      name: wp.address,
      address: wp.address,
      latitude: wp.latitude,
      longitude: wp.longitude,
    }));

  return (
    <View
      className="flex-1 min-h-screen bg-slate-950 relative"
      style={{ minHeight: "100vh" }}
    >
      {/* Background Interactive Map */}
      <View className="absolute inset-0">
        <MapViewport
          start={startCoords}
          end={endCoords}
          waypoints={activeWaypointsList}
          polylineCoords={polylineCoords}
          savedWaypoints={savedWaypoints}
          currentLocation={currentLocation}
        />
      </View>

      {/* Floating Header Area with Language Switcher */}
      <SafeAreaView className="absolute top-4 left-0 right-0 z-20 pointer-events-box-none px-6">
        <View className="flex-row justify-center mt-2">
          <LanguageSwitcher />
        </View>
      </SafeAreaView>

      {/* Bottom Sheet Control Panel Overlay */}
      {panelOpen ? (
        <View
          className="absolute bottom-0 left-0 right-0 z-10 h-[75%] md:h-[50%]"
          style={{ minHeight: 420 }}
        >
          <WaypointPanel
            startAddress={startAddress}
            setStartAddress={setStartAddress}
            startResolved={startResolved}
            onResolveStart={handleResolveStart}
            endAddress={endAddress}
            setEndAddress={setEndAddress}
            endResolved={endResolved}
            onResolveEnd={handleResolveEnd}
            waypoints={waypoints}
            onChangeWaypointAddress={handleChangeWaypointAddress}
            onResolveWaypoint={handleResolveWaypoint}
            onAddWaypoint={handleAddWaypoint}
            onRemoveWaypoint={handleRemoveWaypoint}
            onAddWaypointWithAddress={handleAddWaypointWithAddress}
            onClearAll={handleClearAll}
            onOptimize={handleOptimize}
            isOptimizing={isOptimizing}
            optimizeResult={optimizeResult}
            savedAddresses={savedAddresses}
            onSelectStartSavedAddress={(address) => setStartAddress(address)}
            onSelectEndSavedAddress={(address) => setEndAddress(address)}
            onSelectWaypointSavedAddress={() => undefined}
            onRemoveSavedAddress={removeSavedAddress}
            onClosePanel={() => setPanelOpen(false)}
          />
        </View>
      ) : (
        <SafeAreaView
          style={{
            position: "absolute",
            bottom: 24,
            left: 0,
            right: 0,
            alignItems: "center",
            zIndex: 30,
          }}
        >
          <TouchableOpacity
            onPress={() => setPanelOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Show panel"
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: "#6366f1",
              alignItems: "center",
              justifyContent: "center",
              elevation: 6,
            }}
          >
            <Text style={{ color: "white", fontWeight: "700" }}>▲</Text>
          </TouchableOpacity>
        </SafeAreaView>
      )}
    </View>
  );
}
