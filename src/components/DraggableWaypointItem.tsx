import React from "react";
import { Text, View } from "react-native";
import { PanGestureHandler, RectButton } from "react-native-gesture-handler";
import Animated, {
    runOnJS,
    useAnimatedGestureHandler,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import { AddressInputCard } from "./AddressInputCard";

interface DraggableWaypointItemProps {
  id: string;
  index: number;
  address: string;
  resolved: boolean;
  onChangeAddress: (id: string, address: string) => void;
  onResolve: (id: string) => Promise<void>;
  onRemove: (id: string) => void;
  savedAddresses: string[];
  onSelectSavedAddress: (address: string) => void;
  onRemoveSavedAddress: (address: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  totalWaypoints: number;
}

const DRAG_THRESHOLD = 50;

export const DraggableWaypointItem: React.FC<DraggableWaypointItemProps> = ({
  id,
  index,
  address,
  resolved,
  onChangeAddress,
  onResolve,
  onRemove,
  savedAddresses,
  onSelectSavedAddress,
  onRemoveSavedAddress,
  onReorder,
  totalWaypoints,
}) => {
  const offsetY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      isDragging.value = true;
    },
    onActive: (event) => {
      offsetY.value = event.translationY;
    },
    onEnd: (event) => {
      const newIndex = Math.max(
        0,
        Math.min(
          totalWaypoints - 1,
          index + Math.round(event.translationY / 60),
        ),
      );

      if (Math.abs(event.translationY) > DRAG_THRESHOLD && newIndex !== index) {
        runOnJS(onReorder)(index, newIndex);
      }

      offsetY.value = withSpring(0);
      isDragging.value = false;
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: offsetY.value }],
      opacity: isDragging.value ? 0.7 : 1,
    };
  });

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={animatedStyle} className="mb-4">
        <View className="flex-row items-center">
          {/* Drag Handle */}
          <View className="pr-2 py-3">
            <Text className="text-slate-500 text-lg">≡</Text>
          </View>

          {/* Input Card */}
          <View className="flex-1">
            <AddressInputCard
              label={`📍 Waypoint ${index + 1}`}
              value={address}
              onChangeText={(text) => onChangeAddress(id, text)}
              onResolve={() => onResolve(id)}
              resolved={resolved}
              placeholder={`Enter waypoint ${index + 1}`}
              accentColor="indigo"
              savedAddresses={savedAddresses}
              showSavedAddresses
              onSelectSavedAddress={(addr) => {
                onSelectSavedAddress(addr);
                onChangeAddress(id, addr);
              }}
              onRemoveSavedAddress={onRemoveSavedAddress}
              headerRight={
                <RectButton
                  onPress={() => onRemove(id)}
                  className="bg-red-500/10 active:bg-red-500/20 px-3 py-1.5 rounded-lg min-h-[44] items-center justify-center"
                  style={{ minHeight: 44 }}
                  accessibilityLabel={`Delete Waypoint ${index + 1}`}
                >
                  <Text className="text-red-500 text-xs font-bold">❌</Text>
                </RectButton>
              }
            />
          </View>
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
};
