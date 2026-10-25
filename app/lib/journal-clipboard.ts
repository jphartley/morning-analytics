import createDOMPurify from "dompurify";
import { closeHistory } from "@tiptap/pm/history";
import { Selection } from "@tiptap/pm/state";
import { DOMParser as EditorDOMParser } from "@tiptap/pm/model";
import type { EditorProps, EditorView } from "@tiptap/pm/view";

const journalTags = ["p", "br", "h1", "h2", "h3", "strong", "em", "ul", "ol", "li"];
const sourceTags = [
  ...journalTags, "h4", "h5", "h6", "b", "i", "span", "div", "section",
  "article", "main", "header", "footer", "a", "font", "table", "thead",
  "tbody", "tfoot", "tr", "td", "th", "pre", "code",
];
const activeTags = [
  "script", "style", "iframe", "object", "embed", "svg", "math", "template",
  "img", "video", "audio", "source", "link", "meta", "base", "input",
];
const blockSelector = "p,div,section,article,main,header,footer,h1,h2,h3,h4,h5,h6,ul,ol,li,table,pre";

type Emphasis = { bold: boolean; italic: boolean };
export type JournalClipboardContent =
  | { kind: "html" | "text"; content: string }
  | { kind: "empty" };

function headingLevel(element: Element): number | null {
  const tag = /^h([1-6])$/.exec(element.localName);
  const word = /(?:^|\s)MsoHeading([1-6])(?:\s|$)/i.exec(element.getAttribute("class") || "");
  const role = element.getAttribute("role") === "heading"
    ? /^([1-6])$/.exec(element.getAttribute("aria-level") || "")
    : null;
  const level = tag?.[1] || word?.[1] || role?.[1];
  return level ? Math.min(Number(level), 3) : null;
}

function emphasisFor(element: HTMLElement, inherited: Emphasis): Emphasis {
  let bold = inherited.bold || ["b", "strong"].includes(element.localName);
  let italic = inherited.italic || ["i", "em"].includes(element.localName);
  const weight = element.style.fontWeight.trim().toLowerCase();
  const fontStyle = element.style.fontStyle.trim().toLowerCase();
  if (["bold", "bolder"].includes(weight)) bold = true;
  else if (["normal", "lighter"].includes(weight)) bold = false;
  else if (/^\d{1,4}$/.test(weight)) bold = Number(weight) >= 600;
  if (["italic", "oblique"].includes(fontStyle)) italic = true;
  else if (fontStyle === "normal") italic = false;
  return { bold, italic };
}

/** Normalize only an inert, sanitized fragment, then sanitize the result again. */
export function cleanJournalClipboardHtml(html: string): string {
  const purifier = createDOMPurify(window);
  if (!purifier.isSupported) throw new Error("Clipboard cleanup is unavailable.");
  const fragment = purifier.sanitize(html, {
    ALLOWED_TAGS: sourceTags,
    ALLOWED_ATTR: ["style", "class", "role", "aria-level", "start"],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    FORBID_TAGS: activeTags,
    ADD_FORBID_CONTENTS: activeTags,
    RETURN_DOM_FRAGMENT: true,
  });
  const doc = fragment.ownerDocument;
  const output = doc.createElement("div");

  function append(node: Node, parent: Node, inherited: Emphasis) {
    if (node.nodeType === 3) {
      let text: Node = doc.createTextNode(node.textContent || "");
      for (const tag of [inherited.italic ? "em" : null, inherited.bold ? "strong" : null]) {
        if (!tag) continue;
        const mark = doc.createElement(tag);
        mark.appendChild(text);
        text = mark;
      }
      parent.appendChild(text);
      return;
    }
    if (node.nodeType !== 1) return;
    const element = node as HTMLElement;
    const name = element.localName;
    const level = headingLevel(element);
    let tag: string | null = level ? `h${level}` : null;
    if (!tag && ["p", "br", "ul", "ol", "li"].includes(name)) tag = name;
    if (!tag && ["div", "section", "article", "main", "header", "footer", "td", "th", "pre"].includes(name)
      && !element.querySelector(blockSelector)) tag = "p";
    const target = tag ? doc.createElement(tag) : parent;
    if (tag === "ol") {
      const start = element.getAttribute("start") || "";
      if (/^-?\d+$/.test(start) && Number.isSafeInteger(Number(start))) {
        (target as Element).setAttribute("start", String(Number(start)));
      }
    }
    if (tag) parent.appendChild(target);
    const emphasis = emphasisFor(element, inherited);
    for (const child of Array.from(element.childNodes)) append(child, target, emphasis);
  }

  for (const child of Array.from(fragment.childNodes)) append(child, output, { bold: false, italic: false });
  return purifier.sanitize(output.innerHTML, {
    ALLOWED_TAGS: journalTags,
    ALLOWED_ATTR: ["start"],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
  });
}

