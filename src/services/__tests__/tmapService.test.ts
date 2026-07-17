/// <reference types="jest" />

import axios from "axios";
import {
  buildRouteOptimizationPayload,
  geocodeAddress,
  optimizeRoute,
  searchPlaceSuggestions,
  validateAddressExists,
} from "../tmapService";

jest.mock("axios");

describe("validateAddressExists", () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_TMAP_API_KEY = "test-key";
    jest.clearAllMocks();
  });

  it("uses a small built-in set of known-good addresses for repeatable tests", async () => {
    mockedAxios.get.mockRejectedValue(new Error("API unavailable"));

    const sampleAddresses = [
      "Seoul City Hall, Seoul, South Korea",
      "Gwanghwamun Plaza, Seoul, South Korea",
      "Myeongdong, Seoul, South Korea",
      "Incheon International Airport, Incheon, South Korea",
    ];

    await Promise.all(
      sampleAddresses.map(async (address) => {
        await expect(validateAddressExists(address)).resolves.toBe(true);
      }),
    );

    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it("returns true when TMAP returns coordinates for a real address", async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        coordinateInfo: {
          newLat: "37.5665",
          newLon: "126.9780",
        },
      },
    } as never);

    await expect(validateAddressExists("Seoul, South Korea")).resolves.toBe(
      true,
    );
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining("/geo/fullAddrGeo"),
      expect.objectContaining({
        params: expect.objectContaining({ fullAddr: "Seoul, South Korea" }),
      }),
    );
  });

  it("returns false when the address cannot be resolved", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("No coordinates found"));
    mockedAxios.get.mockRejectedValueOnce(new Error("No coordinates found"));

    await expect(
      validateAddressExists("Definitely not a real address"),
    ).resolves.toBe(false);
  });

  it("returns TMAP place suggestions for generic location names", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        searchPoiInfo: {
          pois: {
            poi: [
              {
                name: "Costco",
                newAddressList: { newAddress: "123 Example Street" },
                frontLat: "37.5665",
                frontLon: "126.9780",
              },
            ],
          },
        },
      },
    } as never);

    await expect(searchPlaceSuggestions("Costco")).resolves.toEqual([
      {
        name: "Costco",
        address: "123 Example Street",
        latitude: 37.5665,
        longitude: 126.978,
      },
    ]);

    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining("/pois"),
      expect.objectContaining({
        params: expect.objectContaining({ searchKeyword: "Costco" }),
      }),
    );
  });

  it("does not surface [object Object] when TMAP returns nested address data", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        searchPoiInfo: {
          pois: {
            poi: [
              {
                name: "Costco",
                newAddressList: { newAddress: { text: "123 Example Street" } },
                frontLat: "37.5665",
                frontLon: "126.9780",
              },
            ],
          },
        },
      },
    } as never);

    await expect(searchPlaceSuggestions("Costco")).resolves.toEqual([
      {
        name: "Costco",
        address: "123 Example Street",
        latitude: 37.5665,
        longitude: 126.978,
      },
    ]);
  });

  it("resolves generic place names into a real address and coordinates", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        searchPoiInfo: {
          pois: {
            poi: [
              {
                name: "Costco",
                newAddressList: { newAddress: "123 Example Street" },
                frontLat: "37.5665",
                frontLon: "126.9780",
              },
            ],
          },
        },
      },
    } as never);

    await expect(geocodeAddress("Costco")).resolves.toEqual({
      address: "123 Example Street",
      latitude: 37.5665,
      longitude: 126.978,
    });
  });

  it("builds a route optimization payload with all required fields", () => {
    const payload = buildRouteOptimizationPayload(
      {
        name: "Start",
        latitude: 37.5665,
        longitude: 126.978,
      },
      {
        name: "End",
        latitude: 37.5675,
        longitude: 126.979,
      },
      [
        {
          id: "wp-1",
          name: "Gas station",
          address: "Gas station",
          latitude: 37.567,
          longitude: 126.9785,
        },
      ],
    );

    expect(payload).toEqual(
      expect.objectContaining({
        startName: "Start Point",
        startX: "126.97800000",
        startY: "37.56650000",
        endName: "End Point",
        endX: "126.97900000",
        endY: "37.56750000",
        viaPoints: [
          {
            viaPointId: "wp-1",
            viaPointName: "Stop-wp-1",
            viaX: "126.97850000",
            viaY: "37.56700000",
          },
        ],
        searchOption: "0",
        routeOption: "0",
        resCoordType: "WGS84GEO",
        reqCoordType: "WGS84GEO",
      }),
    );
  });

  it("returns an empty optimization result without calling TMAP when there are no waypoints", async () => {
    await expect(
      optimizeRoute(
        {
          name: "Start",
          latitude: 37.5665,
          longitude: 126.978,
        },
        {
          name: "End",
          latitude: 37.5675,
          longitude: 126.979,
        },
        [],
      ),
    ).resolves.toEqual({
      totalDistanceKm: 0,
      totalDurationMin: 0,
      polylineCoords: [],
      optimizedWaypointIds: [],
    });

    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it("uses neutral route labels even when the UI passes full addresses", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        features: [
          {
            geometry: {
              type: "LineString",
              coordinates: [
                [126.978, 37.5665],
                [126.979, 37.5675],
              ],
            },
            properties: {
              totalDistance: 1200,
              totalTime: 180,
            },
          },
          {
            geometry: {
              type: "Point",
            },
            properties: {
              viaPointId: "wp-1",
              index: 0,
            },
          },
        ],
      },
    } as never);

    await optimizeRoute(
      {
        name: "123 Example Street, Seoul",
        latitude: 37.5665,
        longitude: 126.978,
      },
      {
        name: "456 Example Avenue, Seoul",
        latitude: 37.5675,
        longitude: 126.979,
      },
      [
        {
          id: "wp-1",
          name: "Gas station",
          address: "Gas station",
          latitude: 37.567,
          longitude: 126.9785,
        },
      ],
    );

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining("/routes/routeOptimization100"),
      expect.objectContaining({
        startName: "Start Point",
        endName: "End Point",
        viaPoints: [
          expect.objectContaining({
            viaPointId: "wp-1",
            viaPointName: "Stop-wp-1",
          }),
        ],
      }),
      expect.anything(),
    );
  });

  it("optimizes route inputs and sends neutral route labels to TMAP", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        features: [
          {
            geometry: {
              type: "LineString",
              coordinates: [
                [126.978, 37.5665],
                [126.979, 37.5675],
              ],
            },
            properties: {
              totalDistance: 1200,
              totalTime: 180,
            },
          },
          {
            geometry: {
              type: "Point",
            },
            properties: {
              viaPointId: "wp-1",
              index: 0,
            },
          },
        ],
      },
    } as never);

    await expect(
      optimizeRoute(
        {
          name: "Costco",
          latitude: 37.5665,
          longitude: 126.978,
        },
        {
          name: "Target",
          latitude: 37.5675,
          longitude: 126.979,
        },
        [
          {
            id: "wp-1",
            name: "Gas station",
            address: "Gas station",
            latitude: 37.567,
            longitude: 126.9785,
          },
        ],
      ),
    ).resolves.toEqual({
      totalDistanceKm: 1.2,
      totalDurationMin: 3,
      polylineCoords: [
        { latitude: 37.5665, longitude: 126.978 },
        { latitude: 37.5675, longitude: 126.979 },
      ],
      optimizedWaypointIds: ["wp-1"],
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining("/routes/routeOptimization100"),
      expect.objectContaining({
        startName: "Start Point",
        endName: "End Point",
        viaPoints: [
          expect.objectContaining({
            viaPointId: "wp-1",
            viaPointName: "Stop-wp-1",
          }),
        ],
        searchOption: "0",
        routeOption: "0",
        resCoordType: "WGS84GEO",
      }),
      expect.objectContaining({
        headers: expect.objectContaining({ appKey: "test-key" }),
      }),
    );
  });
});
