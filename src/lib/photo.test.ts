import { describe, it, expect } from "vitest";
import { cropSquare } from "./photo";

describe("profile picture crop", () => {
  it("cuts the middle square out of a wide or tall picture", () => {
    expect(cropSquare(400, 200)).toEqual({ sx: 100, sy: 0, side: 200 });
    expect(cropSquare(200, 500)).toEqual({ sx: 0, sy: 150, side: 200 });
    expect(cropSquare(300, 300)).toEqual({ sx: 0, sy: 0, side: 300 });
  });
});
