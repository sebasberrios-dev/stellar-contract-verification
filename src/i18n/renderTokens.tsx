import type { ReactNode } from "react";

/**
 * Renders a translated string whose {token} markers become inline code.
 * Tokens carry technical text (flags, paths, field names) that stays
 * identical in every language.
 */
export function renderTokens(
  text: string,
  renderCode: (code: string, key: number) => ReactNode,
): ReactNode[] {
  return text
    .split(/\{([^}]+)\}/g)
    .map((part, i) => (i % 2 === 1 ? renderCode(part, i) : part));
}
