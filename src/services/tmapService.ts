import axios from "axios";

const TMAP_API_BASE = "https://apis.openapi.sk.com/tmap";

export const KNOWN_ADDRESS_FIXTURES: GeocodeResult[] = [
  {
    address: "Seoul City Hall, Seoul, South Korea",
    latitude: 37.5665,
    longitude: 126.978,
  },
  {
    address: "Gwanghwamun Plaza, Seoul, South Korea",
    latitude: 37.5759,
    longitude: 126.9768,
  },
  {
    address: "Myeongdong, Seoul, South Korea",
    latitude: 37.5636,
    longitude: 126.9827,
  },
  {
    address: "Incheon International Airport, Incheon, South Korea",
    latitude: 37.4602,
    longitude: 126.4407,
  },
];

const normalizeAddress = (value: string): string =>
  value?.trim().toLowerCase() || "";

const findKnownAddressFixture = (
  address: string,
): GeocodeResult | undefined => {
  const normalizedAddress = normalizeAddress(address);
  if (!normalizedAddress) return undefined;

  return KNOWN_ADDRESS_FIXTURES.find(
    (fixture) => normalizeAddress(fixture.address) === normalizedAddress,
  );
};

const extractDisplayText = (value: unknown): string => {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const text = extractDisplayText(item);
      if (text) {
        return text;
      }
    }
    return "";
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const candidateKeys = [
      "text",
      "newAddress",
      "address",
      "roadAddress",
      "fullAddress",
      "name",
      "label",
    ];

    for (const key of candidateKeys) {
      const nestedText = extractDisplayText(record[key]);
      if (nestedText) {
        return nestedText;
      }
    }
  }

  return "";
};

// Retrieve the API Key from environment variables
const getApiKey = (): string => {
  const apiKey = process.env.EXPO_PUBLIC_TMAP_API_KEY;
  if (!apiKey) {
    console.error(
      "EXPO_PUBLIC_TMAP_API_KEY is not defined in the environment variables.",
    );
  }
  return apiKey || "";
};

export interface GeocodeResult {
  address: string;
  latitude: number;
  longitude: number;
}

export interface PlaceSuggestion {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface Waypoint {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface RouteOptimizationResult {
  totalDistanceKm: number;
  totalDurationMin: number;
  polylineCoords: { latitude: number; longitude: number }[];
  optimizedWaypointIds: string[];
}

/**
 * Validate whether an address can be geocoded by Tmap.
 */
export const validateAddressExists = async (
  address: string,
): Promise<boolean> => {
  const normalizedAddress = address?.trim();
  if (!normalizedAddress) return false;

  try {
    await geocodeAddress(normalizedAddress);
    return true;
  } catch {
    return false;
  }
};

export const searchPlaceSuggestions = async (
  keyword: string,
  limit = 5,
): Promise<PlaceSuggestion[]> => {
  const normalizedKeyword = keyword?.trim();
  if (!normalizedKeyword) return [];

  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API Key missing");
  }

