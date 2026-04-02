import { ensureFableExtension } from "../src/storage/filePaths";

describe("ensureFableExtension", () => {
  it("adds the .fable extension when missing", () => {
    expect(ensureFableExtension("/tmp/story")).toBe("/tmp/story.fable");
  });

  it("preserves an existing .fable extension", () => {
    expect(ensureFableExtension("/tmp/story.fable")).toBe("/tmp/story.fable");
  });
});

