import axios from 'axios';

const TMAP_API_BASE = 'https://apis.openapi.sk.com/tmap';

// Retrieve the API Key from environment variables
const getApiKey = (): string => {
  const apiKey = process.env.EXPO_PUBLIC_TMAP_API_KEY;
  if (!apiKey) {
    console.error('EXPO_PUBLIC_TMAP_API_KEY is not defined in the environment variables.');
  }
  return apiKey || '';
};

export interface GeocodeResult {
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
 * Geocode a full address string using Tmap's fullAddrGeo API.
 * Ref: GET https://apis.openapi.sk.com/tmap/geo/fullAddrGeo?version=1
 */
export const geocodeAddress = async (address: string): Promise<GeocodeResult> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API Key missing');
  }

  try {
    const response = await axios.get(`${TMAP_API_BASE}/geo/fullAddrGeo`, {
      params: {
        version: 1,
        format: 'json',
        fullAddr: address,
        coordType: 'WGS84GEO',
        addressFlag: 'F00',
      },
      headers: {
        appKey: apiKey,
        Accept: 'application/json',
      },
    });

    const coordInfo = response.data?.coordinateInfo;
    if (!coordInfo) {
      throw new Error('No coordinateInfo found in response');
    }

    // Checking various potential response structures for coordinate fields to ensure resilience
    let latStr = coordInfo.newLat || coordInfo.lat;
    let lonStr = coordInfo.newLon || coordInfo.lon;

    if (!latStr && coordInfo.coordinate && coordInfo.coordinate.length > 0) {
      latStr = coordInfo.coordinate[0].newLat || coordInfo.coordinate[0].lat;
      lonStr = coordInfo.coordinate[0].newLon || coordInfo.coordinate[0].lon;
    }

    if (!latStr || !lonStr) {
      throw new Error('Coordinates missing in API response');
    }

    return {
      address,
      latitude: parseFloat(latStr),
      longitude: parseFloat(lonStr),
    };
  } catch (error: any) {
    console.error('Error in geocodeAddress:', error?.response?.data || error.message);
    throw new Error(
      error?.response?.data?.error?.message || 
      error.message || 
      'Geocoding request failed'
    );
  }
};

/**
 * Optimize a route starting at a start point, visiting multiple via points, and ending at an end point.
 * Ref: POST https://apis.openapi.sk.com/tmap/routes/routeOptimization100?version=1
 */
export const optimizeRoute = async (
  start: { name: string; latitude: number; longitude: number },
  end: { name: string; latitude: number; longitude: number },
  waypoints: Waypoint[]
): Promise<RouteOptimizationResult> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API Key missing');
  }

  try {
    // Format waypoints according to Tmap's payload requirements
    const viaPoints = waypoints.map((wp) => ({
      viaPointId: wp.id,
      viaPointName: wp.name || wp.address || `Stop-${wp.id}`,
      viaX: wp.longitude.toFixed(8),
      viaY: wp.latitude.toFixed(8),
    }));

    const payload = {
      startName: start.name || 'Start Point',
      startX: start.longitude.toFixed(8),
      startY: start.latitude.toFixed(8),
      endName: end.name || 'End Point',
      endX: end.longitude.toFixed(8),
      endY: end.latitude.toFixed(8),
      viaPoints: viaPoints,
    };

    const response = await axios.post(
      `${TMAP_API_BASE}/routes/routeOptimization100?version=1`,
      payload,
      {
        headers: {
          appKey: apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    const features = response.data?.features;
    if (!features || features.length === 0) {
      throw new Error('No features returned from Tmap route optimization');
    }

    // Extract summary properties (distance & duration)
    // The first feature's properties typically contain aggregate metrics
    const properties = features[0]?.properties || {};
    const totalDistanceMeters = parseFloat(properties.totalDistance || 0);
    const totalDurationSeconds = parseFloat(properties.totalTime || properties.totalDuration || 0);

    const totalDistanceKm = totalDistanceMeters / 1000;
    const totalDurationMin = totalDurationSeconds / 60;

    // Parse coordinates from LineString features
    const polylineCoords: { latitude: number; longitude: number }[] = [];
    
    // Track viaPointIds ordered by their optimized index
    const optimizedPoints: { id: string; index: number }[] = [];

    for (const feature of features) {
      const geometry = feature.geometry;
      const props = feature.properties || {};

      if (geometry?.type === 'LineString') {
        const coords = geometry.coordinates;
        if (Array.isArray(coords)) {
          for (const coord of coords) {
            // GeoJSON coordinates order: [longitude, latitude]
            const lon = coord[0];
            const lat = coord[1];
            if (typeof lat === 'number' && typeof lon === 'number') {
              polylineCoords.push({ latitude: lat, longitude: lon });
            }
          }
        }
      } else if (geometry?.type === 'Point' && props.viaPointId) {
        // Collect waypoint indices
        const indexVal = props.index !== undefined ? parseInt(props.index, 10) : -1;
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
    console.error('Error in optimizeRoute:', error?.response?.data || error.message);
    throw new Error(
      error?.response?.data?.error?.message || 
      error.message || 
      'Route optimization request failed'
    );
  }
};