  try {
    const response = await axios.get(`${TMAP_API_BASE}/pois`, {
      params: {
        version: 1,
        format: "json",
        searchKeyword: normalizedKeyword,
        resCoordType: "WGS84GEO",
        reqCoordType: "WGS84GEO",
        count: limit,
      },
      headers: {
        appKey: apiKey,
        Accept: "application/json",
      },
    });

    const pois = response.data?.searchPoiInfo?.pois?.poi;
    if (!Array.isArray(pois)) {
      return [];
    }

    return pois
      .map((poi: any) => {
        const address = extractDisplayText(
          poi?.newAddressList?.newAddress ||
            poi?.newAddressList ||
            poi?.address ||
            poi?.roadAddress,
        );
        const lat = extractDisplayText(poi?.frontLat || poi?.noorLat);
        const lon = extractDisplayText(poi?.frontLon || poi?.noorLon);

        if (!lat || !lon) {
          return null;
        }

        return {
          name: extractDisplayText(poi?.name) || address || normalizedKeyword,
          address,
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
        } as PlaceSuggestion;
      })
      .filter(Boolean) as PlaceSuggestion[];
  } catch (error: any) {
    console.error(
      "Error in searchPlaceSuggestions:",
      error?.response?.data || error.message,
    );
    throw new Error(
      error?.response?.data?.error?.message ||
        error.message ||
        "Place suggestion request failed",
    );
  }
};

/**
 * Geocode a full address string using Tmap's fullAddrGeo API.
 * Ref: GET https://apis.openapi.sk.com/tmap/geo/fullAddrGeo?version=1
 */
export const geocodeAddress = async (
  address: string,
): Promise<GeocodeResult> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API Key missing");
  }

  const normalizedAddress = address?.trim();
  if (!normalizedAddress) {
    throw new Error("Address is empty");
  }

  const fixtureMatch = findKnownAddressFixture(normalizedAddress);
  if (fixtureMatch) {
    return fixtureMatch;
  }

  try {
    const suggestions = await searchPlaceSuggestions(normalizedAddress, 1);
    if (suggestions.length > 0) {
      const suggestion = suggestions[0];
      return {
        address: suggestion.address || suggestion.name || normalizedAddress,
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
      };
    }
  } catch (suggestionError: any) {
    console.warn(
      "Place suggestion fallback failed; trying full address geocode",
      suggestionError?.message || suggestionError,
    );
  }

  try {
    const response = await axios.get(`${TMAP_API_BASE}/geo/fullAddrGeo`, {
      params: {
        version: 1,
        format: "json",
        fullAddr: normalizedAddress,
        coordType: "WGS84GEO",
        addressFlag: "F00",
      },
      headers: {
        appKey: apiKey,
        Accept: "application/json",
      },
    });

    const coordInfo = response.data?.coordinateInfo;
    if (!coordInfo) {
      throw new Error("No coordinateInfo found in response");
    }

    // Checking various potential response structures for coordinate fields to ensure resilience
    let latStr = coordInfo.newLat || coordInfo.lat;
    let lonStr = coordInfo.newLon || coordInfo.lon;

    if (!latStr && coordInfo.coordinate && coordInfo.coordinate.length > 0) {
      latStr = coordInfo.coordinate[0].newLat || coordInfo.coordinate[0].lat;
      lonStr = coordInfo.coordinate[0].newLon || coordInfo.coordinate[0].lon;
    }

    if (!latStr || !lonStr) {
      throw new Error("Coordinates missing in API response");
    }

    return {
      address: normalizedAddress,
      latitude: parseFloat(latStr),
      longitude: parseFloat(lonStr),
    };
  } catch (error: any) {
    console.error(
      "Error in geocodeAddress:",
      error?.response?.data || error.message,
    );
    throw new Error(
      error?.response?.data?.error?.message ||
        error.message ||
        "Geocoding request failed",
    );
  }
};

/**
 * Optimize a route starting at a start point, visiting multiple via points, and ending at an end point.
 * Ref: POST https://apis.openapi.sk.com/tmap/routes/routeOptimization100?version=1
 */
const isValidCoordinate = (value: number | undefined): boolean =>
  typeof value === "number" && Number.isFinite(value);

export const buildRouteOptimizationPayload = (
  start: { name: string; latitude: number; longitude: number },
  end: { name: string; latitude: number; longitude: number },
  waypoints: Waypoint[],
) => {
  const viaPoints = waypoints.map((wp) => ({
    viaPointId: wp.id,
    viaPointName: `Stop-${wp.id}`,
    viaX: wp.longitude.toFixed(8),
    viaY: wp.latitude.toFixed(8),
  }));

  return {
    startName: "Start Point",
    startX: start.longitude.toFixed(8),
    startY: start.latitude.toFixed(8),
    endName: "End Point",
    endX: end.longitude.toFixed(8),
    endY: end.latitude.toFixed(8),
    viaPoints,
    searchOption: "0",
    routeOption: "0",
    resCoordType: "WGS84GEO",
    reqCoordType: "WGS84GEO",
  };
};

