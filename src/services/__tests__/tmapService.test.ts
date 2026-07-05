/// <reference types="jest" />

import axios from "axios";
import { validateAddressExists } from "../tmapService";

jest.mock("axios");

describe("validateAddressExists", () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_TMAP_API_KEY = "test-key";
    jest.clearAllMocks();
  });

  it("returns true when TMAP returns coordinates for a real address", async () => {
    mockedAxios.get.mockResolvedValueOnce({
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

    await expect(
      validateAddressExists("Definitely not a real address"),
    ).resolves.toBe(false);
  });
});
