import { describe, expect, it } from "vitest";
import { selectNeighborId } from "./history-neighbor";

// Newest-first ordering, as loaded by the sidebar.
const ORDERED_IDS = ["A", "B", "C"];

describe("selectNeighborId", () => {
  it("Scenario: Deleting the selected analysis chooses the next logical view — middle entry prefers the newer neighbor", () => {
    // Deleting "B" (between "A" newer and "C" older) selects "A", the newer neighbor.
    expect(selectNeighborId(ORDERED_IDS, "B")).toBe("A");
  });

  it("Scenario: Deleting the selected analysis chooses the next logical view — newest entry falls back to the next-older neighbor", () => {
    // No newer neighbor exists for the newest entry; falls back to the older one.
    expect(selectNeighborId(ORDERED_IDS, "A")).toBe("B");
  });

  it("Scenario: Deleting the selected analysis chooses the next logical view — deleting the only remaining analysis returns to new-analysis state", () => {
    expect(selectNeighborId(["A"], "A")).toBeNull();
  });

  it("Scenario: Deleting the selected analysis chooses the next logical view — unknown id is defensively handled", () => {
    expect(selectNeighborId(ORDERED_IDS, "not-in-list")).toBeNull();
  });

  it("returns null for an empty list", () => {
    expect(selectNeighborId([], "A")).toBeNull();
  });
});
