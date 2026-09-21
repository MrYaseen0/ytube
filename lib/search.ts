/**
 * Search query sanitization.
 *
 * The query is interpolated into a PostgREST `.or()` filter string, so
 * filter metacharacters must be stripped:
 * - `%` and `_` are LIKE wildcards (would broaden matches)
 * - `,` separates filter conditions, `( )` group them, `"` quotes values —
 *   any of these could break out of the intended filter list (filter injection)
 * - `\` is stripped so it can't escape the sanitization itself
 */
export function sanitizeSearchQuery(q: string): string {
  return q.replace(/[%_,()\\"]/g, "");
}
