import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("boundaries", () => {
  it("does not import three or render from game logic", () => {
    const dir = join(dirname(fileURLToPath(import.meta.url)), "../src/game");
    for (const name of readdirSync(dir)) {
      if (!name.endsWith(".ts")) continue;
      const src = readFileSync(join(dir, name), "utf8");
      expect(src.includes("three"), name).toBe(false);
      expect(src.includes("../render"), name).toBe(false);
    }
  });
});
