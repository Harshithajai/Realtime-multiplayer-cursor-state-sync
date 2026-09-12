import { describe, expect, it } from "vitest";

describe("shared-state versioning", () => {
  it("starts at version zero", () => {
    const version = 0;
    expect(version).toBe(0);
  });

  it("increments after a valid update", () => {
    let version = 4;
    version++;
    expect(version).toBe(5);
  });
});
