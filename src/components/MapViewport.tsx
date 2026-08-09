import React, { useEffect, useRef } from "react";
import { Platform, Text, View } from "react-native";
import { Waypoint } from "../services/tmapService";

let MapView: any;
let Marker: any;
let Polyline: any;

// Dynamically import react-native-maps only on native platforms
if (Platform.OS !== "web") {
  const MapModule = require("react-native-maps");
  MapView = MapModule.default;
  Marker = MapModule.Marker;
  Polyline = MapModule.Polyline;
}

interface MapViewportProps {
  start: { name: string; latitude: number; longitude: number } | null;
  end: { name: string; latitude: number; longitude: number } | null;
  waypoints: Waypoint[];
  savedWaypoints: Waypoint[];
  currentLocation: { latitude: number; longitude: number } | null;
  polylineCoords: { latitude: number; longitude: number }[];
}

// Center of Seoul, South Korea as a sensible default
const DEFAULT_REGION = {
  latitude: 37.5665,
  longitude: 126.978,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export const MapViewport: React.FC<MapViewportProps> = ({
  start,
  end,
  waypoints,
  savedWaypoints,
  currentLocation,
  polylineCoords,
}) => {
  const mapRef = useRef<any>(null);

  // Combine all active locations to calculate bounds
  const allCoords = [
    ...(start
      ? [{ latitude: start.latitude, longitude: start.longitude }]
      : []),
    ...(end ? [{ latitude: end.latitude, longitude: end.longitude }] : []),
    ...waypoints.map((wp) => ({
      latitude: wp.latitude,
      longitude: wp.longitude,
    })),
    ...savedWaypoints.map((wp) => ({
      latitude: wp.latitude,
      longitude: wp.longitude,
    })),
    ...(currentLocation
      ? [
          {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          },
        ]
      : []),
  ];

  useEffect(() => {
    if (Platform.OS !== "web" && mapRef.current && allCoords.length > 0) {
      // Only refit map when coordinates actually change to avoid
      // re-centering when unrelated UI toggles (like opening/closing panels).
      try {
        const coordsKey = allCoords
          .map((c) => `${c.latitude.toFixed(6)},${c.longitude.toFixed(6)}`)
          .join("|");

        if (mapRef.current.__lastCoordsKey !== coordsKey) {
          mapRef.current.__lastCoordsKey = coordsKey;
          // Small timeout to allow map rendering to settle
          setTimeout(() => {
            try {
              mapRef.current.fitToCoordinates(allCoords, {
                edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
                animated: true,
              });
            } catch (err) {
              // ignore map fit errors during transient mounts
            }
          }, 500);
        }
      } catch (err) {
        // defensive: do nothing on any failure
      }
    }
  }, [start, end, waypoints, savedWaypoints, currentLocation, polylineCoords]);

  // Web representation (Mock Interactive Dashboard map)
  if (Platform.OS === "web") {
    return (
      <View className="flex-1 bg-slate-900 justify-center items-center relative overflow-hidden">
        {/* Abstract background grid to look high-tech */}
        <View className="absolute inset-0 opacity-10 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Inner dashboard layout */}
        <View className="p-6 bg-slate-950/80 border border-slate-800 rounded-3xl max-w-md w-11/12 items-center shadow-2xl z-10">
          <Text className="text-brand-indigo font-bold text-lg mb-2 tracking-wider">
            TMAP ENGINE SIMULATOR
          </Text>
          <Text className="text-slate-400 text-xs text-center mb-6">
            Running in Web Mode. Interactive map features render natively on iOS
            and Android devices.
          </Text>

          {/* Active Points Status inside the mock map */}
          <View className="w-full space-y-3 mb-4">
            <View className="flex-row items-center bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
              <View className="w-3 h-3 rounded-full bg-brand-emerald mr-3" />
              <View className="flex-1">
                <Text className="text-slate-300 font-medium text-xs">
                  Start Point
                </Text>
                <Text
                  className="text-white text-sm font-semibold truncate"
                  numberOfLines={1}
                >
                  {start
                    ? `${start.name} (${start.latitude.toFixed(
                        4,
                      )}, ${start.longitude.toFixed(4)})`
                    : "Not Set"}
                </Text>
              </View>
            </View>

            {waypoints.length > 0 && (
              <View className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
                <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1.5">
                  Waypoints ({waypoints.length})
                </Text>
                {waypoints.map((wp, idx) => (
                  <View
                    key={wp.id}
                    className="flex-row items-center py-1 border-t border-slate-800/30"
                  >
                    <View className="w-4 h-4 rounded-full bg-slate-700 items-center justify-center mr-2">
                      <Text className="text-white text-[9px] font-bold">
                        {idx + 1}
                      </Text>
                    </View>
                    <Text
                      className="text-slate-300 text-xs truncate flex-1"
                      numberOfLines={1}
                    >
                      {wp.address}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View className="flex-row items-center bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
              <View className="w-3 h-3 rounded-full bg-brand-indigo mr-3" />
              <View className="flex-1">
                <Text className="text-slate-300 font-medium text-xs">
                  End Point
                </Text>
                <Text
                  className="text-white text-sm font-semibold truncate"
                  numberOfLines={1}
                >
                  {end
                    ? `${end.name} (${end.latitude.toFixed(
                        4,
                      )}, ${end.longitude.toFixed(4)})`
                    : "Not Set"}
                </Text>
              </View>
            </View>
          </View>

          {currentLocation && (
            <View className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl p-4 mb-4">
              <Text className="text-brand-emerald font-bold text-xs uppercase tracking-wide mb-1">
                Current Location
              </Text>
              <Text className="text-slate-300 text-[11px]">
                {currentLocation.latitude.toFixed(5)},{" "}
                {currentLocation.longitude.toFixed(5)}
              </Text>
            </View>
          )}

          {savedWaypoints.length > 0 && (
            <View className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl p-4 mb-4">
              <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wide mb-2">
                Saved Waypoints ({savedWaypoints.length})
              </Text>
              {savedWaypoints.map((wp, idx) => (
                <View
                  key={wp.id}
                  className="flex-row items-center py-1 border-t border-slate-800/30 first:border-t-0"
                >
                  <Text className="text-brand-indigo text-[11px] font-semibold mr-2">
                    {idx + 1}.
                  </Text>
                  <Text className="text-slate-300 text-[11px] truncate flex-1">
                    {wp.name}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Polyline details */}
          {polylineCoords.length > 0 ? (
            <View className="w-full bg-brand-indigo/10 border border-brand-indigo/30 p-3 rounded-xl items-center">
              <Text className="text-brand-indigo font-bold text-xs">
                ✔ ROUTE POLYLINE CONNECTED
              </Text>
              <Text className="text-slate-300 text-[10px] mt-1">
                Parsed {polylineCoords.length} geo-coordinates successfully.
              </Text>
            </View>
          ) : (
            <View className="w-full bg-slate-900/30 border border-slate-800/50 p-3 rounded-xl items-center">
              <Text className="text-slate-500 font-semibold text-xs">
                No active route polyline drawn yet
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  // Native rendering
  return (
    <MapView
      ref={mapRef}
      className="flex-1 w-full h-full"
      style={{ flex: 1 }}
      initialRegion={DEFAULT_REGION}
      userInterfaceStyle="dark"
      customMapStyle={darkMapStyle}
    >
      {/* Start Point Marker */}
      {start && (
        <Marker
          coordinate={{ latitude: start.latitude, longitude: start.longitude }}
          title="Start"
          description={start.name}
          pinColor="#10b981" // Emerald
        />
      )}

      {/* Waypoint Markers */}
      {waypoints.map((wp, idx) => (
        <Marker
          key={wp.id}
          coordinate={{ latitude: wp.latitude, longitude: wp.longitude }}
          title={`Stop ${idx + 1}`}
          description={wp.address}
          pinColor="#6366f1" // Indigo
        />
      ))}

      {/* End Point Marker */}
      {end && (
        <Marker
          coordinate={{ latitude: end.latitude, longitude: end.longitude }}
          title="End"
          description={end.name}
          pinColor="#ef4444" // Danger/Red
        />
      )}

      {/* Saved Waypoint Markers */}
      {savedWaypoints.map((wp) => (
        <Marker
          key={wp.id}
          coordinate={{ latitude: wp.latitude, longitude: wp.longitude }}
          title={wp.name}
          description={wp.address}
          pinColor="#8b5cf6" // Violet
        />
      ))}

      {/* Current Location Marker */}
      {currentLocation && (
        <Marker
          coordinate={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          }}
          title="You"
          description="Current location"
          pinColor="#10b981"
        />
      )}

      {/* Route Polyline */}
      {polylineCoords.length > 0 && (
        <Polyline
          coordinates={polylineCoords}
          strokeColor="#6366f1" // Electric Indigo
          strokeWidth={4}
        />
      )}
    </MapView>
  );
};

// Premium dark mode custom styling for Native MapView (Google Maps config)
const darkMapStyle = [
  {
    elementType: "geometry",
    stylers: [{ color: "#0f172a" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#64748b" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#0f172a" }],
  },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1e293b" }],
  },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [{ color: "#475569" }],
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#64748b" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#334155" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1e293b" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#94a3b8" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#475569" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#334155" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#020617" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#475569" }],
  },
];
