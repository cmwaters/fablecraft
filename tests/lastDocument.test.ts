import {
  clearLastDocumentPath,
  forgetRecentDocumentPath,
  readLastDocumentPath,
  readRecentDocumentPaths,
  rememberLastDocumentPath,
} from "../src/storage/lastDocument";

describe("lastDocument storage", () => {
  it("persists the last opened document path", () => {
    rememberLastDocumentPath("/tmp/story.fable");

    expect(readLastDocumentPath()).toBe("/tmp/story.fable");
  });

  it("keeps up to five recent document paths in recency order", () => {
    rememberLastDocumentPath("/tmp/one.fable");
    rememberLastDocumentPath("/tmp/two.fable");
    rememberLastDocumentPath("/tmp/three.fable");
    rememberLastDocumentPath("/tmp/four.fable");
    rememberLastDocumentPath("/tmp/five.fable");
    rememberLastDocumentPath("/tmp/six.fable");

    expect(readRecentDocumentPaths()).toEqual([
      "/tmp/six.fable",
      "/tmp/five.fable",
      "/tmp/four.fable",
      "/tmp/three.fable",
      "/tmp/two.fable",
    ]);
  });

  it("forgets a broken recent document path without dropping the others", () => {
    rememberLastDocumentPath("/tmp/one.fable");
    rememberLastDocumentPath("/tmp/two.fable");

    expect(forgetRecentDocumentPath("/tmp/two.fable")).toEqual(["/tmp/one.fable"]);
    expect(readLastDocumentPath()).toBe("/tmp/one.fable");
  });

  it("clears the stored document path", () => {
    rememberLastDocumentPath("/tmp/story.fable");
    clearLastDocumentPath();

    expect(readLastDocumentPath()).toBeNull();
  });
});
