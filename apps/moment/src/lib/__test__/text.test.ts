import { describe, expect, it } from "vitest";
import { splitTextLinks } from "../text";

describe("splitTextLinks", () => {
  it("keeps plain text unchanged", () => {
    expect(splitTextLinks("A note without links")).toEqual([
      { type: "text", value: "A note without links" },
    ]);
  });

  it("recognizes multiple HTTP links", () => {
    expect(splitTextLinks("See https://example.com/a?q=1 and http://localhost:3000/test")).toEqual([
      { type: "text", value: "See " },
      { type: "link", value: "https://example.com/a?q=1" },
      { type: "text", value: " and " },
      { type: "link", value: "http://localhost:3000/test" },
    ]);
  });

  it("leaves trailing punctuation outside the link", () => {
    expect(splitTextLinks("打开 https://example.com/path，然后继续。")).toEqual([
      { type: "text", value: "打开 " },
      { type: "link", value: "https://example.com/path" },
      { type: "text", value: "，然后继续。" },
    ]);
  });

  it("does not link unsupported protocols", () => {
    expect(splitTextLinks("javascript:alert(1) ftp://example.com")).toEqual([
      { type: "text", value: "javascript:alert(1) ftp://example.com" },
    ]);
  });
});
