import { createStopId } from "../routeStopId";

describe("createStopId", () => {
  it("returns unique ids for consecutive stops", () => {
    const first = createStopId();
    const second = createStopId();

    expect(first).toMatch(/^stop-/);
    expect(second).toMatch(/^stop-/);
    expect(first).not.toEqual(second);
  });
});
