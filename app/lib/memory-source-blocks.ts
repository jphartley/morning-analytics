import {
  MAX_MEMORY_EVIDENCE_LENGTH,
  type MemoryInferenceOperation,
  type MemoryUpdateOperation,
} from "./memory-types";

export interface MemorySourceBlock {
  id: string;
  text: string;
  start: number;
  end: number;
}

const MAX_SENTENCES_PER_BLOCK = 3;
const MAX_BLOCK_LENGTH = Math.min(MAX_MEMORY_EVIDENCE_LENGTH, 720);

interface SourceRange {
  start: number;
  end: number;
}

function trimRange(source: string, range: SourceRange): SourceRange | null {
  let { start, end } = range;
  while (start < end && /\s/.test(source[start])) start += 1;
  while (end > start && /\s/.test(source[end - 1])) end -= 1;
  return start < end ? { start, end } : null;
}

function splitLongRange(source: string, range: SourceRange): SourceRange[] {
  const chunks: SourceRange[] = [];
  let start = range.start;

  while (range.end - start > MAX_BLOCK_LENGTH) {
    const hardEnd = start + MAX_BLOCK_LENGTH;
    const candidate = source.slice(start, hardEnd + 1);
    const whitespaceOffset = Math.max(candidate.lastIndexOf(" "), candidate.lastIndexOf("\n"));
    const end = whitespaceOffset > MAX_BLOCK_LENGTH / 2
      ? start + whitespaceOffset
      : hardEnd;
    const trimmed = trimRange(source, { start, end });
    if (trimmed) chunks.push(trimmed);
    start = end;
    while (start < range.end && /\s/.test(source[start])) start += 1;
  }

  const remainder = trimRange(source, { start, end: range.end });
  if (remainder) chunks.push(remainder);
  return chunks;
}

function sentenceRanges(source: string, paragraph: SourceRange): SourceRange[] {
  const text = source.slice(paragraph.start, paragraph.end);
  const ranges: SourceRange[] = [];
  const matcher = /[^.!?]+(?:[.!?]+(?=\s|$)|$)/g;

  for (const match of text.matchAll(matcher)) {
    const start = paragraph.start + (match.index || 0);
    const trimmed = trimRange(source, { start, end: start + match[0].length });
    if (!trimmed) continue;
    ranges.push(...splitLongRange(source, trimmed));
  }

  return ranges.length > 0 ? ranges : splitLongRange(source, paragraph);
}

function paragraphRanges(source: string): SourceRange[] {
  const ranges: SourceRange[] = [];
  const matcher = /\S[\s\S]*?(?=\r?\n[ \t]*\r?\n|$)/g;
  for (const match of source.matchAll(matcher)) {
    const start = match.index || 0;
    const trimmed = trimRange(source, { start, end: start + match[0].length });
    if (trimmed) ranges.push(trimmed);
  }
  return ranges;
}

export function buildMemorySourceBlocks(journalText: string): MemorySourceBlock[] {
  const ranges: SourceRange[] = [];

  for (const paragraph of paragraphRanges(journalText)) {
    const sentences = sentenceRanges(journalText, paragraph);
    let group: SourceRange | null = null;
    let sentenceCount = 0;

    for (const sentence of sentences) {
      const combinedLength = group ? sentence.end - group.start : sentence.end - sentence.start;
      if (
        group
        && (sentenceCount >= MAX_SENTENCES_PER_BLOCK || combinedLength > MAX_BLOCK_LENGTH)
      ) {
        ranges.push(group);
        group = null;
        sentenceCount = 0;
      }

      group = group
        ? { start: group.start, end: sentence.end }
        : { ...sentence };
      sentenceCount += 1;
    }

    if (group) ranges.push(group);
  }

  return ranges.map((range, index) => ({
    id: `b${index + 1}`,
    text: journalText.slice(range.start, range.end),
    start: range.start,
    end: range.end,
  }));
}

export function resolveMemoryInferenceOperations(
  sourceBlocks: MemorySourceBlock[],
  operations: MemoryInferenceOperation[]
): MemoryUpdateOperation[] {
  const blocksById = new Map(sourceBlocks.map((block) => [block.id, block]));

  return operations.map((operation) => {
    const block = blocksById.get(operation.evidence.blockId);
    if (!block) {
      throw new Error(`Memory inference referenced unknown source block ${operation.evidence.blockId}.`);
    }

    const evidence = {
      excerpt: block.text,
      effect: operation.evidence.effect,
    };
    const fields = {
      title: operation.title,
      summary: operation.summary,
      retrievalTerms: operation.retrievalTerms,
      confidence: operation.confidence,
      significance: operation.significance,
      temporalStatus: operation.temporalStatus,
    };
    return operation.action === "create"
      ? { action: "create", ...fields, evidence }
      : { action: "update", memoryId: operation.memoryId, ...fields, evidence };
  });
}
