// @vitest-environment jsdom
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import type { Editor } from "@tiptap/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JournalInput } from "./JournalInput";
import { OriginalEntryDisclosure } from "./OriginalEntryDisclosure";
import { JOURNAL_PASTE_ERROR } from "@/lib/journal-clipboard";
import { dispatchAnalysisMemoryMode, type AnalysisMemoryMode } from "@/lib/analysis-memory-mode";

let root: Root;
let container: HTMLDivElement;

class LocalClipboardEvent extends Event {
  clipboardData: DataTransfer | null;
  constructor(type: string, options: ClipboardEventInit = {}) {
    super(type, options);
    this.clipboardData = options.clipboardData || null;
  }
}

function data(html: string, text: string): DataTransfer {
  return { getData: (type: string) => type === "text/html" ? html : type === "text/plain" ? text : "" } as DataTransfer;
}

function currentEditor(): Editor {
  return (container.querySelector(".tiptap") as HTMLElement & { editor: Editor }).editor;
}

async function paste(html: string, text = "", clipboard = data(html, text)) {
  await act(async () => {
    currentEditor().view.dom.dispatchEvent(new LocalClipboardEvent("paste", {
      bubbles: true, cancelable: true, clipboardData: clipboard,
    }));
  });
}

async function mount(initial = "", disabled = false, onAnalyze = vi.fn()) {
  const changed = vi.fn();
  function Harness() {
    const [value, setValue] = useState(initial);
    return <JournalInput value={value} disabled={disabled} onAnalyze={onAnalyze} onChange={(text) => {
      changed(text);
      setValue(text);
    }} />;
  }
  await act(async () => { root.render(<Harness />); });
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 5)); });
  return { changed, onAnalyze };
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("ClipboardEvent", LocalClipboardEvent);
  const rect = { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) };
  Range.prototype.getBoundingClientRect = () => rect;
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
  HTMLElement.prototype.getClientRects = () => [] as unknown as DOMRectList;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => { root.unmount(); });
  container.remove();
  vi.unstubAllGlobals();
});

