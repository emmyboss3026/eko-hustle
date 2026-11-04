import { describe, expect, it } from "vitest";
import { cleanCode, showCode } from "./friends";

describe("friend codes", () => {
  it("cleans what people type", () => {
    expect(cleanCode("abcd-efgh")).toBe("ABCDEFGH");
    expect(cleanCode(" ab cd ef gh jk ")).toBe("ABCDEFGH");
    expect(cleanCode("<script>")).toBe("SCRIPT");
  });
  it("shows eight characters in two groups", () => {
    expect(showCode("ABCDEFGH")).toBe("ABCD-EFGH");
    expect(showCode("ABC")).toBe("ABC");
  });
});
