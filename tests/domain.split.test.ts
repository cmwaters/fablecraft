import { contentText } from "../src/domain/document/content";
import { contentJsonForPlainText } from "../src/domain/document/content";
import { splitCardContentAtTextOffset } from "../src/domain/document/split";

describe("document split helpers", () => {
  it("splits plain text into before and after document fragments", () => {
    const source = contentJsonForPlainText("Alpha beta\n\nGamma delta");
    const splitIndex = "Alpha beta".length;
    const result = splitCardContentAtTextOffset(source, splitIndex, splitIndex);

    expect(contentText(result.before)).toBe("Alpha beta");
    expect(contentText(result.after)).toBe("Gamma delta");
  });

  it("treats all-whitespace results as empty editor documents", () => {
    const source = contentJsonForPlainText("Alpha");
    const result = splitCardContentAtTextOffset(source, 0, "Alpha".length);

    expect(contentText(result.before)).toBe("");
    expect(contentText(result.after)).toBe("");
  });
});