describe("JournalInput clipboard boundary", () => {
  it("cleans external metadata before invoking the HTML paste parser", async () => {
    const { changed } = await mount();
    const parser = vi.spyOn(currentEditor().view, "pasteHTML");
    await paste('<h2 data-pm-slice=\'0 0 ["heading",{"level":99}]\' onclick="window.clipboardMarker=1">Morning</h2><p><b>Bold</b></p>', "Morning\nBold");
    expect(parser).toHaveBeenCalledTimes(1);
    expect(parser.mock.calls[0][0]).not.toMatch(/data-pm-slice|onclick|clipboardMarker/);
    expect(container.querySelector(".tiptap h2")?.textContent).toBe("Morning");
    expect(container.querySelector(".tiptap strong")?.textContent).toBe("Bold");
    expect(changed.mock.lastCall?.[0]).toContain("## Morning");
    expect(changed.mock.lastCall?.[0]).toContain("**Bold**");
  });

  it("parses raw Markdown even when the clipboard supplies an unformatted HTML wrapper", async () => {
    await mount();
    const text = "# Title\n\nSome **bold** and *italic* text.\n\n- First\n- Second";
    await paste(`<pre>${text}</pre>`, text);
    expect(container.querySelector(".tiptap h1")?.textContent).toBe("Title");
    expect(container.querySelector(".tiptap strong")?.textContent).toBe("bold");
    expect(container.querySelector(".tiptap em")?.textContent).toBe("italic");
    expect(container.querySelectorAll(".tiptap li")).toHaveLength(2);
  });

  it("uses plain-text fallback without retrying removed HTML", async () => {
    await mount();
    const parser = vi.spyOn(currentEditor().view, "pasteHTML");
    await paste('<img src="https://attacker.invalid/track">', "## Safe fallback\n\n**Bold**");
    expect(parser).not.toHaveBeenCalled();
    expect(container.querySelector(".tiptap h2")?.textContent).toBe("Safe fallback");
    expect(container.querySelector(".tiptap strong")?.textContent).toBe("Bold");
  });

  it("supports an explicit paste without formatting", async () => {
    await mount();
    await act(async () => {
      currentEditor().view.dom.dispatchEvent(new KeyboardEvent("keydown", { key: "V", shiftKey: true, bubbles: true }));
    });
    await paste("<h1>Formatted</h1>", "# Literal");
    expect(container.querySelector(".tiptap h1")).toBeNull();
    expect(currentEditor().getText()).toBe("# Literal");
  });

  it("preserves the selected text on an empty paste and leaves no stale analysis trigger", async () => {
    const { onAnalyze } = await mount("Existing entry");
    await act(async () => { currentEditor().commands.selectAll(); });
    await paste("<script>marker</script>");
    expect(currentEditor().getText()).toBe("Existing entry");
    await act(async () => { currentEditor().commands.insertContent("word ".repeat(301)); });
    expect(onAnalyze).not.toHaveBeenCalled();
  });

  it("reports a clipboard failure without changing content or logging journal fragments", async () => {
    const { onAnalyze } = await mount("Keep this entry");
    const log = vi.spyOn(console, "error");
    const broken = { getData: () => { throw new Error("synthetic journal fragment"); } } as unknown as DataTransfer;
    await paste("", "", broken);
    expect(currentEditor().getText()).toBe("Keep this entry");
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(JOURNAL_PASTE_ERROR);
    expect(log).not.toHaveBeenCalled();
    await act(async () => { currentEditor().commands.insertContent("word ".repeat(301)); });
    expect(onAnalyze).not.toHaveBeenCalled();
  });

  it("replaces only the selection and restores preceding formatting with undo", async () => {
    await mount("**Keep** this text");
    await act(async () => { currentEditor().commands.setTextSelection({ from: 6, to: 10 }); });
    await paste("<strong>new</strong>", "new");
    expect(currentEditor().getText()).toBe("Keep new text");
    await act(async () => { currentEditor().commands.undo(); });
    expect(currentEditor().getText()).toBe("Keep this text");
    expect(container.querySelector(".tiptap strong")?.textContent).toBe("Keep");
  });

  it("cleans external drops without triggering automatic analysis", async () => {
    const { onAnalyze } = await mount();
    vi.spyOn(currentEditor().view, "posAtCoords").mockReturnValue(null);
    await act(async () => {
      const event = new Event("drop", { bubbles: true, cancelable: true });
      Object.defineProperties(event, {
        dataTransfer: { value: data(`<h1 data-pm-slice="bad">Dropped</h1><p><strong>${"word ".repeat(301)}</strong></p>`, "") },
        clientX: { value: 0 }, clientY: { value: 0 },
      });
      currentEditor().view.dom.dispatchEvent(event);
    });
    expect(container.querySelector(".tiptap h1")?.textContent).toBe("Dropped");
    expect(container.querySelector("[data-pm-slice]")).toBeNull();
    expect(onAnalyze).not.toHaveBeenCalled();
  });

  it("does not accept pasted or dropped content while disabled", async () => {
    const { changed, onAnalyze } = await mount("Existing entry", true);
    await paste("<h1>Unexpected</h1>", "Unexpected");
    await act(async () => {
      const event = new Event("drop", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "dataTransfer", { value: data("<h1>Dropped</h1>", "Dropped") });
      currentEditor().view.dom.dispatchEvent(event);
    });
    expect(currentEditor().getText()).toBe("Existing entry");
    expect(changed).not.toHaveBeenCalled();
    expect(onAnalyze).not.toHaveBeenCalled();
  });

  it("does not turn unsupported links into clickable content", async () => {
    await mount();
    await paste('<p>Visit <a href="https://example.test">the site</a>.</p>', "Visit the site.");
    expect(container.querySelector(".tiptap a")).toBeNull();
    expect(currentEditor().getText()).toBe("Visit the site.");
  });

  it("stores supported formatting as Markdown that the history renderer can display", async () => {
    const { changed } = await mount();
    await paste('<h2>Saved morning</h2><p><strong>Bold thought</strong> and <em>quiet thought</em>.</p><ul><li>First</li><li>Second</li></ul>', "Saved morning\nBold thought and quiet thought.\nFirst\nSecond");
    const markdown = changed.mock.lastCall?.[0] as string;
    expect(markdown).not.toContain("<");
    const history = renderToStaticMarkup(<OriginalEntryDisclosure inputText={markdown} />);
    expect(history).toContain("Saved morning</h2>");
    expect(history).toContain("<strong>Bold thought</strong>");
    expect(history).toContain("<em>quiet thought</em>");
    expect(history).toContain("First</li>");
  });

  it.each(["without-memory", "with-memory", "blind-comparison"] as AnalysisMemoryMode[])(
    "submits one cleaned paste through %s mode", async (mode) => {
      const runSingle = vi.fn();
      const runBlindComparison = vi.fn();
      const submit = vi.fn(() => dispatchAnalysisMemoryMode(mode, { runSingle, runBlindComparison }));
      await mount("", false, submit);
      await paste(`<p><strong>${"word ".repeat(300)}</strong></p>`, "word ".repeat(300));
      expect(submit).toHaveBeenCalledTimes(1);
      if (mode === "blind-comparison") {
        expect(runBlindComparison).toHaveBeenCalledTimes(1);
        expect(runSingle).not.toHaveBeenCalled();
      } else {
        expect(runSingle).toHaveBeenCalledExactlyOnceWith(mode);
        expect(runBlindComparison).not.toHaveBeenCalled();
      }
    },
  );

  it("uses visible text rather than Markdown markers for the paste threshold", async () => {
    const { onAnalyze } = await mount();
    await paste(`<h1>Title</h1><p>${"word ".repeat(298)}</p>`, "Title " + "word ".repeat(298));
    expect(onAnalyze).not.toHaveBeenCalled();
    expect(container.textContent).toContain("299 words");
    await paste("", " last");
    expect(onAnalyze).toHaveBeenCalledTimes(1);
  });

  it("submits the new journal after the parent has received the pasted value", async () => {
    const submit = vi.fn();
    function Parent() {
      const [value, setValue] = useState("");
      return <JournalInput value={value} onChange={setValue} onAnalyze={() => submit(value)} disabled={false} />;
    }
    await act(async () => { root.render(<Parent />); });
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 5)); });
    await paste(`<h2>New journal</h2><p><strong>${"word ".repeat(300)}</strong></p>`, "New journal\n" + "word ".repeat(300));
    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit.mock.calls[0][0]).toContain("## New journal");
    expect(submit.mock.calls[0][0]).toContain("**word word");
  });
});
