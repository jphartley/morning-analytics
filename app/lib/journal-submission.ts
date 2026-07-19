export function countJournalWords(value: string): number {
  return value.split(/\s+/).filter(Boolean).length;
}

export function shouldAutoAnalyzePastedJournal(
  value: string,
  disabled: boolean
): boolean {
  return !disabled && countJournalWords(value) >= 300;
}