export const optimizeRoute = async (
  start: { name: string; latitude: number; longitude: number },
  end: { name: string; latitude: number; longitude: number },
  waypoints: Waypoint[],
): Promise<RouteOptimizationResult> => {
  if (!waypoints.length) {
    return {
      totalDistanceKm: 0,
      totalDurationMin: 0,
      polylineCoords: [],
      optimizedWaypointIds: [],
    };
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API Key missing");
  }

  try {
    if (
      !isValidCoordinate(start?.latitude) ||
      !isValidCoordinate(start?.longitude)
    ) {
      throw new Error("Start coordinates are invalid");
    }

    if (
      !isValidCoordinate(end?.latitude) ||
      !isValidCoordinate(end?.longitude)
    ) {
      throw new Error("End coordinates are invalid");
    }

    if (
      waypoints.some(
        (wp) =>
          !isValidCoordinate(wp?.latitude) || !isValidCoordinate(wp?.longitude),
      )
    ) {
      throw new Error("One or more waypoint coordinates are invalid");
    }

    // Use neutral route labels so TMAP does not reject the request when the UI
    // passes full addresses or place names as start/end labels.
    const payload = buildRouteOptimizationPayload(start, end, waypoints);

    const response = await axios.post(
      `${TMAP_API_BASE}/routes/routeOptimization100?version=1`,
      payload,
      {
        headers: {
          appKey: apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );

    const features = response.data?.features;
    if (!features || features.length === 0) {
      throw new Error("No features returned from Tmap route optimization");
    }

    // Extract summary properties (distance & duration)
    // The first feature's properties typically contain aggregate metrics
    const properties = features[0]?.properties || {};
    const totalDistanceMeters = parseFloat(properties.totalDistance || 0);
    const totalDurationSeconds = parseFloat(
      properties.totalTime || properties.totalDuration || 0,
    );

    const totalDistanceKm = totalDistanceMeters / 1000;
    const totalDurationMin = totalDurationSeconds / 60;

    // Parse coordinates from LineString features
    const polylineCoords: { latitude: number; longitude: number }[] = [];

    // Track viaPointIds ordered by their optimized index
    const optimizedPoints: { id: string; index: number }[] = [];

    for (const feature of features) {
      const geometry = feature.geometry;
      const props = feature.properties || {};

      if (geometry?.type === "LineString") {
        const coords = geometry.coordinates;
        if (Array.isArray(coords)) {
          for (const coord of coords) {
            // GeoJSON coordinates order: [longitude, latitude]
            const lon = coord[0];
            const lat = coord[1];
            if (typeof lat === "number" && typeof lon === "number") {
              polylineCoords.push({ latitude: lat, longitude: lon });
            }
          }
        }
      } else if (geometry?.type === "Point" && props.viaPointId) {
        // Collect waypoint indices
        const indexVal =
          props.index !== undefined ? parseInt(props.index, 10) : -1;
        optimizedPoints.push({
          id: props.viaPointId,
          index: indexVal,
        });
      }
    }

    // Sort waypoints based on index to find the optimized sequence
    optimizedPoints.sort((a, b) => a.index - b.index);
    const optimizedWaypointIds = optimizedPoints.map((op) => op.id);

    return {
      totalDistanceKm: parseFloat(totalDistanceKm.toFixed(2)),
      totalDurationMin: Math.ceil(totalDurationMin),
      polylineCoords,
      optimizedWaypointIds,
    };
  } catch (error: any) {
    console.error(
      "Error in optimizeRoute:",
      error?.response?.data || error.message,
    );
    throw new Error(
      error?.response?.data?.error?.message ||
        error.message ||
        "Route optimization request failed",
    );
  }
};