export function prepareJournalClipboard(html: string, text: string, plainText = false): JournalClipboardContent {
  if (html && !plainText) {
    const cleaned = cleanJournalClipboardHtml(html);
    const template = document.createElement("template");
    template.innerHTML = cleaned;
    if (template.content.textContent?.trim()) {
      // Clipboard HTML often just wraps literal Markdown in a span or pre.
      if (!text.trim() || template.content.querySelector("h1,h2,h3,strong,em,ul,ol")) {
        return { kind: "html", content: cleaned };
      }
    }
  }
  return text.trim() ? { kind: "text", content: text } : { kind: "empty" };
}

export const JOURNAL_PASTE_ERROR = "We couldn't paste that content. Your existing entry is unchanged. Try copying it as plain text.";

/** Intercept native events before ProseMirror parses clipboard HTML or metadata. */
export function createJournalClipboardController(
  onError: (message: string | null) => void,
) {
  let externalDrop = false;
  let plainTextPaste = false;
  let parseMarkdown: ((text: string) => string) | null = null;

  function insert(view: EditorView, event: ClipboardEvent | DragEvent, data: DataTransfer | null, drop: boolean) {
    event.preventDefault();
    if (!view.editable) return true;
    onError(null);
    try {
      const content = prepareJournalClipboard(
        data?.getData("text/html") || "",
        data?.getData("text/plain") || "",
        !drop && plainTextPaste,
      );
      if (content.kind === "empty") return true;
      if (drop) {
        const position = view.posAtCoords({ left: (event as DragEvent).clientX, top: (event as DragEvent).clientY });
        if (position) view.dispatch(view.state.tr.setSelection(Selection.near(view.state.doc.resolve(position.pos))));
      }
      view.dispatch(closeHistory(view.state.tr));
      externalDrop = drop;
      if (content.kind === "html") view.pasteHTML(content.content);
      else view.pasteText(content.content);
    } catch {
      // Never log the exception: parser errors can contain journal fragments.
      onError(JOURNAL_PASTE_ERROR);
    } finally {
      externalDrop = false;
    }
    return true;
  }

  const editorProps: Pick<EditorProps, "handleDOMEvents" | "transformPastedHTML" | "clipboardTextParser"> = {
    transformPastedHTML: cleanJournalClipboardHtml,
    clipboardTextParser: (text, context, _plainText, view) => {
      const container = document.createElement("div");
      if (plainTextPaste) {
        for (const line of text.split(/\r?\n/)) {
          const paragraph = document.createElement("p");
          paragraph.textContent = line;
          container.appendChild(paragraph);
        }
      } else {
        if (!parseMarkdown) throw new Error("Editor is not ready.");
        container.innerHTML = cleanJournalClipboardHtml(parseMarkdown(text));
      }
      return EditorDOMParser.fromSchema(view.state.schema).parseSlice(container, { context, preserveWhitespace: true });
    },
    handleDOMEvents: {
      keydown: (_view, event) => { plainTextPaste = event.shiftKey; return false; },
      keyup: (_view, event) => { plainTextPaste = event.shiftKey; return false; },
      blur: () => { plainTextPaste = false; return false; },
      paste: (view, event) => insert(view, event, event.clipboardData, false),
      drop: (view, event) => view.dragging ? false : insert(view, event, event.dataTransfer, true),
    },
  };
  return {
    editorProps,
    isExternalDrop: () => externalDrop,
    setMarkdownParser: (parser: ((text: string) => string) | null) => { parseMarkdown = parser; },
  };
}
