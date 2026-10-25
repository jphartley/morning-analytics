// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { cleanJournalClipboardHtml, prepareJournalClipboard } from "./journal-clipboard";

function fragment(html: string) {
  const template = document.createElement("template");
  template.innerHTML = html;
  return template.content;
}

describe("journal clipboard cleanup", () => {
  it("preserves headings, emphasis, paragraph order, line breaks and numbered lists", () => {
    const clean = fragment(cleanJournalClipboardHtml(
      '<h1>Morning</h1><p>A <b>bold</b> and <i>quiet</i> day.<br>Next line.</p><ol start="3"><li>Walk</li><li>Write</li></ol>',
    ));
    expect(clean.querySelector("h1")?.textContent).toBe("Morning");
    expect(clean.querySelector("strong")?.textContent).toBe("bold");
    expect(clean.querySelector("em")?.textContent).toBe("quiet");
    expect(clean.querySelector("br")).not.toBeNull();
    expect(clean.querySelector("ol")?.getAttribute("start")).toBe("3");
    expect(Array.from(clean.querySelectorAll("li"), (item) => item.textContent)).toEqual(["Walk", "Write"]);
  });

  it.each([
    ['<h5>Heading</h5>', "h3"],
    ['<p class="MsoHeading1">Heading</p>', "h1"],
    ['<p class="MsoHeading2 other">Heading</p>', "h2"],
    ['<div role="heading" aria-level="3">Heading</div>', "h3"],
  ])("preserves explicit document heading semantics: %s", (source, expected) => {
    const clean = fragment(cleanJournalClipboardHtml(source));
    expect(clean.querySelector(expected)?.textContent).toBe("Heading");
    expect(clean.querySelector("[class],[role],[aria-level]")).toBeNull();
  });

  it("does not infer headings from font size", () => {
    const clean = fragment(cleanJournalClipboardHtml('<p style="font-size:48pt">Large text</p>'));
    expect(clean.querySelector("h1,h2,h3")).toBeNull();
    expect(clean.querySelector("p")?.textContent).toBe("Large text");
  });

  it("preserves document style emphasis and normal weight inside bold wrappers", () => {
    const clean = fragment(cleanJournalClipboardHtml(
      '<b style="font-weight:normal"><span style="font-weight:700">Bold</span> normal <span style="font-style:italic">Italic</span></b>' +
      '<strong>Outer <span style="font-weight:400">plain</span> end</strong>',
    ));
    expect(Array.from(clean.querySelectorAll("strong"), (item) => item.textContent)).toEqual(["Bold", "Outer ", " end"]);
    expect(clean.querySelector("em")?.textContent).toBe("Italic");
    expect(clean.textContent).toBe("Bold normal ItalicOuter plain end");
    expect(clean.querySelector("[style]")).toBeNull();
  });

  it("removes active contents, resource URLs, unsafe attributes and clipboard context", () => {
    const html = cleanJournalClipboardHtml(
      '<h2 id="evil" class="untrusted" data-pm-slice=\'0 0 ["heading",{"level":99}]\' onclick="window.clipboardMarker=1">Safe title</h2>' +
      '<p style="background:url(https://attacker.invalid/track)">Text <a href="javascript:window.clipboardMarker=1">link text</a></p>' +
      '<script>window.clipboardMarker=1</script><style>body{display:none}</style>' +
      '<img src="https://attacker.invalid/image" onerror="window.clipboardMarker=1"><iframe src="https://attacker.invalid/frame">hidden</iframe>' +
      '<svg><script>marker</script></svg><math><mtext>hidden</mtext></math><template><p>hidden</p></template>',
    );
    const clean = fragment(html);
    expect(clean.textContent).toBe("Safe titleText link text");
    expect(clean.querySelector("a,img,iframe,script,style,svg,math,template")).toBeNull();
    expect(clean.querySelector("[data-pm-slice],[onclick],[style],[id],[class],[href],[src]")).toBeNull();
    expect(html).not.toMatch(/attacker|clipboardMarker/);
  });

  it("retains readable layout content and strips invalid list starts", () => {
    const clean = fragment(cleanJournalClipboardHtml('<table><tr><td>First</td><td><b>Second</b></td></tr></table><ol start="not-a-number"><li>Third</li></ol>'));
    expect(clean.textContent).toBe("FirstSecondThird");
    expect(clean.querySelectorAll("p")).toHaveLength(2);
    expect(clean.querySelector("table,td")).toBeNull();
    expect(clean.querySelector("ol")?.hasAttribute("start")).toBe(false);
  });

  it("is stable when the editor's HTML hook cleans an already normalized paste", () => {
    const once = cleanJournalClipboardHtml('<p class="MsoHeading2"><b>Title</b></p><p><span style="font-weight:700">Body</span></p>');
    expect(cleanJournalClipboardHtml(once)).toBe(once);
  });

  it("keeps rich formatting when the clipboard also includes plain text", () => {
    expect(prepareJournalClipboard("<h2>Title</h2><p><b>Body</b></p>", "Title\nBody").kind).toBe("html");
  });

  it("uses text for literal Markdown wrapped in non-semantic clipboard HTML", () => {
    expect(prepareJournalClipboard("<pre># Title\n**Body**</pre>", "# Title\n**Body**"))
      .toEqual({ kind: "text", content: "# Title\n**Body**" });
  });

  it("falls back to plain text when HTML is emptied, and rejects empty clipboard content", () => {
    expect(prepareJournalClipboard('<img src="https://attacker.invalid/">', "Safe text"))
      .toEqual({ kind: "text", content: "Safe text" });
    expect(prepareJournalClipboard("<script>marker</script>", "")).toEqual({ kind: "empty" });
  });

  it("honors an explicit plain-text paste", () => {
    expect(prepareJournalClipboard("<h1>Title</h1>", "Title", true)).toEqual({ kind: "text", content: "Title" });
  });
});
